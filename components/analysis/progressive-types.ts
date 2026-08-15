import type { InstantPanel } from "@/lib/analysis/instant-panel";
import type { QuantitativeAnalysis, QualitativeAnalysis } from "@/lib/analysis/types";

/**
 * View models for the progressive analysis UI.
 *
 * The server persists the stage payloads as plain JSON, so everything arriving
 * here is untrusted-shaped: analyses created before the staged pipeline carry
 * none of these fields and must keep rendering from `report` alone.
 */

export type RegimeLabel = "BULL" | "BEAR" | "SIDEWAYS";
export type StageKey = "instant" | "quant" | "qual" | "report";
export type StageState = "pending" | "done" | "error";

export interface InstantIndicator {
  label: string;
  value: string;
  signal?: string;
  tone: "positive" | "negative" | "neutral";
}

export interface InstantPanelView {
  symbol: string;
  currency: "INR" | "USD";
  price?: number;
  change?: number;
  changePercent?: number;
  metrics: { label: string; value: string }[];
  indicators: InstantIndicator[];
  regime?: RegimeLabel;
  regimeSummary?: string;
  valuationFlags: string[];
  allocationNote?: string;
}

const num = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const isIndianSymbol = (symbol?: string) => !!symbol && /\.(NS|BO)$/i.test(symbol.trim());

export const formatMoney = (value: number | undefined, currency: "INR" | "USD") => {
  if (!Number.isFinite(value as number)) return "—";
  const v = value as number;
  return `${currency === "INR" ? "₹" : "$"}${v.toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2,
  })}`;
};

export const formatCompact = (value: number | undefined, currency: "INR" | "USD") => {
  if (!Number.isFinite(value as number)) return "—";
  return `${currency === "INR" ? "₹" : "$"}${(value as number).toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  })}`;
};

const toneForSignal = (signal?: string | null): InstantIndicator["tone"] =>
  signal === "bullish" ? "positive" : signal === "bearish" ? "negative" : "neutral";

/**
 * Builds the snapshot view model. Returns null when the payload carries nothing
 * worth showing — which is the case for every analysis predating the pipeline.
 */
export function normalizeInstantPanel(raw: unknown, fallbackSymbol?: string): InstantPanelView | null {
  if (!raw || typeof raw !== "object") return null;
  const panel = raw as Partial<InstantPanel>;

  const symbol = (panel.symbol || fallbackSymbol || "").toUpperCase();
  const currency: "INR" | "USD" = isIndianSymbol(symbol) ? "INR" : "USD";

  const price = num(panel.quote?.current);
  const change = num(panel.quote?.change);
  const changePercent = num(panel.quote?.changePercent);

  const metrics: { label: string; value: string }[] = [];
  const pe = num(panel.metrics?.pe_ratio) ?? num(panel.valuation?.peRatio);
  if (pe !== undefined) metrics.push({ label: "P/E", value: pe.toFixed(1) });

  const marketCap = num(panel.metrics?.market_cap);
  if (marketCap !== undefined) metrics.push({ label: "Mkt Cap", value: formatCompact(marketCap, currency) });

  const position = num(panel.valuation?.fiftyTwoWeekPositionPct);
  if (position !== undefined) metrics.push({ label: "52w Position", value: `${position.toFixed(0)}%` });

  const high52 = num(panel.metrics?.fifty_two_week_high);
  if (high52 !== undefined) metrics.push({ label: "52w High", value: formatMoney(high52, currency) });
  const low52 = num(panel.metrics?.fifty_two_week_low);
  if (low52 !== undefined) metrics.push({ label: "52w Low", value: formatMoney(low52, currency) });

  const indicators: InstantIndicator[] = [];
  const rsi = panel.indicators?.rsi;
  if (rsi && num(rsi.value) !== undefined) {
    indicators.push({
      label: "RSI",
      value: (rsi.value as number).toFixed(1),
      signal: rsi.signal,
      tone: toneForSignal(rsi.signal),
    });
  }
  const macd = panel.indicators?.macd;
  if (macd) {
    indicators.push({
      label: "MACD",
      value: num(macd.value) !== undefined ? (macd.value as number).toFixed(2) : macd.signal,
      // The crossover is the actionable read when present; the raw signal otherwise.
      signal: macd.crossover ? `${macd.crossover} crossover` : macd.signal,
      tone: toneForSignal(macd.crossover ?? macd.signal),
    });
  }
  const sma50 = panel.indicators?.sma50;
  if (sma50 && num(sma50.value) !== undefined) {
    indicators.push({
      label: "SMA 50",
      value: formatMoney(sma50.value as number, currency),
      signal: sma50.signal,
      tone: toneForSignal(sma50.signal),
    });
  }
  const regimeRaw = panel.regime?.regime;
  const regime: RegimeLabel | undefined =
    regimeRaw === "BULL" || regimeRaw === "BEAR" || regimeRaw === "SIDEWAYS" ? regimeRaw : undefined;
  if (regime) {
    indicators.push({
      label: "Trend",
      value: regime,
      signal: panel.regime?.direction,
      tone: toneForSignal(panel.regime?.direction),
    });
  }

  const valuationFlags = Array.isArray(panel.valuation?.flags) ? panel.valuation.flags : [];

  const gate = panel.riskGate;
  const allocationNote = gate
    ? [
        num(gate.maxAllocationPct) !== undefined
          ? `Up to ${(gate.maxAllocationPct * 100).toFixed(1)}% of capital` +
            (num(gate.maxAllocationAmount) !== undefined
              ? ` (${formatMoney(gate.maxAllocationAmount, currency)}, ${gate.maxShares} shares)`
              : "")
          : undefined,
        gate.note,
        gate.constraints?.length ? gate.constraints.join(" · ") : undefined,
      ]
        .filter(Boolean)
        .join(" — ")
    : undefined;

  const hasContent =
    price !== undefined || metrics.length > 0 || indicators.length > 0 || valuationFlags.length > 0;
  if (!hasContent) return null;

  return {
    symbol,
    currency,
    price,
    change,
    changePercent,
    metrics,
    indicators,
    regime,
    regimeSummary: panel.regime?.summary,
    valuationFlags,
    allocationNote: allocationNote || undefined,
  };
}

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;

/** Guards against half-written stage documents (agent errored mid-flight). */
export function normalizeQuant(raw: unknown): QuantitativeAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const quant = raw as QuantitativeAnalysis;
  if (!hasText(quant.trend_analysis) && !hasText(quant.key_metrics_summary)) return null;
  return quant;
}

export function normalizeQual(raw: unknown): QualitativeAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const qual = raw as QualitativeAnalysis;
  if (!hasText(qual.news_summary) && !hasText(qual.market_perception) && !hasText(qual.overall_sentiment))
    return null;
  return qual;
}

/** Maps a persisted stage document (`stages.<key>.state`) onto the rail's states. */
export function stageStateFrom(raw: unknown): StageState | null {
  const state = (raw as any)?.state;
  if (state === "completed" || state === "done") return "done";
  if (state === "error" || state === "failed") return "error";
  if (state === "pending" || state === "running") return "pending";
  return null;
}
