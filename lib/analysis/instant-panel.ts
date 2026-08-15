// Deterministic, zero-LLM "instant panel" for the Investment Intelligence page.
//
// This is stage 1 of the progressive analysis pipeline: it must return in well
// under a second on warm caches so the user sees real numbers immediately,
// while the LLM agents (quant/qual/report) keep running in the background.
//
// Rules:
//  - No model calls, no reasoning, no synthesis — arithmetic on fetched data only.
//  - Every section is nullable. Missing data is reported as `null` plus an entry
//    in `missing[]`; nothing is ever estimated or fabricated to fill a gap.
//  - All fetches run in parallel behind a hard per-fetch timeout, so one slow
//    upstream degrades a single section instead of the whole panel.

import { getFinnhubQuote, getStockMetrics } from "@/lib/chat/aggregator";
import { normalizeMetrics } from "@/lib/chat/context-builder";
import type { FinancialMetrics } from "@/lib/chat/types";
import {
  computeIndicatorsFromSeries,
  fetchDailySeries,
  type OHLCV,
  type TechnicalIndicators,
} from "@/lib/analysis/technical-indicators";
import { detectRegime, regimeSummaryLine, type RegimeResult } from "@/lib/analysis/market-regime";
import { computeRiskGate, type RiskGateResult } from "@/lib/analysis/risk-gate";
import { getIndianHistorical, isLikelyIndianTicker } from "@/lib/data/providers/nse-india";

/** Per-fetch budget. A section that misses it is simply reported missing. */
const FETCH_TIMEOUT_MS = 3000;

/** Nominal capital the illustrative risk gate is computed against. */
export const ILLUSTRATIVE_CAPITAL = 100000;

export interface InstantQuote {
  current: number | null;
  change: number | null;
  changePercent: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  prevClose: number | null;
}

export interface ValuationFlagsInput {
  pe?: number | null;
  price?: number | null;
  high52?: number | null;
  low52?: number | null;
  sma50?: number | null;
  sma200?: number | null;
}

export interface ValuationFlags {
  peRatio: number | null;
  /** Where price sits in the 52-week range, 0 = at the low, 100 = at the high. */
  fiftyTwoWeekPositionPct: number | null;
  priceVsSma50Pct: number | null;
  priceVsSma200Pct: number | null;
  /** Short, factual observations — no recommendation, no forecast. */
  flags: string[];
}

export interface InstantPanel {
  symbol: string;
  generatedAt: string;
  /** Wall-clock time the panel took to assemble, for the latency budget. */
  elapsedMs: number;
  quote: InstantQuote | null;
  metrics: FinancialMetrics | null;
  indicators: TechnicalIndicators | null;
  regime: (RegimeResult & { summary: string }) | null;
  valuation: ValuationFlags | null;
  riskGate: (RiskGateResult & { illustrativeCapital: number; note: string }) | null;
  /** Names of sections that could not be built from real data. */
  missing: string[];
}

async function withTimeout<T>(promise: Promise<T>, ms = FETCH_TIMEOUT_MS): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
    ]);
  } catch {
    return null;
  }
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Pure valuation arithmetic. No network, no defaults: an input that is absent
 * produces a null output and contributes no flag.
 */
export function computeValuationFlags(input: ValuationFlagsInput): ValuationFlags {
  const pe = num(input.pe);
  const price = num(input.price);
  const high52 = num(input.high52);
  const low52 = num(input.low52);
  const sma50 = num(input.sma50);
  const sma200 = num(input.sma200);

  const flags: string[] = [];

  // 52-week position. A degenerate range (high <= low) is unusable, not 0%.
  let position: number | null = null;
  if (price !== null && high52 !== null && low52 !== null && high52 > low52) {
    const raw = ((price - low52) / (high52 - low52)) * 100;
    // Prices can print outside the trailing window; clamp so the gauge reads 0-100.
    position = Math.max(0, Math.min(100, raw));
    if (position >= 90) flags.push(`Trading near the 52-week high (${position.toFixed(0)}% of range)`);
    else if (position <= 10) flags.push(`Trading near the 52-week low (${position.toFixed(0)}% of range)`);
  }

  const pct = (base: number | null): number | null =>
    price !== null && base !== null && base > 0 ? ((price - base) / base) * 100 : null;

  const vsSma50 = pct(sma50);
  const vsSma200 = pct(sma200);
  if (vsSma50 !== null) {
    flags.push(`Price is ${vsSma50 >= 0 ? "above" : "below"} the 50-day average by ${Math.abs(vsSma50).toFixed(1)}%`);
  }
  if (vsSma200 !== null) {
    flags.push(`Price is ${vsSma200 >= 0 ? "above" : "below"} the 200-day average by ${Math.abs(vsSma200).toFixed(1)}%`);
  }

  if (pe !== null) {
    if (pe <= 0) flags.push("Negative or zero trailing P/E — company is not profitable on a TTM basis");
    else if (pe > 40) flags.push(`Elevated trailing P/E (${pe.toFixed(1)})`);
    else if (pe < 12) flags.push(`Low trailing P/E (${pe.toFixed(1)})`);
    else flags.push(`Trailing P/E of ${pe.toFixed(1)}`);
  }

  return {
    peRatio: pe,
    fiftyTwoWeekPositionPct: position,
    priceVsSma50Pct: vsSma50,
    priceVsSma200Pct: vsSma200,
    flags,
  };
}

/** Pure assembly: turns whatever the fetches produced into the panel shape. */
export function assembleInstantPanel(parts: {
  symbol: string;
  quote: any | null;
  rawMetrics: any | null;
  series: OHLCV[] | null;
  elapsedMs: number;
  now?: Date;
}): InstantPanel {
  const missing: string[] = [];

  const quote: InstantQuote | null = parts.quote
    ? {
        current: num(parts.quote.current),
        change: num(parts.quote.change),
        changePercent: num(parts.quote.changePercent),
        high: num(parts.quote.high),
        low: num(parts.quote.low),
        open: num(parts.quote.open),
        prevClose: num(parts.quote.prevClose),
      }
    : null;
  if (!quote || quote.current === null) missing.push("quote");

  const metrics = normalizeMetrics(parts.rawMetrics);
  if (!metrics) missing.push("metrics");

  const series = parts.series && parts.series.length > 0 ? parts.series : null;
  const indicators = series ? computeIndicatorsFromSeries(series) : null;
  if (!indicators) missing.push("indicators");

  const regimeResult = series ? detectRegime(series) : null;
  const regime =
    regimeResult && regimeResult.regime !== "UNKNOWN"
      ? { ...regimeResult, summary: regimeSummaryLine(regimeResult) }
      : null;
  if (!regime) missing.push("regime");

  // Price falls back to the last close when the live quote is unavailable —
  // that is a real observed number, not an estimate.
  const price = quote?.current ?? (series ? num(series[series.length - 1]?.close) : null);

  const valuationInput: ValuationFlagsInput = {
    pe: metrics?.pe_ratio ?? null,
    price,
    high52: metrics?.fifty_two_week_high ?? null,
    low52: metrics?.fifty_two_week_low ?? null,
    sma50: regimeResult?.sma50 ?? num(indicators?.sma50?.value),
    sma200: regimeResult?.sma200 ?? null,
  };
  const valuation = computeValuationFlags(valuationInput);
  const hasValuation = valuation.flags.length > 0;
  if (!hasValuation) missing.push("valuation");

  const riskGate =
    price !== null
      ? {
          ...computeRiskGate({
            accountCapital: ILLUSTRATIVE_CAPITAL,
            cashAvailable: ILLUSTRATIVE_CAPITAL,
            currentPrice: price,
          }),
          illustrativeCapital: ILLUSTRATIVE_CAPITAL,
          note: `Illustrative only: sizing shown against a nominal ${ILLUSTRATIVE_CAPITAL} of capital, not your portfolio.`,
        }
      : null;
  if (!riskGate) missing.push("riskGate");

  return {
    symbol: parts.symbol,
    generatedAt: (parts.now ?? new Date()).toISOString(),
    elapsedMs: parts.elapsedMs,
    quote,
    metrics,
    indicators,
    regime,
    valuation: hasValuation ? valuation : null,
    riskGate,
    missing,
  };
}

/**
 * Build the instant panel for a symbol. Zero LLM calls; all upstream fetches
 * run in parallel under a per-fetch timeout.
 */
export async function buildInstantPanel(symbol: string, userEmail?: string): Promise<InstantPanel> {
  const startedAt = Date.now();
  const indian = isLikelyIndianTicker(symbol);

  const [quote, rawMetrics, series] = await Promise.all([
    withTimeout(getFinnhubQuote(symbol, userEmail)),
    withTimeout(getStockMetrics(symbol)),
    withTimeout<OHLCV[] | null>(indian ? getIndianHistorical(symbol) : fetchDailySeries(symbol)),
  ]);

  return assembleInstantPanel({
    symbol,
    quote,
    rawMetrics,
    series: series ?? null,
    elapsedMs: Date.now() - startedAt,
  });
}
