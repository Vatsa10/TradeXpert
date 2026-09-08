"use client";

import { DonutChart, SectionHeader, formatPct } from "@/components/system";

export interface WeightRow {
  symbol: string;
  weight: number;
  color: string;
}

/** Donut + per-holding weight bars. */
export function AllocationBreakdown({ rows }: { rows: WeightRow[] }) {
  return (
    <div>
      <SectionHeader as="h3" title="Allocation" className="mb-3" />
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <DonutChart
          size={180}
          slices={rows.map((row) => ({
            label: `${row.symbol} · ${formatPct(row.weight, 1)}`,
            value: row.weight,
            color: row.color,
          }))}
        />
        <ul className="w-full space-y-2">
          {rows.map((row) => (
            <li key={row.symbol} className="text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium text-ink">
                  <span
                    aria-hidden
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  {row.symbol}
                </span>
                <span className="tnum text-ink-secondary">{formatPct(row.weight, 1)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(1, row.weight)) * 100}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
