// Deterministic regime x candlestick-pattern interpretation table, ported from
// NSE-Neuron `utils/pattern_detector.py:55-71` (`combine_regime_patterns`) and
// its backend twin `src/backend/nse_service.py::_get_combined_insight`, which
// duplicates the same rules as returned strings.
//
// The value here is that the interaction between trend regime and a reversal
// pattern is pre-decided rather than improvised: a bullish pattern inside a
// BEAR regime is a dead-cat-bounce warning, not a buy. Emitting these as fixed
// lines gives the chat pipeline a grounded narrative to quote instead of
// letting the model invent the relationship.
//
// The Python original only printed these lines; this returns them, with a
// coarse conviction tag so callers can gate on it.

import type { PatternBias, PatternHit } from "@/lib/analysis/candlestick-patterns";
import { patternBias } from "@/lib/analysis/candlestick-patterns";
import type { MarketRegime } from "@/lib/analysis/market-regime";

export type Conviction = "strong" | "moderate" | "caution" | "none";

export interface RegimePatternInsight {
  regime: MarketRegime;
  patternBias: PatternBias;
  conviction: Conviction;
  headline: string;
  detail: string;
  patterns: PatternHit[];
}

/** The rule table itself, keyed regime -> pattern bias (pattern_detector.py:55-71). */
function lookup(regime: MarketRegime, bias: PatternBias): { conviction: Conviction; headline: string; detail: string } {
  if (regime === "BULL") {
    if (bias === "bullish")
      return {
        conviction: "strong",
        headline: "Bullish pattern in a bull regime — continuation setup",
        detail: "Trend and reversal signal point the same way; the pattern reads as a pullback ending, not a top.",
      };
    if (bias === "bearish")
      return {
        conviction: "caution",
        headline: "Bearish pattern in a bull regime — likely a pullback, not a reversal",
        detail: "Counter-trend signals inside an established uptrend usually mark a dip. Treat as a pause, not an exit trigger.",
      };
    return {
      conviction: "moderate",
      headline: "Indecision inside a bull regime",
      detail: "No directional pattern. The trend remains the dominant read.",
    };
  }

  if (regime === "BEAR") {
    if (bias === "bullish")
      return {
        conviction: "caution",
        headline: "Bullish pattern in a bear regime — dead-cat-bounce risk",
        detail: "Reversal patterns fail often against a downtrend. Needs trend confirmation before it means anything.",
      };
    if (bias === "bearish")
      return {
        conviction: "strong",
        headline: "Bearish pattern in a bear regime — continuation setup",
        detail: "Trend and pattern agree; downside pressure is confirmed rather than contradicted.",
      };
    return {
      conviction: "moderate",
      headline: "Indecision inside a bear regime",
      detail: "No directional pattern. The downtrend remains the dominant read.",
    };
  }

  if (regime === "SIDEWAYS") {
    if (bias === "neutral")
      return {
        conviction: "none",
        headline: "Range-bound with no pattern",
        detail: "Neither trend nor pattern offers an edge. Stand aside.",
      };
    return {
      conviction: "moderate",
      headline: `${bias === "bullish" ? "Bullish" : "Bearish"} pattern in a range — play the range boundary only`,
      detail: "Without a trend behind it, the pattern is a mean-reversion cue inside the range, not a breakout call.",
    };
  }

  return {
    conviction: "none",
    headline: "Regime unknown — pattern read is unreliable",
    detail: "Not enough price history to establish a trend regime, so pattern context cannot be judged.",
  };
}

export function combineRegimeAndPatterns(regime: MarketRegime, patterns: PatternHit[]): RegimePatternInsight {
  const { bias } = patternBias(patterns);
  const { conviction, headline, detail } = lookup(regime, bias);
  return { regime, patternBias: bias, conviction, headline, detail, patterns };
}

/** Compact multi-line rendering suitable for injection into an LLM context block. */
export function formatRegimePatternInsight(insight: RegimePatternInsight): string {
  const names = insight.patterns.length > 0 ? insight.patterns.map((p) => `${p.pattern} (${p.date})`).join(", ") : "none in the last 10 sessions";
  return [
    `Regime: ${insight.regime} | pattern bias: ${insight.patternBias} | conviction: ${insight.conviction}`,
    `Patterns: ${names}`,
    insight.headline,
    insight.detail,
  ].join("\n");
}
