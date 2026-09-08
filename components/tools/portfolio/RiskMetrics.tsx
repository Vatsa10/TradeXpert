"use client";

import { StatCard, StatGrid, formatNum, formatPct } from "@/components/system";

export interface PortfolioMetrics {
  annualReturn: number;
  annualVolatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  var95: number;
  cvar95: number;
  skewness: number;
  kurtosis: number;
}

/** Six risk tiles. `tone` here is a judgement, not a market direction. */
export function RiskMetrics({ metrics }: { metrics: PortfolioMetrics }) {
  return (
    <StatGrid columns={6}>
      <StatCard
        index={0}
        label="Sharpe"
        value={formatNum(metrics.sharpeRatio)}
        tone={metrics.sharpeRatio >= 1 ? "positive" : "neutral"}
        hint="Return per unit of risk"
      />
      <StatCard
        index={1}
        label="Sortino"
        value={formatNum(metrics.sortinoRatio)}
        tone={metrics.sortinoRatio >= 1 ? "positive" : "neutral"}
        hint="Downside-adjusted"
      />
      <StatCard
        index={2}
        label="Calmar"
        value={formatNum(metrics.calmarRatio)}
        hint="Return vs. max drawdown"
      />
      <StatCard
        index={3}
        label="Max Drawdown"
        value={formatPct(metrics.maxDrawdown)}
        tone="negative"
        hint="Worst peak-to-trough"
      />
      <StatCard
        index={4}
        label="VaR 95%"
        value={formatPct(metrics.var95)}
        tone="negative"
        hint="Daily loss, 1-in-20"
      />
      <StatCard
        index={5}
        label="CVaR 95%"
        value={formatPct(metrics.cvar95)}
        tone="negative"
        hint="Avg loss beyond VaR"
      />
    </StatGrid>
  );
}
