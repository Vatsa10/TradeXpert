// Portfolio performance metrics.
// Ported from intraday-stock-targets/trading_engine.py:334-382 (the metrics
// half of optimize_portfolio), reimplemented in pure TS. Skewness and kurtosis
// use the sample-adjusted (Fisher) definitions pandas' .skew()/.kurtosis() use.

import { TRADING_DAYS_PER_YEAR } from "@/lib/analysis/portfolio-optimizer";

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

export interface PortfolioMetricsResult {
  metrics: PortfolioMetrics;
  // Portfolio-level returns and growth of 1 unit, chronological.
  portfolioReturns: number[];
  portfolioCumulative: number[];
  // symbol -> growth of 1 unit for that asset alone, chronological.
  assetCumulative: Record<string, number[]>;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sampleStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1));
}

// Linear-interpolated percentile, matching numpy.percentile's default.
function percentile(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = ((sorted.length - 1) * pct) / 100;
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}

// Sample skewness (pandas .skew(), bias-corrected).
function skewness(values: number[]): number {
  const n = values.length;
  if (n < 3) return 0;
  const m = mean(values);
  const sd = sampleStdDev(values);
  if (sd === 0) return 0;
  const sum = values.reduce((s, v) => s + ((v - m) / sd) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

// Sample excess kurtosis (pandas .kurtosis(), bias-corrected Fisher).
function kurtosis(values: number[]): number {
  const n = values.length;
  if (n < 4) return 0;
  const m = mean(values);
  const sd = sampleStdDev(values);
  if (sd === 0) return 0;
  const sum = values.reduce((s, v) => s + ((v - m) / sd) ** 4, 0);
  const a = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
  const b = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return a * sum - b;
}

function cumulativeGrowth(returns: number[]): number[] {
  const out: number[] = [];
  let acc = 1;
  for (const r of returns) {
    acc *= 1 + r;
    out.push(acc);
  }
  return out;
}

function maxDrawdown(cumulative: number[]): number {
  let peak = -Infinity;
  let worst = 0;
  for (const v of cumulative) {
    if (v > peak) peak = v;
    if (peak > 0) {
      const dd = (v - peak) / peak;
      if (dd < worst) worst = dd;
    }
  }
  return worst;
}

/**
 * @param weights symbol -> weight (need not be normalised; it is here).
 * @param returnSeries symbol -> chronological per-period returns (e.g. daily).
 *        Series are trimmed to their common (most recent) length.
 */
export function computePortfolioMetrics(
  weights: Record<string, number>,
  returnSeries: Record<string, number[]>
): PortfolioMetricsResult | null {
  const symbols = Object.keys(weights).filter(
    (s) => Array.isArray(returnSeries[s]) && returnSeries[s].length > 0
  );
  if (symbols.length === 0) return null;

  const len = Math.min(...symbols.map((s) => returnSeries[s].length));
  if (len < 2) return null;

  const trimmed: Record<string, number[]> = {};
  for (const s of symbols) {
    trimmed[s] = returnSeries[s].slice(returnSeries[s].length - len).map((v) => (Number.isFinite(v) ? v : 0));
  }

  const weightSum = symbols.reduce((a, s) => a + weights[s], 0);
  const norm: Record<string, number> = {};
  for (const s of symbols) {
    norm[s] = !Number.isFinite(weightSum) || weightSum === 0 ? 1 / symbols.length : weights[s] / weightSum;
  }

  const portfolioReturns: number[] = [];
  for (let i = 0; i < len; i++) {
    portfolioReturns.push(symbols.reduce((a, s) => a + norm[s] * trimmed[s][i], 0));
  }

  const annualReturn = mean(portfolioReturns) * TRADING_DAYS_PER_YEAR;
  const annualVolatility = sampleStdDev(portfolioReturns) * Math.sqrt(TRADING_DAYS_PER_YEAR);
  const sharpeRatio = annualVolatility === 0 ? 0 : annualReturn / annualVolatility;

  const downside = portfolioReturns.filter((r) => r < 0);
  // No losing period at all -> treat downside risk as negligible, not zero,
  // so Sortino stays finite instead of dividing by zero.
  const downsideDev = downside.length > 1 ? sampleStdDev(downside) * Math.sqrt(TRADING_DAYS_PER_YEAR) : 1e-6;
  const sortinoRatio = downsideDev === 0 ? 0 : annualReturn / downsideDev;

  const portfolioCumulative = cumulativeGrowth(portfolioReturns);
  const maxDd = maxDrawdown(portfolioCumulative);
  const calmarRatio = maxDd === 0 ? 0 : annualReturn / Math.abs(maxDd);

  const var95 = percentile(portfolioReturns, 5);
  const tail = portfolioReturns.filter((r) => r <= var95);
  const cvar95 = tail.length > 0 ? mean(tail) : var95;

  const assetCumulative: Record<string, number[]> = {};
  for (const s of symbols) assetCumulative[s] = cumulativeGrowth(trimmed[s]);

  return {
    metrics: {
      annualReturn,
      annualVolatility,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      maxDrawdown: maxDd,
      var95,
      cvar95,
      skewness: skewness(portfolioReturns),
      kurtosis: kurtosis(portfolioReturns),
    },
    portfolioReturns,
    portfolioCumulative,
    assetCumulative,
  };
}
