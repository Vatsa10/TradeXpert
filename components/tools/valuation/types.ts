/** Types mirroring the /api/analysis/fundamentals and /api/analysis/dcf responses. */

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

export interface FundamentalsResponse {
  symbol: string;
  statements: unknown;
  growth: {
    quarterly: Record<string, GrowthRate>;
    annual: Record<string, GrowthRate>;
  };
  dcfInputs: {
    currentFCF: number | null;
    netDebt: number | null;
    sharesOutstanding: number | null;
    missing: string[];
  };
}

export interface DCFYearProjection {
  year: number;
  fcf: number;
  discountFactor: number;
  presentValue: number;
}

export interface DCFResponse {
  wacc: {
    costOfEquity: number;
    costOfDebtAfterTax: number;
    wacc: number;
    usedDebtCost: boolean;
  };
  dcf: {
    projections: DCFYearProjection[];
    sumPVExplicit: number;
    terminalValue: number;
    pvTerminalValue: number;
    enterpriseValue: number;
    equityValue: number;
    fairValuePerShare: number;
  };
  sensitivity: {
    growthRate: number;
    wacc: number;
    fairValuePerShare: number | null;
  }[];
}

export const METRIC_LABELS: Record<string, string> = {
  revenue: "Revenue",
  netIncome: "Net Profit",
  ebitda: "EBITDA",
  operatingIncome: "Operating Income",
};

/** Lenient numeric parse for the free-text DCF inputs. */
export function parseNum(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
