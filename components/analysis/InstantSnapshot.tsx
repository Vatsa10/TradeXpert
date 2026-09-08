"use client";

import { Info, TriangleAlert, Zap } from "lucide-react";

import {
  Badge,
  Delta,
  Money,
  Panel,
  Surface,
  type SemanticTone,
} from "@/components/system";
import { cn } from "@/lib/utils";

import type { InstantPanelView, RegimeLabel } from "./progressive-types";

/** Regime is a market read, so it uses the up/down direction tokens. */
const REGIME_TONE: Record<RegimeLabel, SemanticTone> = {
  BULL: "up",
  BEAR: "down",
  SIDEWAYS: "warning",
};

const INDICATOR_TONE = {
  positive: "text-up",
  negative: "text-down",
  neutral: "text-ink",
} as const;

/**
 * Deterministic, zero-LLM snapshot rendered the instant an analysis starts.
 * Everything here comes straight from quotes/indicators, so it must never
 * block on the agents behind it.
 */
export default function InstantSnapshot({ panel }: { panel: InstantPanelView }) {
  return (
    <Panel
      className="app-enter"
      title={
        <span className="flex items-center gap-2">
          <Zap className="size-3.5 text-brand" aria-hidden />
          <span className="app-label">Instant Snapshot</span>
        </span>
      }
      action={
        panel.regime ? (
          <Badge tone={REGIME_TONE[panel.regime]} pill uppercase title={panel.regimeSummary}>
            {panel.regime}
          </Badge>
        ) : undefined
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <div>
            <p className="app-label">{panel.symbol}</p>
            <p className="mt-1 text-[length:var(--text-figure-lg)] font-semibold tracking-tight">
              <Money value={panel.price} currency={panel.currency} />
            </p>
          </div>
          {(panel.change !== undefined || panel.changePercent !== undefined) && (
            <Delta
              className="pb-1"
              value={panel.change}
              percent={panel.changePercent}
              currency={panel.currency}
              arrow
            />
          )}
        </div>

        {panel.metrics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {panel.metrics.map((metric) => (
              <Surface
                key={metric.label}
                level="raised-2"
                radius="tile"
                padding="none"
                className="px-3 py-1.5"
              >
                <span className="app-label">{metric.label}</span>
                <span className="tnum ml-2 text-sm font-semibold text-ink">{metric.value}</span>
              </Surface>
            ))}
          </div>
        )}

        {panel.indicators.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {panel.indicators.map((indicator, i) => (
              <Surface
                key={indicator.label}
                level="raised-2"
                radius="tile"
                padding="sm"
                className="app-enter"
                style={{ "--i": i } as React.CSSProperties}
              >
                <p className="app-label">{indicator.label}</p>
                <p
                  className={cn(
                    "tnum mt-1 text-lg font-semibold",
                    INDICATOR_TONE[indicator.tone]
                  )}
                >
                  {indicator.value}
                </p>
                {indicator.signal && (
                  <p className="mt-0.5 text-xs text-ink-faint">{indicator.signal}</p>
                )}
              </Surface>
            ))}
          </div>
        )}

        {panel.valuationFlags.length > 0 && (
          <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/10 p-4">
            <h4 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-warning uppercase">
              <TriangleAlert className="size-3.5" aria-hidden /> Valuation Flags
            </h4>
            <ul className="space-y-1.5">
              {panel.valuationFlags.map((flag, idx) => (
                <li key={idx} className="flex gap-2 text-sm leading-relaxed text-ink-secondary">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-warning/60" aria-hidden />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {panel.allocationNote && (
          <Surface level="raised-2" radius="tile" padding="sm" className="flex gap-2.5">
            <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-widest text-info uppercase">Suggested Allocation</p>
              <p className="text-sm leading-relaxed text-ink-secondary">{panel.allocationNote}</p>
              <p className="text-xs text-ink-faint">
                Illustrative sizing only — not investment advice.
              </p>
            </div>
          </Surface>
        )}
      </div>
    </Panel>
  );
}
