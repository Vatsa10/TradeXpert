"use client";

import { useMemo, useState } from "react";
import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";

import {
  Badge,
  DataTable,
  NumberValue,
  Panel,
  Percent,
  StatCard,
  StatGrid,
  formatCompactNum,
  formatNum,
} from "@/components/system";
import { cn } from "@/lib/utils";

import type { DCFResponse, DCFYearProjection } from "./types";

function FairValueHeader({
  dcf,
  price,
  upside,
}: {
  dcf: DCFResponse;
  price: number | null;
  upside: number | null;
}) {
  return (
    <Panel>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="app-label">Fair value per share</p>
          <p className="tnum mt-1 text-4xl font-bold text-brand md:text-5xl">
            {formatNum(dcf.dcf.fairValuePerShare, 2)}
          </p>

          {price !== null && price > 0 && upside !== null ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="tnum text-sm text-ink-secondary">
                vs market {formatNum(price, 2)}
              </span>
              <Badge tone={upside >= 0 ? "up" : "down"} pill size="md">
                {upside >= 0 ? (
                  <TrendingUp className="size-3.5" aria-hidden />
                ) : (
                  <TrendingDown className="size-3.5" aria-hidden />
                )}
                <Percent value={upside} digits={1} signed />
                {upside >= 0 ? "upside" : "downside"}
              </Badge>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-faint">
              Add a current price above to see upside/downside.
            </p>
          )}
        </div>

        <StatGrid columns={4} className="lg:min-w-[26rem]">
          {[
            { label: "PV explicit (10y)", value: dcf.dcf.sumPVExplicit },
            { label: "PV terminal", value: dcf.dcf.pvTerminalValue },
            { label: "Enterprise value", value: dcf.dcf.enterpriseValue },
            { label: "Equity value", value: dcf.dcf.equityValue },
          ].map((stat, i) => (
            <StatCard
              key={stat.label}
              index={i}
              size="sm"
              label={stat.label}
              value={formatCompactNum(stat.value, 2)}
            />
          ))}
        </StatGrid>
      </div>
    </Panel>
  );
}

function WaccBreakdown({ dcf, debtToEquity }: { dcf: DCFResponse; debtToEquity: number | null }) {
  const rows = [
    { label: "Cost of equity (CAPM)", value: `${dcf.wacc.costOfEquity.toFixed(2)}%` },
    {
      label: "After-tax cost of debt",
      value: dcf.wacc.usedDebtCost ? `${dcf.wacc.costOfDebtAfterTax.toFixed(2)}%` : "n/a",
    },
    {
      label: "Capital structure",
      value: dcf.wacc.usedDebtCost
        ? `D/E ${formatNum(debtToEquity, 2)}`
        : "Equity only (no debt)",
    },
    { label: "WACC", value: `${dcf.wacc.wacc.toFixed(2)}%` },
  ];

  return (
    <Panel
      title="WACC breakdown"
      description="Discount rate applied to every projected cash flow."
    >
      <dl className="divide-y divide-hairline">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-sm text-ink-secondary">{row.label}</dt>
            <dd className="tnum text-sm font-semibold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function SensitivityGrid({ dcf, price }: { dcf: DCFResponse; price: number | null }) {
  // Grid axes, derived from the flat cell list the API returns.
  const grid = useMemo(() => {
    if (!dcf.sensitivity?.length) return null;
    const growthRates = Array.from(new Set(dcf.sensitivity.map((c) => c.growthRate))).sort(
      (a, b) => a - b
    );
    const waccs = Array.from(new Set(dcf.sensitivity.map((c) => c.wacc))).sort((a, b) => a - b);
    const lookup = new Map(
      dcf.sensitivity.map((c) => [`${c.growthRate}|${c.wacc}`, c.fairValuePerShare])
    );
    return { growthRates, waccs, lookup };
  }, [dcf]);

  return (
    <Panel
      title="Sensitivity"
      description={
        price !== null && price > 0
          ? "Fair value per share across growth (rows) and WACC (columns). Green = above the current price."
          : "Fair value per share across growth (rows) and WACC (columns). Add a current price to colour the grid."
      }
    >
      {grid ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[380px] border-collapse text-sm">
            <caption className="sr-only">
              Fair value per share by growth rate and WACC
            </caption>
            <thead>
              <tr className="text-ink-secondary">
                <th scope="col" className="p-2 text-left font-medium">
                  Growth \ WACC
                </th>
                {grid.waccs.map((w) => (
                  <th key={w} scope="col" className="tnum p-2 text-right font-medium">
                    {w.toFixed(1)}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.growthRates.map((g) => (
                <tr key={g} className="border-t border-hairline">
                  <th scope="row" className="tnum p-2 text-left font-medium text-ink-secondary">
                    {g.toFixed(1)}%
                  </th>
                  {grid.waccs.map((w) => {
                    const fv = grid.lookup.get(`${g}|${w}`) ?? null;
                    const colored = price !== null && price > 0 && fv !== null;
                    return (
                      <td
                        key={w}
                        className={cn(
                          "tnum p-2 text-right font-medium",
                          !colored && "text-ink",
                          colored && fv >= price ? "bg-up/10 text-up" : colored ? "bg-down/10 text-down" : ""
                        )}
                      >
                        {fv === null ? "n/a" : formatNum(fv, 0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-ink-secondary">No sensitivity grid returned.</p>
      )}
    </Panel>
  );
}

function ProjectionTable({ dcf }: { dcf: DCFResponse }) {
  const [open, setOpen] = useState(false);

  const rows: (DCFYearProjection & { terminal?: boolean })[] = [
    ...dcf.dcf.projections,
    {
      year: -1,
      fcf: dcf.dcf.terminalValue,
      discountFactor: NaN,
      presentValue: dcf.dcf.pvTerminalValue,
      terminal: true,
    },
  ];

  return (
    <Panel>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="app-press app-focus flex w-full cursor-pointer items-center justify-between gap-4 text-left"
      >
        <span>
          <span className="block text-base font-semibold tracking-tight text-ink">
            10-year projection
          </span>
          <span className="mt-1 block text-sm text-ink-secondary">
            Projected free cash flow, discount factor and present value per year.
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-5 shrink-0 text-ink-secondary transition-transform duration-200 ease-out-strong",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="mt-4">
          <DataTable
            rows={rows}
            getRowKey={(row) => String(row.year)}
            caption="Ten-year discounted cash flow projection"
            columns={[
              {
                key: "year",
                header: "Year",
                cell: (row) => (row.terminal ? "Terminal" : row.year),
              },
              {
                key: "fcf",
                header: "Projected FCF",
                numeric: true,
                cell: (row) => formatCompactNum(row.fcf, 2),
              },
              {
                key: "df",
                header: "Discount factor",
                numeric: true,
                cell: (row) => <NumberValue value={row.terminal ? null : row.discountFactor} digits={4} />,
              },
              {
                key: "pv",
                header: "Present value",
                numeric: true,
                cell: (row) => formatCompactNum(row.presentValue, 2),
              },
            ]}
          />
        </div>
      )}
    </Panel>
  );
}

export function DcfResults({
  dcf,
  price,
  upside,
  debtToEquity,
}: {
  dcf: DCFResponse;
  price: number | null;
  upside: number | null;
  debtToEquity: number | null;
}) {
  return (
    <>
      <FairValueHeader dcf={dcf} price={price} upside={upside} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WaccBreakdown dcf={dcf} debtToEquity={debtToEquity} />
        <SensitivityGrid dcf={dcf} price={price} />
      </div>

      <ProjectionTable dcf={dcf} />
    </>
  );
}
