// Statement-level fundamentals from Alpha Vantage (INCOME_STATEMENT,
// BALANCE_SHEET, CASH_FLOW). Free tier is rate-limited and statements only move
// once a quarter, so everything here goes through the shared getOrFetch cache
// with a long TTL rather than the short quote-style TTLs.

import { getCacheKey, getOrFetch } from "@/lib/chat/cache";
import { reportsToRawStatement, type RawStatement } from "@/lib/analysis/fundamentals";

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";
const TIMEOUT_MS = 8000;

// Statements are restated at most quarterly; a day of staleness is free accuracy
// against a 25-request/day free tier.
const STATEMENTS_TTL_MS = 24 * 60 * 60 * 1000;

export type StatementFunction = "INCOME_STATEMENT" | "BALANCE_SHEET" | "CASH_FLOW";

export interface StatementBundle {
  symbol: string;
  annual: RawStatement;
  quarterly: RawStatement;
}

export interface FundamentalsBundle {
  symbol: string;
  income: StatementBundle;
  balance: StatementBundle;
  cashFlow: StatementBundle;
}

// Same shape as the sibling providers: parsing lives inside the try so a
// malformed body yields null instead of rejecting out of the cache fetcher,
// and AbortSignal.timeout leaves no dangling timer behind.
async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch one Alpha Vantage statement endpoint and return it as annual/quarterly
 * raw statements. Returns null when the key is missing or the API answers with a
 * rate-limit ("Note"/"Information") or error payload instead of reports — those
 * come back HTTP 200, so status alone can't be trusted.
 */
export async function fetchStatement(
  symbol: string,
  fn: StatementFunction
): Promise<StatementBundle | null> {
  if (!ALPHA_VANTAGE_API_KEY) return null;

  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return null;

  const cacheKey = getCacheKey("alphavantage_statement", { symbol: normalized, fn });

  return getOrFetch<StatementBundle | null>(
    cacheKey,
    async () => {
      const url = `${BASE_URL}?function=${fn}&symbol=${encodeURIComponent(normalized)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const json = await fetchJson(url);

      if (!json || typeof json !== "object") return null;
      if (json.Note || json.Information || json["Error Message"]) return null;

      const annualReports = Array.isArray(json.annualReports) ? json.annualReports : [];
      const quarterlyReports = Array.isArray(json.quarterlyReports) ? json.quarterlyReports : [];
      if (annualReports.length === 0 && quarterlyReports.length === 0) return null;

      return {
        symbol: normalized,
        annual: reportsToRawStatement(annualReports),
        quarterly: reportsToRawStatement(quarterlyReports),
      };
    },
    STATEMENTS_TTL_MS,
    true
  );
}

/**
 * All three statements for a symbol. The calls run in parallel and each is
 * independently cached, so a partial failure (rate limit hit mid-way) still
 * returns whatever the other endpoints served.
 */
export async function fetchFundamentals(symbol: string): Promise<FundamentalsBundle | null> {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return null;

  const [income, balance, cashFlow] = await Promise.all([
    fetchStatement(normalized, "INCOME_STATEMENT"),
    fetchStatement(normalized, "BALANCE_SHEET"),
    fetchStatement(normalized, "CASH_FLOW"),
  ]);

  if (!income && !balance && !cashFlow) return null;

  const emptyBundle = (): StatementBundle => ({ symbol: normalized, annual: {}, quarterly: {} });

  return {
    symbol: normalized,
    income: income ?? emptyBundle(),
    balance: balance ?? emptyBundle(),
    cashFlow: cashFlow ?? emptyBundle(),
  };
}
