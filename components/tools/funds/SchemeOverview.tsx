"use client";

import { Money, Panel } from "@/components/system";

import NavChart, { type NavPoint } from "@/app/(root)/(authenticated)/tools/mutual-funds/NavChart";
import type { Scheme } from "./SchemeSearch";

export function SchemeOverview({
  scheme,
  latestNav,
  navHistoryCount,
  chartPoints,
}: {
  scheme: Scheme;
  latestNav: NavPoint | null;
  navHistoryCount: number;
  chartPoints: NavPoint[];
}) {
  const meta: { label: string; value: React.ReactNode }[] = [
    { label: "Fund House", value: scheme.fundHouse || "—" },
    { label: "Category", value: scheme.schemeCategory || "—" },
    { label: "Type", value: scheme.schemeType || "—" },
    {
      label: "Latest NAV",
      value: latestNav ? (
        <>
          <Money value={latestNav.nav} currency="INR" digits={2} /> · {latestNav.date}
        </>
      ) : (
        "—"
      ),
    },
  ];

  return (
    <>
      <Panel title={scheme.schemeName}>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {meta.map(({ label, value }) => (
            <div key={label}>
              <dt className="app-label">{label}</dt>
              <dd className="mt-1 text-sm text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel
        flush
        title="NAV — last 12 months"
        action={
          <span className="tnum text-xs text-ink-faint">
            {chartPoints.length} of {navHistoryCount} points
          </span>
        }
      >
        <NavChart points={chartPoints} />
      </Panel>
    </>
  );
}
