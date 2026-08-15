"use client";

import { Zap, TriangleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatMoney,
  type InstantPanelView,
  type RegimeLabel,
} from "./progressive-types";

const REGIME_STYLES: Record<RegimeLabel, string> = {
  BULL: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  BEAR: "bg-red-500/10 text-red-400 border-red-500/30",
  SIDEWAYS: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

const TONE_TEXT = {
  positive: "text-emerald-400",
  negative: "text-red-400",
  neutral: "text-gray-200",
} as const;

/**
 * Deterministic, zero-LLM snapshot rendered the instant an analysis starts.
 * Everything here comes straight from quotes/indicators, so it must never
 * block on the agents behind it.
 */
export default function InstantSnapshot({ panel }: { panel: InstantPanelView }) {
  const changeTone =
    panel.changePercent === undefined
      ? "neutral"
      : panel.changePercent >= 0
        ? "positive"
        : "negative";

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out rounded-2xl border border-[#27272A] bg-[#111111] p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest leading-none">
            Instant Snapshot
          </span>
        </div>
        {panel.regime && (
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest",
              REGIME_STYLES[panel.regime]
            )}
            title={panel.regimeSummary}
          >
            {panel.regime}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{panel.symbol}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-white tabular-nums">
            {formatMoney(panel.price, panel.currency)}
          </p>
        </div>
        {(panel.change !== undefined || panel.changePercent !== undefined) && (
          <p className={cn("pb-1 text-sm font-medium tabular-nums", TONE_TEXT[changeTone])}>
            {panel.change !== undefined && `${panel.change >= 0 ? "+" : ""}${panel.change.toFixed(2)}`}
            {panel.changePercent !== undefined &&
              ` (${panel.changePercent >= 0 ? "+" : ""}${panel.changePercent.toFixed(2)}%)`}
          </p>
        )}
      </div>

      {/* Key metric chips */}
      {panel.metrics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {panel.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-[#27272A] bg-[#1A1A1A] px-3 py-1.5"
            >
              <span className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                {metric.label}
              </span>
              <span className="ml-2 text-sm font-semibold text-gray-100 tabular-nums">
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Indicator badges */}
      {panel.indicators.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {panel.indicators.map((indicator) => (
            <div
              key={indicator.label}
              className="rounded-lg border border-[#27272A] bg-[#1A1A1A] p-3"
            >
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                {indicator.label}
              </p>
              <p className={cn("mt-1 text-lg font-semibold tabular-nums", TONE_TEXT[indicator.tone])}>
                {indicator.value}
              </p>
              {indicator.signal && (
                <p className="mt-0.5 text-xs text-gray-500">{indicator.signal}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Valuation flags */}
      {panel.valuationFlags.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4 space-y-2">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
            <TriangleAlert className="w-3.5 h-3.5" /> Valuation Flags
          </h4>
          <ul className="space-y-1.5">
            {panel.valuationFlags.map((flag, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-gray-400 leading-relaxed">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/60" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Allocation note — explicitly illustrative, never advice */}
      {panel.allocationNote && (
        <div className="flex gap-2.5 rounded-xl border border-[#27272A] bg-[#1A1A1A] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              Suggested Allocation
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">{panel.allocationNote}</p>
            <p className="text-xs text-gray-600">
              Illustrative sizing only — not investment advice.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
