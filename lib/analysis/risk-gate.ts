// Deterministic pre-LLM risk gate, ported from
// india-trade-cli/engine/risk_gate.py:115-245.
// Computes hard position-sizing constraints BEFORE any LLM call, so
// AI-generated recommendations stay bounded by real, non-hallucinated
// numbers instead of the model inventing an allocation. Research-only:
// produces a recommended max allocation, never places an order (TradeXpert
// has no broker execution).
//
// Bug fixed vs the Python original: `_days_until_event` there clamps past
// dates to 0, which still triggers the earnings-proximity halving for an
// event that already happened. Here a past date is treated as "no upcoming
// event" (null), so it does not halve.

export interface RiskGateInput {
  accountCapital: number;
  cashAvailable: number;
  currentPrice: number;
  earningsDate?: Date | null;
  vix?: number | null; // India VIX or general market vol index, if available
}

export interface RiskGateResult {
  maxAllocationPct: number; // fraction of capital, e.g. 0.1 = 10%
  maxAllocationAmount: number;
  maxShares: number;
  constraints: string[]; // human-readable reasons each cap was applied
  cashConstrained: boolean;
}

const BASE_POSITION_LIMIT_PCT = 0.1; // 10% of capital per position, matches risk_gate.py
const EARNINGS_PROXIMITY_DAYS = 3;
const EARNINGS_HALVING_FACTOR = 0.5;
const HIGH_VIX_THRESHOLD = 25;
const VIX_HALVING_FACTOR = 0.5;

function daysUntil(date: Date | null | undefined): number | null {
  if (!date) return null;
  const diffMs = date.getTime() - Date.now();
  if (diffMs < 0) return null; // past event: does not trigger halving (fixes source bug)
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export function computeRiskGate(input: RiskGateInput): RiskGateResult {
  const constraints: string[] = [];
  // Negative / non-finite capital or cash must not flow through into a
  // negative allocation (and hence a negative maxShares).
  const accountCapital = Number.isFinite(input.accountCapital) ? Math.max(0, input.accountCapital) : 0;
  const cashAvailable = Number.isFinite(input.cashAvailable) ? Math.max(0, input.cashAvailable) : 0;
  let allocationPct = BASE_POSITION_LIMIT_PCT;
  constraints.push(`Base position limit: ${(BASE_POSITION_LIMIT_PCT * 100).toFixed(0)}% of capital`);

  const daysToEarnings = daysUntil(input.earningsDate);
  if (daysToEarnings !== null && daysToEarnings <= EARNINGS_PROXIMITY_DAYS) {
    allocationPct *= EARNINGS_HALVING_FACTOR;
    constraints.push(`Earnings in ${daysToEarnings}d (<=${EARNINGS_PROXIMITY_DAYS}d): allocation halved`);
  }

  if (typeof input.vix === "number" && input.vix >= HIGH_VIX_THRESHOLD) {
    allocationPct *= VIX_HALVING_FACTOR;
    constraints.push(`Elevated volatility (VIX ${input.vix.toFixed(1)} >= ${HIGH_VIX_THRESHOLD}): allocation halved`);
  }

  let maxAllocationAmount = accountCapital * allocationPct;
  let cashConstrained = false;

  if (maxAllocationAmount > cashAvailable) {
    maxAllocationAmount = cashAvailable;
    cashConstrained = true;
    constraints.push(`Capped by available cash: ${cashAvailable.toFixed(2)}`);
    // The cash cap must be reflected in the percentage too. Consumers
    // (lib/analysis/position-sizer.ts uses maxAllocationPct as the sizer's
    // hard ceiling) would otherwise size against the uncapped 10% and blow
    // straight through the cash constraint.
    allocationPct = accountCapital > 0 ? maxAllocationAmount / accountCapital : 0;
  }

  const maxShares =
    input.currentPrice > 0 && Number.isFinite(input.currentPrice)
      ? Math.floor(maxAllocationAmount / input.currentPrice)
      : 0;

  return {
    maxAllocationPct: allocationPct,
    maxAllocationAmount,
    maxShares,
    constraints,
    cashConstrained,
  };
}
