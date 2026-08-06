// Volatility-adjusted, correlation-aware position sizing, ported from
// india-trade-cli/engine/position_sizer.py (VolatilityAdjustedSizer).
//
// Differences vs the Python original, on purpose:
//   - Pure functions only. The Python class fetched OHLCV over the network
//     inside `compute_correlation_matrix`; here the caller passes recent
//     return series, so every function is deterministic and testable.
//   - Research-only: emits a recommended size, never an order. TradeXpert
//     has no broker execution.
//
// Pipeline: half-Kelly -> ATR volatility scalar (clamped [0.25, 2.0])
//   -> correlation penalty (max |Pearson r| x 0.5, so capped at 0.5)
//   -> clamp to max position pct -> integer quantity rounded to lot size.

import { computeRiskGate, type RiskGateInput, type RiskGateResult } from "@/lib/analysis/risk-gate";

export interface PositionSizerParams {
  totalCapital: number;
  maxPositionPct?: number; // fraction of capital, default 0.10
  targetRiskPct?: number; // fraction of capital risked per trade, default 0.01
}

export interface PositionSizeInput {
  symbol: string;
  winRate: number; // 0..1
  avgWinPct: number; // fraction, e.g. 0.05
  avgLossPct: number; // fraction, e.g. 0.03
  atrPct: number; // ATR as fraction of price, e.g. 0.018
  pricePerLot?: number; // price of one unit/lot, default 1
  lotSize?: number; // default 1
  correlationPenalty?: number; // precomputed 0..0.5, see computeCorrelationPenalty
}

export interface PositionSizeResult {
  symbol: string;
  recommendedQty: number;
  recommendedValue: number;
  positionPct: number;
  volatilityScalar: number;
  correlationPenalty: number;
  kellyFraction: number; // half-Kelly actually applied
  rawKelly: number;
  rationale: string;
}

export const POSITION_SIZER_DEFAULTS = {
  maxPositionPct: 0.1,
  targetRiskPct: 0.01,
  volScalarMin: 0.25,
  volScalarMax: 2.0,
  correlationPenaltyFactor: 0.5,
} as const;

/**
 * Kelly criterion as used by the source:
 *   f = winRate / avgLossPct - (1 - winRate) / avgWinPct
 * Non-positive win/loss magnitudes mean "no edge" and yield -1.
 */
export function computeKelly(winRate: number, avgWinPct: number, avgLossPct: number): number {
  if (!Number.isFinite(winRate) || !Number.isFinite(avgWinPct) || !Number.isFinite(avgLossPct)) return -1;
  if (avgWinPct <= 0 || avgLossPct <= 0) return -1;
  return winRate / avgLossPct - (1 - winRate) / avgWinPct;
}

/** Volatility scalar = targetRiskPct / atrPct, clamped [0.25, 2.0]. Zero ATR pins to the cap. */
export function computeVolatilityScalar(atrPct: number, targetRiskPct: number): number {
  const { volScalarMin, volScalarMax } = POSITION_SIZER_DEFAULTS;
  if (!Number.isFinite(atrPct) || atrPct <= 0) return volScalarMax;
  const raw = targetRiskPct / atrPct;
  if (!Number.isFinite(raw)) return volScalarMax;
  return Math.min(Math.max(raw, volScalarMin), volScalarMax);
}

/** Pearson correlation of two equal-length series. Returns 0 when undefined (constant series, <2 points). */
export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }
  if (varA <= 0 || varB <= 0) return 0;
  const r = cov / Math.sqrt(varA * varB);
  if (!Number.isFinite(r)) return 0;
  return Math.min(Math.max(r, -1), 1);
}

/** Convert a close-price series into simple period-over-period returns. */
export function toReturns(closes: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    if (!Number.isFinite(prev) || prev === 0 || !Number.isFinite(closes[i])) continue;
    out.push(closes[i] / prev - 1);
  }
  return out;
}

/**
 * Full Pearson correlation matrix over a map of symbol -> return series.
 * Series are truncated to their common (most recent) overlapping length,
 * mirroring the pandas `.dropna()` alignment in the source.
 */
export function computeCorrelationMatrix(returnsBySymbol: Record<string, number[]>): {
  symbols: string[];
  matrix: number[][];
} {
  const symbols = Object.keys(returnsBySymbol);
  const usable = symbols.filter((s) => (returnsBySymbol[s]?.length ?? 0) >= 10);
  const commonLen = usable.length ? Math.min(...usable.map((s) => returnsBySymbol[s].length)) : 0;
  const aligned: Record<string, number[]> = {};
  for (const s of usable) {
    const series = returnsBySymbol[s];
    aligned[s] = series.slice(series.length - commonLen);
  }

  const matrix = symbols.map((rowSym, i) =>
    symbols.map((colSym, j) => {
      if (i === j) return 1;
      if (!aligned[rowSym] || !aligned[colSym]) return 0;
      return pearsonCorrelation(aligned[rowSym], aligned[colSym]);
    })
  );

  return { symbols, matrix };
}

/**
 * Penalty = max |Pearson r| between the candidate and each existing holding, x 0.5.
 * Range [0, 0.5]. Missing/short series contribute nothing.
 */
export function computeCorrelationPenalty(
  candidateReturns: number[],
  existingReturnsBySymbol: Record<string, number[]>
): { penalty: number; maxCorrelation: number; mostCorrelatedSymbol: string | null } {
  let maxCorr = 0;
  let mostCorrelated: string | null = null;

  if (candidateReturns.length >= 10) {
    for (const [sym, series] of Object.entries(existingReturnsBySymbol)) {
      if (!series || series.length < 10) continue;
      const len = Math.min(series.length, candidateReturns.length);
      const r = pearsonCorrelation(
        candidateReturns.slice(candidateReturns.length - len),
        series.slice(series.length - len)
      );
      const abs = Math.abs(r);
      if (abs > maxCorr) {
        maxCorr = abs;
        mostCorrelated = sym;
      }
    }
  }

  return {
    penalty: maxCorr * POSITION_SIZER_DEFAULTS.correlationPenaltyFactor,
    maxCorrelation: maxCorr,
    mostCorrelatedSymbol: mostCorrelated,
  };
}

/** Core sizing routine. Pure: all market data arrives via `input`. */
export function sizePosition(params: PositionSizerParams, input: PositionSizeInput): PositionSizeResult {
  const totalCapital = Number.isFinite(params.totalCapital) ? Math.max(params.totalCapital, 0) : 0;
  const maxPositionPct = params.maxPositionPct ?? POSITION_SIZER_DEFAULTS.maxPositionPct;
  const targetRiskPct = params.targetRiskPct ?? POSITION_SIZER_DEFAULTS.targetRiskPct;

  const lotSize = input.lotSize && input.lotSize > 0 ? Math.floor(input.lotSize) : 1;
  const pricePerLot = input.pricePerLot && input.pricePerLot > 0 ? input.pricePerLot : 1;

  const rawKelly = computeKelly(input.winRate, input.avgWinPct, input.avgLossPct);
  const halfKelly = Math.max(rawKelly / 2, 0);
  const volScalar = computeVolatilityScalar(input.atrPct, targetRiskPct);

  if (halfKelly <= 0) {
    return {
      symbol: input.symbol,
      recommendedQty: 0,
      recommendedValue: 0,
      positionPct: 0,
      volatilityScalar: volScalar,
      correlationPenalty: 0,
      kellyFraction: 0,
      rawKelly,
      rationale: `Kelly fraction non-positive (${rawKelly.toFixed(4)}); no statistical edge - no position recommended.`,
    };
  }

  const corrPenalty = Math.min(Math.max(input.correlationPenalty ?? 0, 0), POSITION_SIZER_DEFAULTS.correlationPenaltyFactor);

  let finalPct = halfKelly * volScalar * (1 - corrPenalty);
  finalPct = Math.min(finalPct, maxPositionPct);
  finalPct = Math.max(finalPct, 0);

  let qty = Math.floor((finalPct * totalCapital) / pricePerLot);
  if (lotSize > 1) qty = Math.floor(qty / lotSize) * lotSize;
  const recommendedValue = qty * pricePerLot;

  const rationale =
    `Kelly(raw)=${rawKelly.toFixed(4)} -> half-Kelly=${halfKelly.toFixed(4)}; ` +
    `volatility scalar=${volScalar.toFixed(3)} (ATR ${(input.atrPct * 100).toFixed(2)}% vs target risk ${(targetRiskPct * 100).toFixed(2)}%); ` +
    `correlation penalty=${corrPenalty.toFixed(3)}; ` +
    `final allocation=${(finalPct * 100).toFixed(2)}% of capital; qty=${qty} (lot size ${lotSize}).`;

  return {
    symbol: input.symbol,
    recommendedQty: qty,
    recommendedValue: Math.round(recommendedValue * 100) / 100,
    positionPct: finalPct,
    volatilityScalar: volScalar,
    correlationPenalty: corrPenalty,
    kellyFraction: halfKelly,
    rawKelly,
    rationale,
  };
}

// ── Combined risk gate + sizer ────────────────────────────────────

export interface PositionRecommendationInput {
  riskGate: RiskGateInput;
  sizing: Omit<PositionSizeInput, "correlationPenalty" | "pricePerLot"> & { pricePerLot?: number };
  candidateReturns?: number[];
  existingReturnsBySymbol?: Record<string, number[]>;
  targetRiskPct?: number;
}

export interface PositionRecommendation {
  symbol: string;
  riskGate: RiskGateResult;
  sizing: PositionSizeResult;
  recommendedQty: number;
  recommendedValue: number;
  recommendedPct: number;
  bindingConstraint: "risk-gate" | "position-sizer";
  correlation: { maxCorrelation: number; mostCorrelatedSymbol: string | null };
  notes: string[];
  disclaimer: string;
}

const RESEARCH_DISCLAIMER =
  "Research output only. This is a suggested maximum size for study, not investment advice and not an order.";

/**
 * Runs the deterministic risk gate first (hard caps: base limit, earnings
 * proximity, VIX, available cash), then refines within those caps using the
 * half-Kelly / volatility / correlation sizer. The final size is the minimum
 * of both, so neither layer can be talked past.
 */
export function computePositionRecommendation(input: PositionRecommendationInput): PositionRecommendation {
  const gate = computeRiskGate(input.riskGate);
  const notes: string[] = [...gate.constraints];

  const corr = computeCorrelationPenalty(
    input.candidateReturns ?? [],
    input.existingReturnsBySymbol ?? {}
  );
  if (corr.mostCorrelatedSymbol) {
    notes.push(
      `Correlation penalty ${(corr.penalty * 100).toFixed(1)}% from ${corr.mostCorrelatedSymbol} (|r|=${corr.maxCorrelation.toFixed(2)})`
    );
  }

  const pricePerLot =
    input.sizing.pricePerLot && input.sizing.pricePerLot > 0
      ? input.sizing.pricePerLot
      : input.riskGate.currentPrice;

  const sizing = sizePosition(
    {
      totalCapital: input.riskGate.accountCapital,
      // The gate's post-cap allocation becomes the sizer's ceiling.
      maxPositionPct: gate.maxAllocationPct,
      targetRiskPct: input.targetRiskPct,
    },
    { ...input.sizing, pricePerLot, correlationPenalty: corr.penalty }
  );

  const recommendedQty = Math.min(sizing.recommendedQty, gate.maxShares);
  const bindingConstraint = recommendedQty < sizing.recommendedQty ? "risk-gate" : "position-sizer";
  if (bindingConstraint === "risk-gate") {
    notes.push(`Risk gate share cap (${gate.maxShares}) binds below sizer suggestion (${sizing.recommendedQty})`);
  }

  const effectivePrice = pricePerLot > 0 ? pricePerLot : 1;
  const recommendedValue = Math.round(recommendedQty * effectivePrice * 100) / 100;
  const recommendedPct =
    input.riskGate.accountCapital > 0 ? recommendedValue / input.riskGate.accountCapital : 0;

  notes.push(sizing.rationale);

  return {
    symbol: input.sizing.symbol,
    riskGate: gate,
    sizing,
    recommendedQty,
    recommendedValue,
    recommendedPct,
    bindingConstraint,
    correlation: { maxCorrelation: corr.maxCorrelation, mostCorrelatedSymbol: corr.mostCorrelatedSymbol },
    notes,
    disclaimer: RESEARCH_DISCLAIMER,
  };
}
