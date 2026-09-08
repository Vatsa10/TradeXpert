export type Side = "BUY" | "SELL";

// Field names mirror lib/paper/engine.ts PortfolioPosition exactly.
export interface PaperPosition {
  symbol?: string;
  qty?: number;
  avgCost?: number;
  lastPrice?: number | null;
  unrealizedPnL?: number | null;
  priceSource?: string | null;
}

export interface PaperTrade {
  id?: string;
  _id?: string;
  symbol?: string;
  side?: string;
  qty?: number;
  price?: number;
  fees?: number;
  timestamp?: string;
}

// GET /api/paper/account -> { mode, portfolio }. Cash and startingCapital live
// on the portfolio object, not a separate `account` key.
export interface AccountResponse {
  mode?: string;
  portfolio?: {
    positions?: PaperPosition[];
    cash?: number;
    startingCapital?: number;
    equity?: number;
    totalRealizedPnL?: number;
    totalUnrealizedPnL?: number;
    pricingDegraded?: boolean;
  };
}

export interface ReviewState {
  symbol: string;
  side: Side;
  qty: number;
  ltp: number | null;
  fees: number | null;
  constraints: string[];
  quoteNote: string | null;
}

/** Indian delivery-equity cost approximation, used only for the review preview. */
const BROKERAGE_RATE = 0.0003; // 0.03%, capped
const BROKERAGE_CAP = 20;
const STT_RATE = 0.001; // 0.1% delivery, both sides
const OTHER_RATE = 0.0004; // exchange txn + SEBI + stamp + GST, rounded

export function estimateFees(notional: number): number {
  if (!Number.isFinite(notional) || notional <= 0) return 0;
  const brokerage = Math.min(notional * BROKERAGE_RATE, BROKERAGE_CAP);
  return brokerage + notional * STT_RATE + notional * OTHER_RATE;
}

/** Narrow an unknown numeric field to a finite number or null. */
export const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
