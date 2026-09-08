"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge, Panel, Percent, Surface, formatCompactNum } from "@/components/system";

import { METRIC_LABELS, type FundamentalsResponse, type GrowthRate } from "./types";

function GrowthBadge({ label, value }: { label: string; value: number | null }) {
  const known = value !== null && Number.isFinite(value);
  const positive = known && (value as number) >= 0;

  return (
    <Badge tone={!known ? "neutral" : positive ? "up" : "down"} pill>
      {known &&
        (positive ? (
          <TrendingUp className="size-3" aria-hidden />
        ) : (
          <TrendingDown className="size-3" aria-hidden />
        ))}
      <span className="text-ink-faint">{label}</span>
      <Percent value={value} signed className="ml-0.5" />
    </Badge>
  );
}

export interface GrowthRow {
  key: string;
  label: string;
  quarterly: GrowthRate | null;
  annual: GrowthRate | null;
}

/** Builds the row model from the fundamentals payload. */
export function toGrowthRows(fundamentals: FundamentalsResponse | null): GrowthRow[] {
  if (!fundamentals?.growth) return [];
  const keys = Array.from(
    new Set([
      ...Object.keys(fundamentals.growth.quarterly ?? {}),
      ...Object.keys(fundamentals.growth.annual ?? {}),
    ])
  );
  return keys.map((key) => ({
    key,
    label: METRIC_LABELS[key] ?? key,
    quarterly: fundamentals.growth.quarterly?.[key] ?? null,
    annual: fundamentals.growth.annual?.[key] ?? null,
  }));
}

export function GrowthSummary({ symbol, rows }: { symbol?: string; rows: GrowthRow[] }) {
  if (rows.length === 0) return null;

  return (
    <Panel
      title={`Growth summary${symbol ? ` — ${symbol}` : ""}`}
      description="Quarterly figures compare the latest quarter (QoQ vs prior quarter, YoY vs same quarter last year). Annual compares full years."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {rows.map((row, i) => (
          <Surface
            key={row.key}
            level="raised-2"
            radius="tile"
            padding="sm"
            className="app-enter sm:p-4"
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-medium text-ink">{row.label}</p>
              <p className="tnum text-sm text-ink-secondary">
                {formatCompactNum(
                  row.quarterly?.latestValue ?? row.annual?.latestValue ?? null,
                  2
                )}
              </p>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="app-label w-16">Quarter</span>
                <GrowthBadge label="QoQ" value={row.quarterly?.qoqGrowthPct ?? null} />
                <GrowthBadge label="YoY" value={row.quarterly?.yoyGrowthPct ?? null} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="app-label w-16">Annual</span>
                <GrowthBadge label="YoY" value={row.annual?.qoqGrowthPct ?? null} />
              </div>
            </div>
          </Surface>
        ))}
      </div>
    </Panel>
  );
}
