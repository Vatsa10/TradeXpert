// Trend-regime classification and regime-aware confidence adjustment, ported
// from NSE-Neuron `utils/regime_detector.py:1-191` (`detect_regime`,
// `_classify_trend`, `apply_regime_confidence`, `regime_summary_line`).
//
// The source classifies a daily series into BULL / BEAR / SIDEWAYS from the
// SMA50 / SMA200 relationship plus where price sits against SMA200, then uses
// that tag to nudge a model's confidence up or down with a full audit trail.
// Everything here is deterministic arithmetic over an OHLCV series — no model,
// no network.
//
// Bugs fixed vs the Python original:
//   1. `_classify_trend` (regime_detector.py:47-54) tests the +/-3% "sideways"
//      band around SMA200 FIRST, so a clean golden cross with price 2% above
//      SMA200 was still labelled SIDEWAYS. Here the trend tests run first and
//      the flat band is only the fallback.
//   2. `detect_regime` hard-requires 1000 rows before it will classify, which
//      throws away a perfectly usable 200-day read. Here the requirement is
//      the SMA200 window itself (plus a small buffer), and shorter series
//      return an explicit UNKNOWN rather than a silent guess.

import type { OHLCV } from "@/lib/analysis/technical-indicators";

export type MarketRegime = "BULL" | "BEAR" | "SIDEWAYS" | "UNKNOWN";
export type RegimeDirection = "bullish" | "bearish" | "neutral";

export interface RegimeResult {
  regime: MarketRegime;
  direction: RegimeDirection;
  sma50: number | null;
  sma200: number | null;
  close: number | null;
  /** Close vs SMA200 as a fraction, e.g. 0.042 = 4.2% above the long average. */
  distanceFromSma200: number | null;
  reason: string;
}

/** Long-average band inside which price is treated as directionless (regime_detector.py:50). */
export const SIDEWAYS_BAND = 0.03;
/** Confidence bonus in percentage points when the regime agrees (regime_detector.py:118). */
export const REGIME_CONFIDENCE_BOOST = 8;
/** Confidence penalty in percentage points when the regime conflicts (regime_detector.py:124). */
export const REGIME_CONFIDENCE_PENALTY = 6;

const SMA_FAST = 50;
const SMA_SLOW = 200;

function meanOfLast(values: number[], period: number): number | null {
  if (values.length < period) return null;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) sum += values[i];
  return sum / period;
}

/**
 * Trend label from the fast/slow average cross and price position.
 * Ported from `_classify_trend` (regime_detector.py:40-62) with the
 * band-ordering bug fixed: a confirmed cross wins over the flat band.
 */
export function classifyTrend(close: number, sma50: number, sma200: number): MarketRegime {
  const distance = (close - sma200) / sma200;

  // Golden cross with price confirming above the long average.
  if (sma50 > sma200 && close > sma50) return "BULL";
  // Death cross with price confirming below the long average.
  if (sma50 < sma200 && close < sma50) return "BEAR";
  // No confirmation from price: fall back to the flat band around SMA200.
  if (Math.abs(distance) <= SIDEWAYS_BAND) return "SIDEWAYS";
  // Outside the band but the averages and price disagree — lean on price.
  return distance > 0 ? "BULL" : "BEAR";
}

export function regimeDirection(regime: MarketRegime): RegimeDirection {
  if (regime === "BULL") return "bullish";
  if (regime === "BEAR") return "bearish";
  return "neutral";
}

/** Ported from `detect_regime` (regime_detector.py:65-105). */
export function detectRegime(rows: OHLCV[]): RegimeResult {
  const unknown: RegimeResult = {
    regime: "UNKNOWN",
    direction: "neutral",
    sma50: null,
    sma200: null,
    close: null,
    distanceFromSma200: null,
    reason: `Not enough history: need ${SMA_SLOW} daily bars to compute the long-term average`,
  };
  if (rows.length < SMA_SLOW) return unknown;

  const closes = rows.map((r) => r.close);
  const sma50 = meanOfLast(closes, SMA_FAST);
  const sma200 = meanOfLast(closes, SMA_SLOW);
  const close = closes[closes.length - 1];
  if (sma50 === null || sma200 === null || !Number.isFinite(close) || sma200 === 0) return unknown;

  const regime = classifyTrend(close, sma50, sma200);
  const distanceFromSma200 = (close - sma200) / sma200;
  const pct = (distanceFromSma200 * 100).toFixed(1);
  const cross = sma50 > sma200 ? "SMA50 above SMA200" : sma50 < sma200 ? "SMA50 below SMA200" : "SMA50 at SMA200";

  const reason =
    regime === "SIDEWAYS"
      ? `${cross}, price within ${(SIDEWAYS_BAND * 100).toFixed(0)}% of SMA200 (${pct}%) — no directional edge`
      : `${cross}, price ${pct}% vs SMA200`;

  return { regime, direction: regimeDirection(regime), sma50, sma200, close, distanceFromSma200, reason };
}

export interface RegimeConfidenceResult {
  /** Adjusted confidence, 0-100, clamped. */
  confidence: number;
  confidenceOrig: number;
  confidenceDelta: number;
  regime: MarketRegime;
  regimeDirection: RegimeDirection;
  agreement: "agrees" | "conflicts" | "neutral";
  note: string;
}

/**
 * Regime-aware confidence post-processor, ported from
 * `apply_regime_confidence` (regime_detector.py:108-160).
 *
 * Model-agnostic: give it any directional signal plus its confidence in
 * percentage points and it returns the adjusted number alongside the original
 * and the delta, so the adjustment is always auditable rather than baked in.
 */
export function applyRegimeConfidence(
  signal: "BUY" | "SELL" | "HOLD",
  confidence: number,
  regime: MarketRegime,
): RegimeConfidenceResult {
  const confidenceOrig = Number.isFinite(confidence) ? Math.min(100, Math.max(0, confidence)) : 0;
  const direction = regimeDirection(regime);

  let agreement: "agrees" | "conflicts" | "neutral" = "neutral";
  if (signal !== "HOLD" && direction !== "neutral") {
    const signalDirection: RegimeDirection = signal === "BUY" ? "bullish" : "bearish";
    agreement = signalDirection === direction ? "agrees" : "conflicts";
  }

  let delta = 0;
  if (agreement === "agrees") delta = REGIME_CONFIDENCE_BOOST;
  else if (agreement === "conflicts") delta = -REGIME_CONFIDENCE_PENALTY;

  const confidenceAdjusted = Math.min(100, Math.max(0, confidenceOrig + delta));
  // Report the delta actually applied after clamping, not the nominal one.
  const confidenceDelta = confidenceAdjusted - confidenceOrig;

  const note =
    agreement === "agrees"
      ? `${signal} agrees with the ${regime} regime (+${confidenceDelta.toFixed(0)} pts)`
      : agreement === "conflicts"
        ? `${signal} conflicts with the ${regime} regime (${confidenceDelta.toFixed(0)} pts)`
        : `${regime} regime gives no directional read on ${signal}`;

  return { confidence: confidenceAdjusted, confidenceOrig, confidenceDelta, regime, regimeDirection: direction, agreement, note };
}

/** Ported from `regime_summary_line` (regime_detector.py:163-191). */
export function regimeSummaryLine(result: RegimeResult): string {
  if (result.regime === "UNKNOWN" || result.sma50 === null || result.sma200 === null) {
    return "Regime: UNKNOWN — insufficient price history";
  }
  return `Regime: ${result.regime} | close ${result.close?.toFixed(2)} | SMA50 ${result.sma50.toFixed(2)} | SMA200 ${result.sma200.toFixed(2)} | ${result.reason}`;
}
