// Statement-level fundamentals: canonical line-item resolution + growth rates.
//
// Ported from cfa-agent-langgraph/backend/app/agent/tools.py (format_df_to_clean_dict
// and compute_growth_rates). The Python version leaned on a pandas DataFrame
// indexed by line-item name with one column per reporting period; the same shape
// is expressed here as a plain rows-by-name / columns-by-period object so the
// functions stay pure and provider-agnostic (Alpha Vantage today, anything else
// later). Everything below is deterministic arithmetic — no network, no env.

/** Raw statement: line-item name -> (period label -> value). */
export type RawStatement = Record<string, Record<string, number | string | null | undefined>>;

export interface CleanedStatement {
  /** Period labels, newest first. */
  periods: string[];
  /** Canonical field name -> period label -> numeric value. */
  rows: Record<string, Record<string, number>>;
  /** Canonical field name -> the raw alias it was resolved from. */
  resolvedAliases: Record<string, string>;
}

export interface GrowthRate {
  metricName: string;
  latestPeriod: string;
  latestValue: number;
  previousPeriod: string;
  previousValue: number;
  qoqGrowthPct: number | null;
  yoyPeriod: string | null;
  yoyValue: number | null;
  yoyGrowthPct: number | null;
}

export interface DCFInputs {
  currentFCF: number | null;
  netDebt: number | null;
  sharesOutstanding: number | null;
  /** Which canonical fields were missing, so a caller can explain the gaps. */
  missing: string[];
}

// Canonical field -> accepted aliases, most specific first. Covers the yfinance
// labels the donor handled plus the Alpha Vantage camelCase keys, since both
// feed the same cleaner.
export const CANONICAL_ALIASES: Record<string, string[]> = {
  revenue: [
    "Total Revenue",
    "Operating Revenue",
    "Revenue",
    "totalRevenue",
    "operatingRevenue",
  ],
  costOfRevenue: ["Cost Of Revenue", "Cost of Revenue", "costOfRevenue", "costofGoodsAndServicesSold"],
  grossProfit: ["Gross Profit", "grossProfit"],
  operatingIncome: ["Operating Income", "Operating Income Or Loss", "operatingIncome"],
  ebitda: ["EBITDA", "Normalized EBITDA", "ebitda"],
  ebit: ["EBIT", "ebit"],
  netIncome: [
    "Net Income",
    "Net Profit",
    "Net Income Common Stockholders",
    "netIncome",
    "netIncomeApplicableToCommonShares",
  ],
  interestExpense: ["Interest Expense", "interestExpense"],
  incomeTaxExpense: ["Tax Provision", "Income Tax Expense", "incomeTaxExpense"],
  depreciationAndAmortization: [
    "Depreciation And Amortization",
    "Depreciation Amortization Depletion",
    "depreciationAndAmortization",
    "depreciationDepletionAndAmortization",
  ],
  totalAssets: ["Total Assets", "totalAssets"],
  totalLiabilities: [
    "Total Liabilities Net Minority Interest",
    "Total Liabilities",
    "totalLiabilities",
  ],
  totalEquity: [
    "Total Equity Gross Minority Interest",
    "Stockholders Equity",
    "Total Stockholder Equity",
    "totalShareholderEquity",
  ],
  cashAndEquivalents: [
    "Cash And Cash Equivalents",
    "Cash Cash Equivalents And Short Term Investments",
    "cashAndCashEquivalentsAtCarryingValue",
    "cashAndShortTermInvestments",
  ],
  shortTermDebt: ["Current Debt", "Short Long Term Debt", "shortTermDebt", "currentDebt"],
  longTermDebt: ["Long Term Debt", "longTermDebt", "longTermDebtNoncurrent"],
  totalDebt: ["Total Debt", "totalDebt"],
  sharesOutstanding: [
    "Share Issued",
    "Ordinary Shares Number",
    "commonStockSharesOutstanding",
    "commonStock",
  ],
  operatingCashFlow: [
    "Operating Cash Flow",
    "Total Cash From Operating Activities",
    "operatingCashflow",
  ],
  capitalExpenditure: ["Capital Expenditure", "capitalExpenditures"],
  freeCashFlow: ["Free Cash Flow", "freeCashFlow"],
};

/** Alias lookup is case- and separator-insensitive so "Total Revenue" matches "totalRevenue". */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  // Alpha Vantage returns "None" for unreported items, not null.
  if (!trimmed || trimmed === "None" || trimmed === "-") return null;
  const parsed = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Resolve a canonical field against a raw statement's line-item names.
 * Returns the matching raw key, or null when no alias is present.
 */
export function resolveAlias(statement: RawStatement, canonicalField: string): string | null {
  const aliases = CANONICAL_ALIASES[canonicalField];
  if (!aliases) return null;

  const byNormalized = new Map<string, string>();
  for (const rawKey of Object.keys(statement)) {
    const normalized = normalizeKey(rawKey);
    // First writer wins: the raw statement's own ordering breaks ties, and an
    // exact-cased duplicate should never displace the key we already indexed.
    if (!byNormalized.has(normalized)) byNormalized.set(normalized, rawKey);
  }

  for (const alias of aliases) {
    const hit = byNormalized.get(normalizeKey(alias));
    if (hit !== undefined) return hit;
  }
  return null;
}

/**
 * Collapse a raw statement onto canonical field names, dropping non-numeric
 * cells and any field with no usable values. `periods` is ordered newest-first
 * (lexical descending on the ISO-ish fiscalDateEnding labels the providers emit),
 * which is the ordering computeGrowthRates assumes.
 */
export function cleanStatement(statement: RawStatement, maxPeriods: number = 8): CleanedStatement {
  const empty: CleanedStatement = { periods: [], rows: {}, resolvedAliases: {} };
  if (!statement || typeof statement !== "object") return empty;

  const periodSet = new Set<string>();
  for (const row of Object.values(statement)) {
    if (row && typeof row === "object") {
      for (const period of Object.keys(row)) periodSet.add(period);
    }
  }
  // Guard maxPeriods: a caller passing 0 or a negative would otherwise slice to
  // an empty (or, for negatives, tail-end) window and silently drop everything.
  const limit = Number.isFinite(maxPeriods) && maxPeriods > 0 ? Math.floor(maxPeriods) : 8;
  const periods = Array.from(periodSet).sort().reverse().slice(0, limit);
  if (periods.length === 0) return empty;

  const rows: Record<string, Record<string, number>> = {};
  const resolvedAliases: Record<string, string> = {};

  for (const canonicalField of Object.keys(CANONICAL_ALIASES)) {
    const rawKey = resolveAlias(statement, canonicalField);
    if (!rawKey) continue;

    const rawRow = statement[rawKey];
    const cleanedRow: Record<string, number> = {};
    for (const period of periods) {
      const num = toFiniteNumber(rawRow?.[period]);
      if (num !== null) cleanedRow[period] = round2(num);
    }

    if (Object.keys(cleanedRow).length > 0) {
      rows[canonicalField] = cleanedRow;
      resolvedAliases[canonicalField] = rawKey;
    }
  }

  return { periods, rows, resolvedAliases };
}

function pctChange(latest: number, base: number): number | null {
  // A zero base makes the percentage meaningless, not infinite. abs() on the
  // denominator keeps the sign correct when the base is a loss.
  if (base === 0) return null;
  return round2(((latest - base) / Math.abs(base)) * 100);
}

/**
 * QoQ (period 0 vs 1) and YoY (period 0 vs 4) growth per canonical field.
 * With annual statements pass `yoyLag: 1` so the "YoY" column is the prior year.
 */
export function computeGrowthRates(
  cleaned: CleanedStatement,
  fields: string[] = ["revenue", "netIncome", "ebitda", "operatingIncome"],
  yoyLag: number = 4
): Record<string, GrowthRate> {
  const results: Record<string, GrowthRate> = {};
  const { periods, rows } = cleaned;
  if (periods.length < 2) return results;

  const latestPeriod = periods[0];
  const previousPeriod = periods[1];
  const yoyPeriod = periods.length > yoyLag ? periods[yoyLag] : null;

  for (const field of fields) {
    const row = rows[field];
    if (!row) continue;

    const latestValue = row[latestPeriod];
    const previousValue = row[previousPeriod];
    if (latestValue === undefined || previousValue === undefined) continue;

    const yoyValue = yoyPeriod !== null ? row[yoyPeriod] ?? null : null;

    results[field] = {
      metricName: cleaned.resolvedAliases[field] ?? field,
      latestPeriod,
      latestValue,
      previousPeriod,
      previousValue,
      qoqGrowthPct: pctChange(latestValue, previousValue),
      yoyPeriod: yoyValue !== null ? yoyPeriod : null,
      yoyValue,
      yoyGrowthPct: yoyValue !== null ? pctChange(latestValue, yoyValue) : null,
    };
  }

  return results;
}

function latestValue(cleaned: CleanedStatement, field: string): number | null {
  const row = cleaned.rows[field];
  if (!row) return null;
  for (const period of cleaned.periods) {
    const value = row[period];
    if (value !== undefined) return value;
  }
  return null;
}

/**
 * Derive the three inputs the DCF route requires from cleaned statements, so a
 * valuation can be driven from reported figures instead of hand-entered ones.
 *
 * FCF = operating cash flow - capex. Alpha Vantage reports capex as a positive
 * magnitude while yfinance reports it negative, so the absolute value is
 * subtracted either way. Net debt = total debt (or short + long term) - cash.
 */
export function extractDCFInputs(
  income: CleanedStatement,
  balance: CleanedStatement,
  cashFlow?: CleanedStatement
): DCFInputs {
  const missing: string[] = [];

  let currentFCF = cashFlow ? latestValue(cashFlow, "freeCashFlow") : null;
  if (currentFCF === null && cashFlow) {
    const ocf = latestValue(cashFlow, "operatingCashFlow");
    const capex = latestValue(cashFlow, "capitalExpenditure");
    if (ocf !== null && capex !== null) currentFCF = round2(ocf - Math.abs(capex));
  }
  if (currentFCF === null) missing.push("currentFCF");

  let totalDebt = latestValue(balance, "totalDebt");
  if (totalDebt === null) {
    const shortTerm = latestValue(balance, "shortTermDebt");
    const longTerm = latestValue(balance, "longTermDebt");
    if (shortTerm !== null || longTerm !== null) totalDebt = (shortTerm ?? 0) + (longTerm ?? 0);
  }
  const cash = latestValue(balance, "cashAndEquivalents");

  // Net debt of zero is a legitimate answer for a debt-free, cash-free balance
  // sheet, but we only claim it when at least one of the two legs was reported.
  const netDebt =
    totalDebt === null && cash === null ? null : round2((totalDebt ?? 0) - (cash ?? 0));
  if (netDebt === null) missing.push("netDebt");

  const sharesOutstanding = latestValue(balance, "sharesOutstanding");
  if (sharesOutstanding === null || sharesOutstanding <= 0) missing.push("sharesOutstanding");

  return {
    currentFCF,
    netDebt,
    sharesOutstanding: sharesOutstanding !== null && sharesOutstanding > 0 ? sharesOutstanding : null,
    missing,
  };
}

/**
 * Convert Alpha Vantage's array-of-reports shape (each report is a flat object
 * with a `fiscalDateEnding` plus one key per line item) into the rows-by-name
 * statement the cleaner consumes.
 */
export function reportsToRawStatement(reports: any[]): RawStatement {
  const statement: RawStatement = {};
  if (!Array.isArray(reports)) return statement;

  for (const report of reports) {
    if (!report || typeof report !== "object") continue;
    const period = report.fiscalDateEnding;
    if (typeof period !== "string" || !period) continue;

    for (const [key, value] of Object.entries(report)) {
      if (key === "fiscalDateEnding" || key === "reportedCurrency") continue;
      if (!statement[key]) statement[key] = {};
      statement[key][period] = value as any;
    }
  }

  return statement;
}
