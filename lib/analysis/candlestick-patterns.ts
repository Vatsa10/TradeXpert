// Candlestick pattern detection, re-implemented from NSE-Neuron
// `utils/pattern_detector.py:1-71`, which calls TA-Lib's CDLHAMMER,
// CDLENGULFING, CDLDOJI, CDLSHOOTINGSTAR and CDLMORNINGSTAR over a 10-day
// lookback and dedupes to the most recent occurrence of each pattern.
//
// TA-Lib has no JS build, so the five recognisers are written by hand here
// against the standard definitions. TA-Lib's own C code compares each candle's
// body against a rolling average body (its "BodyLong"/"BodyShort"/"ShadowLong"
// settings); that averaging is kept, using a 10-bar trailing window, so the
// thresholds stay relative to the instrument's own volatility rather than
// fixed rupee amounts. Output uses the TA-Lib convention: +100 bullish,
// -100 bearish, 0 no pattern.
//
// Bugs fixed vs the Python original:
//   1. `pattern_detector.py` mutates the caller's DataFrame in place. These
//      functions are pure and allocate their own results.
//   2. `Pattern_Score` (pattern_detector.py:20-23) sums DOJI's +100 into a
//      directional score even though a doji signals indecision, not upside.
//      It was computed and never read; it is not ported. `patternBias` below
//      excludes neutral patterns from the directional tally instead.

import type { OHLCV } from "@/lib/analysis/technical-indicators";

export type PatternName = "HAMMER" | "ENGULFING" | "DOJI" | "SHOOTING_STAR" | "MORNING_STAR";
export type PatternBias = "bullish" | "bearish" | "neutral";

export interface PatternHit {
  pattern: PatternName;
  /** TA-Lib convention: +100 bullish, -100 bearish. Doji is emitted as +100 with a neutral bias. */
  value: number;
  bias: PatternBias;
  /** Index into the input series. */
  index: number;
  date: string;
  description: string;
}

/** Lookback used by the source scan (pattern_detector.py:31). */
export const PATTERN_LOOKBACK = 10;
/** Trailing window standing in for TA-Lib's rolling body/shadow averages. */
const AVG_WINDOW = 10;

const body = (c: OHLCV) => Math.abs(c.close - c.open);
const range = (c: OHLCV) => c.high - c.low;
const upperShadow = (c: OHLCV) => c.high - Math.max(c.open, c.close);
const lowerShadow = (c: OHLCV) => Math.min(c.open, c.close) - c.low;
const isBullish = (c: OHLCV) => c.close > c.open;
const isBearish = (c: OHLCV) => c.close < c.open;

/** Average real body over the AVG_WINDOW bars preceding `i` (TA-Lib's BodyLong basis). */
function avgBody(rows: OHLCV[], i: number): number {
  const start = Math.max(0, i - AVG_WINDOW);
  if (i <= start) return body(rows[i]);
  let sum = 0;
  for (let k = start; k < i; k++) sum += body(rows[k]);
  const avg = sum / (i - start);
  // A window of pure doji bars would make every "small body" test unsatisfiable;
  // fall back to the candle's own body so the shadow ratios still decide.
  return avg > 0 ? avg : body(rows[i]);
}

/** Short-horizon trend context: sign of close vs the mean close of the prior 5 bars. */
function priorTrend(rows: OHLCV[], i: number): "up" | "down" | "flat" {
  const start = Math.max(0, i - 5);
  if (i <= start) return "flat";
  let sum = 0;
  for (let k = start; k < i; k++) sum += rows[k].close;
  const mean = sum / (i - start);
  if (rows[i].close < mean * 0.995) return "down";
  if (rows[i].close > mean * 1.005) return "up";
  return "flat";
}

/** CDLHAMMER: small body at the top of the range, long lower shadow, after a decline. */
export function isHammer(rows: OHLCV[], i: number): boolean {
  const c = rows[i];
  const r = range(c);
  if (r <= 0) return false;
  const b = body(c);
  return (
    b <= avgBody(rows, i) &&
    lowerShadow(c) >= 2 * b &&
    upperShadow(c) <= b &&
    b / r <= 0.34 &&
    priorTrend(rows, i) === "down"
  );
}

/** CDLSHOOTINGSTAR: the hammer mirrored — long upper shadow after an advance. */
export function isShootingStar(rows: OHLCV[], i: number): boolean {
  const c = rows[i];
  const r = range(c);
  if (r <= 0) return false;
  const b = body(c);
  return (
    b <= avgBody(rows, i) &&
    upperShadow(c) >= 2 * b &&
    lowerShadow(c) <= b &&
    b / r <= 0.34 &&
    priorTrend(rows, i) === "up"
  );
}

/** CDLDOJI: open and close effectively equal (body under 5% of the range). */
export function isDoji(rows: OHLCV[], i: number): boolean {
  const c = rows[i];
  const r = range(c);
  if (r <= 0) return false;
  return body(c) / r <= 0.05;
}

/** CDLENGULFING: returns +100 bullish, -100 bearish, 0 none. */
export function engulfingValue(rows: OHLCV[], i: number): number {
  if (i < 1) return 0;
  const prev = rows[i - 1];
  const cur = rows[i];
  if (body(prev) <= 0 || body(cur) <= 0) return 0;
  const engulfs =
    Math.max(cur.open, cur.close) >= Math.max(prev.open, prev.close) &&
    Math.min(cur.open, cur.close) <= Math.min(prev.open, prev.close);
  if (!engulfs) return 0;
  if (isBearish(prev) && isBullish(cur)) return 100;
  if (isBullish(prev) && isBearish(cur)) return -100;
  return 0;
}

/** CDLMORNINGSTAR: long down candle, small-bodied star, then a close back above the first body's midpoint. */
export function isMorningStar(rows: OHLCV[], i: number): boolean {
  if (i < 2) return false;
  const first = rows[i - 2];
  const star = rows[i - 1];
  const third = rows[i];
  const avg = avgBody(rows, i - 2);
  if (avg <= 0) return false;
  const midpointOfFirst = (first.open + first.close) / 2;
  return (
    isBearish(first) &&
    body(first) >= avg &&
    body(star) <= avg * 0.5 &&
    Math.max(star.open, star.close) < first.close &&
    isBullish(third) &&
    third.close > midpointOfFirst
  );
}

const DESCRIPTIONS: Record<PatternName, string> = {
  HAMMER: "Hammer — rejection of lower prices after a decline",
  ENGULFING: "Engulfing — the latest body swallows the prior one",
  DOJI: "Doji — open and close near-equal, indecision",
  SHOOTING_STAR: "Shooting star — rejection of higher prices after an advance",
  MORNING_STAR: "Morning star — three-bar bottoming reversal",
};

/**
 * Scan the last `lookback` bars and return at most one hit per pattern, keeping
 * the most recent occurrence. Ported from `detect_patterns`
 * (pattern_detector.py:26-52), most-recent-first.
 */
export function detectCandlestickPatterns(rows: OHLCV[], lookback = PATTERN_LOOKBACK): PatternHit[] {
  if (rows.length < 3) return [];
  const start = Math.max(2, rows.length - lookback);
  const seen = new Map<PatternName, PatternHit>();

  const record = (pattern: PatternName, value: number, bias: PatternBias, i: number) => {
    if (seen.has(pattern)) return; // walking backwards: the first hit is the most recent
    seen.set(pattern, { pattern, value, bias, index: i, date: rows[i].date, description: DESCRIPTIONS[pattern] });
  };

  for (let i = rows.length - 1; i >= start; i--) {
    if (isHammer(rows, i)) record("HAMMER", 100, "bullish", i);
    if (isShootingStar(rows, i)) record("SHOOTING_STAR", -100, "bearish", i);
    if (isDoji(rows, i)) record("DOJI", 100, "neutral", i);
    if (isMorningStar(rows, i)) record("MORNING_STAR", 100, "bullish", i);
    const eng = engulfingValue(rows, i);
    if (eng !== 0) record("ENGULFING", eng, eng > 0 ? "bullish" : "bearish", i);
  }

  return [...seen.values()].sort((a, b) => b.index - a.index);
}

/**
 * Net directional read of a hit set. Neutral patterns (doji) are excluded —
 * that is the fix for the source's `Pattern_Score`, which added indecision
 * to the bullish side.
 */
export function patternBias(hits: PatternHit[]): { score: number; bias: PatternBias } {
  let score = 0;
  for (const h of hits) {
    if (h.bias === "bullish") score += 100;
    else if (h.bias === "bearish") score -= 100;
  }
  return { score, bias: score > 0 ? "bullish" : score < 0 ? "bearish" : "neutral" };
}
