"use client";

import {
  DataTable,
  EmptyState,
  InlineNotice,
  Money,
  NumberValue,
  Panel,
  Skeleton,
} from "@/components/system";

import type { PaperPosition } from "./types";

export function PositionsPanel({
  loading,
  positions,
  pricingDegraded,
}: {
  loading: boolean;
  positions: PaperPosition[];
  pricingDegraded: boolean;
}) {
  return (
    <Panel
      flush
      title="Positions"
      description="Open simulated holdings, marked to the last price."
    >
      {loading ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="space-y-3">
          {pricingDegraded && positions.length > 0 && (
            <InlineNotice tone="warn">
              Some positions could not be marked to a live price and are shown at cost.
            </InlineNotice>
          )}

          <DataTable
            rows={positions}
            getRowKey={(position, index) => `${position.symbol ?? "row"}-${index}`}
            stickyFirstColumn
            caption="Open paper positions"
            empty={
              <EmptyState
                title="No open positions"
                description="Place a paper trade to get started."
              />
            }
            columns={[
              {
                key: "symbol",
                header: "Symbol",
                sortable: true,
                sortValue: (p) => p.symbol ?? null,
                cell: (p) => <span className="font-medium text-ink">{p.symbol ?? "—"}</span>,
              },
              {
                key: "qty",
                header: "Qty",
                numeric: true,
                sortable: true,
                sortValue: (p) => p.qty ?? null,
                cell: (p) => <NumberValue value={p.qty ?? null} digits={0} />,
              },
              {
                key: "avgCost",
                header: "Avg cost",
                numeric: true,
                sortable: true,
                sortValue: (p) => p.avgCost ?? null,
                cell: (p) => <Money value={p.avgCost ?? null} currency="INR" digits={2} />,
              },
              {
                key: "ltp",
                header: "LTP",
                numeric: true,
                sortable: true,
                sortValue: (p) => p.lastPrice ?? null,
                cell: (p) => <Money value={p.lastPrice ?? null} currency="INR" digits={2} />,
              },
              {
                key: "pnl",
                header: "Unrealized P&L",
                numeric: true,
                sortable: true,
                sortValue: (p) => p.unrealizedPnL ?? null,
                cell: (p) => (
                  <Money
                    value={p.unrealizedPnL ?? null}
                    currency="INR"
                    digits={2}
                    colored
                    signed
                  />
                ),
              },
            ]}
          />
        </div>
      )}
    </Panel>
  );
}
