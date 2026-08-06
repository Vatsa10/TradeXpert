
export interface Signal {
  category: "technical" | "fundamental" | "sentiment" | "macro";
  indicator: string;
  value: string | number;
  signal: "bullish" | "bearish" | "neutral";
  strength: number;
  reasoning: string;
}

export interface SignalBundle {
  signals: Signal[];
  overallTrend: "bullish" | "bearish" | "neutral";
  strength: number;
  summary: string;
}

export function buildSignals(
  priceData: any,
  metrics: any,
  sentiment: string
): SignalBundle {
  const signals: Signal[] = [];

  if (priceData) {
    // PriceData (lib/chat/types.ts) exposes `changePercent`; the legacy
    // `change_percent` / `dp` aliases are kept only for raw provider payloads.
    const change = priceData.changePercent ?? priceData.change_percent ?? priceData.dp ?? 0;
    const currentPrice = priceData.current ?? priceData.c;
    // 52-week bounds live on FinancialMetrics, not on the quote payload.
    const high52w = metrics?.fifty_two_week_high ?? priceData.fifty_two_week_high;
    const low52w = metrics?.fifty_two_week_low ?? priceData.fifty_two_week_low;

    signals.push({
      category: "technical",
      indicator: "Price Momentum",
      value: `${change.toFixed(2)}%`,
      signal: change > 2 ? "bullish" : change < -2 ? "bearish" : "neutral",
      strength: Math.min(Math.abs(change) / 5, 1),
      reasoning:
        change > 2
          ? "Strong positive momentum"
          : change < -2
          ? "Significant downward pressure"
          : "Stable price action",
    });

    if (high52w && low52w && currentPrice && high52w > low52w) {
      const position = ((currentPrice - low52w) / (high52w - low52w)) * 100;
      signals.push({
        category: "technical",
        indicator: "52 Week Position",
        value: `${position.toFixed(1)}%`,
        signal: position > 80 ? "bearish" : position < 20 ? "bullish" : "neutral",
        strength: position > 80 || position < 20 ? 0.7 : 0.3,
        reasoning:
          position > 80
            ? "Near 52-week high - potential pullback risk"
            : position < 20
            ? "Near 52-week low - potential value opportunity"
            : "Trading within normal range",
      });
    }
  }

  if (metrics) {
    const pe = metrics.pe_ratio;
    if (pe) {
      signals.push({
        category: "fundamental",
        indicator: "P/E Ratio",
        value: pe.toFixed(1),
        signal: pe < 15 ? "bullish" : pe > 30 ? "bearish" : "neutral",
        strength: pe < 15 || pe > 30 ? 0.6 : 0.3,
        reasoning:
          pe < 15
            ? "Attractive valuation"
            : pe > 30
            ? "Premium valuation - higher risk"
            : "Fair valuation",
      });
    }

    const debtToEquity = metrics.debt_to_equity;
    if (debtToEquity !== undefined && debtToEquity !== null) {
      signals.push({
        category: "fundamental",
        indicator: "Debt to Equity",
        value: debtToEquity.toFixed(1),
        signal: debtToEquity < 1 ? "bullish" : debtToEquity > 2 ? "bearish" : "neutral",
        strength: debtToEquity < 1 || debtToEquity > 2 ? 0.5 : 0.2,
        reasoning:
          debtToEquity < 1
            ? "Healthy leverage"
            : debtToEquity > 2
            ? "High debt burden"
            : "Moderate leverage",
      });
    }
  }

  if (sentiment) {
    signals.push({
      category: "sentiment",
      indicator: "Market Sentiment",
      value: sentiment,
      signal: sentiment === "bullish" ? "bullish" : sentiment === "bearish" ? "bearish" : "neutral",
      strength: 0.5,
      reasoning: `Current sentiment is ${sentiment}`,
    });
  }

  const bullishSignals = signals.filter((s) => s.signal === "bullish");
  const bearishSignals = signals.filter((s) => s.signal === "bearish");

  const bullishStrength = bullishSignals.reduce((sum, s) => sum + s.strength, 0);
  const bearishStrength = bearishSignals.reduce((sum, s) => sum + s.strength, 0);

  let overallTrend: "bullish" | "bearish" | "neutral" = "neutral";
  let strength = 0;

  if (bullishStrength > bearishStrength + 0.3) {
    overallTrend = "bullish";
    strength = Math.min(bullishStrength - bearishStrength, 1);
  } else if (bearishStrength > bullishStrength + 0.3) {
    overallTrend = "bearish";
    strength = Math.min(bearishStrength - bullishStrength, 1);
  }

  const summary = `${signals.length} signals analyzed: ${bullishSignals.length} bullish, ${bearishSignals.length} bearish, ${signals.length - bullishSignals.length - bearishSignals.length} neutral`;

  return {
    signals,
    overallTrend,
    strength,
    summary,
  };
}
