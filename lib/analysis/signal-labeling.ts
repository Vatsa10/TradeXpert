// Supervised-signal labelling spec and OHLC spread encoding, ported from
// NSE-Neuron's classifier and regression model families:
//   - `models/classifiers/lstm.py:180-215` (`_make_labels`) — the +/-0.5%
//     next-day return -> BUY/HOLD/SELL 3-class rule.
//   - `models/classifiers/lstm.py:240-258` — sklearn `compute_class_weight`
//     with `class_weight="balanced"`.
//   - `models/lstm.py:60-84` — the spread encoding that keeps a forecast's
//     OHLC internally coherent.
//
// The Keras models themselves are not ported (they need a Python runtime, and
// their reported RMSE is in-sample with scaler leakage — see the model notes).
// What survives is the label definition and the encoding, both of which are
// pure arithmetic and are the parts a TS backtest actually needs.
//
// The source's leakage bug (scaler fit over all rows before the chronological
// split, despite the "no future leakage" comment at classifiers/lstm.py:230)
// is not reproducible here because nothing in this file fits a scaler; the
// labelling itself uses `shift(-1)` correctly and is faithful.

/** BUY=2, HOLD=1, SELL=0, matching the source's class indices. */
export const SIGNAL_CLASS = { SELL: 0, HOLD: 1, BUY: 2 } as const;
export type SignalClass = (typeof SIGNAL_CLASS)[keyof typeof SIGNAL_CLASS];

/** Return threshold either side of flat (classifiers/lstm.py:196). */
export const LABEL_THRESHOLD = 0.005;

export interface LabelledBar {
  index: number;
  nextReturn: number;
  label: SignalClass;
  labelName: "BUY" | "HOLD" | "SELL";
}

/**
 * Label every bar by its NEXT-day return: > +0.5% is BUY, < -0.5% is SELL,
 * anything between is HOLD. The final bar has no next day and is dropped, so
 * there is no look-ahead leakage into the feature row it is paired with.
 */
export function labelNextDayMoves(closes: number[], threshold = LABEL_THRESHOLD): LabelledBar[] {
  const out: LabelledBar[] = [];
  for (let i = 0; i < closes.length - 1; i++) {
    const cur = closes[i];
    if (!Number.isFinite(cur) || cur === 0) continue;
    const nextReturn = (closes[i + 1] - cur) / cur;
    const label: SignalClass =
      nextReturn > threshold ? SIGNAL_CLASS.BUY : nextReturn < -threshold ? SIGNAL_CLASS.SELL : SIGNAL_CLASS.HOLD;
    out.push({
      index: i,
      nextReturn,
      label,
      labelName: label === SIGNAL_CLASS.BUY ? "BUY" : label === SIGNAL_CLASS.SELL ? "SELL" : "HOLD",
    });
  }
  return out;
}

/**
 * sklearn's `class_weight="balanced"`: w_c = n_samples / (n_classes * count_c),
 * over the classes actually present. Rare classes weigh more, so a model (or a
 * scoring routine) is not rewarded for predicting HOLD forever.
 */
export function balancedClassWeights(labels: SignalClass[]): Record<number, number> {
  const counts = new Map<number, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  const nClasses = counts.size;
  const weights: Record<number, number> = {};
  if (nClasses === 0) return weights;
  for (const [cls, count] of counts) weights[cls] = labels.length / (nClasses * count);
  return weights;
}

/** Class balance of a label set, useful for reporting alongside any accuracy number. */
export function labelDistribution(labels: SignalClass[]): { buy: number; hold: number; sell: number; total: number } {
  let buy = 0;
  let hold = 0;
  let sell = 0;
  for (const l of labels) {
    if (l === SIGNAL_CLASS.BUY) buy++;
    else if (l === SIGNAL_CLASS.SELL) sell++;
    else hold++;
  }
  return { buy, hold, sell, total: labels.length };
}

export interface SpreadEncoded {
  close: number;
  highSpread: number;
  lowSpread: number;
  prevClose: number;
}

/**
 * Spread encoding (models/lstm.py:60-84): instead of forecasting high and low
 * directly — which lets a model emit high < close — forecast the non-negative
 * distances from close and reconstruct. Guarantees low <= close <= high on the
 * way out no matter what the forecaster produced.
 */
export function encodeSpreads(rows: { high: number; low: number; close: number }[]): SpreadEncoded[] {
  return rows.map((r, i) => ({
    close: r.close,
    highSpread: r.high - r.close,
    lowSpread: r.close - r.low,
    prevClose: i === 0 ? r.close : rows[i - 1].close,
  }));
}

/**
 * Inverse of `encodeSpreads`. The source `abs()`-clamps the predicted spreads
 * before reconstructing (models/lstm.py:150-160) — kept, because a negative
 * predicted spread is the exact failure this encoding exists to prevent.
 */
export function decodeSpreads(encoded: SpreadEncoded): { high: number; low: number; close: number; open: number } {
  const high = encoded.close + Math.abs(encoded.highSpread);
  const low = encoded.close - Math.abs(encoded.lowSpread);
  // The plotting code synthesises open as the previous close (visualization/ploting.py).
  const open = encoded.prevClose;
  return { high, low, close: encoded.close, open: Math.min(high, Math.max(low, open)) };
}
