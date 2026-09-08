"use client";

import {
  Badge,
  DataTable,
  EmptyState,
  Money,
  NumberValue,
  Panel,
  Skeleton,
} from "@/components/system";

import type { PaperTrade } from "./types";

function formatTimestamp(timestamp?: string) {
  const parsed = timestamp ? new Date(timestamp) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleString("en-IN") : "—";
}

export function TradeHistory({
  loading,
  trades,
}: {
  loading: boolean;
  trades: PaperTrade[];
}) {
  return (
    <Panel flush title="Trade history" description="Every simulated fill on this account.">
      {loading ? (
        <Skeleton className="h-32" />
      ) : (
        <DataTable
          rows={trades}
          getRowKey={(trade, index) => trade.id ?? trade._id ?? String(index)}
          stickyFirstColumn
          maxHeight="28rem"
          stickyHeader
          caption="Simulated trade history"
          empty={<EmptyState title="No trades yet" description="Your fills will appear here." />}
          columns={[
            {
              key: "time",
              header: "Time",
              sortable: true,
              sortValue: (t) => t.timestamp ?? null,
              cell: (t) => <span className="text-ink-secondary">{formatTimestamp(t.timestamp)}</span>,
            },
            {
              key: "symbol",
              header: "Symbol",
              sortable: true,
              sortValue: (t) => t.symbol ?? null,
              cell: (t) => <span className="font-medium text-ink">{t.symbol ?? "—"}</span>,
            },
            {
              key: "side",
              header: "Side",
              cell: (t) => {
                const side = t.side?.toUpperCase();
                if (!side) return "—";
                return (
                  <Badge tone={side === "BUY" ? "up" : "down"} uppercase>
                    {side}
                  </Badge>
                );
              },
            },
            {
              key: "qty",
              header: "Qty",
              numeric: true,
              sortable: true,
              sortValue: (t) => t.qty ?? null,
              cell: (t) => <NumberValue value={t.qty ?? null} digits={0} />,
            },
            {
              key: "price",
              header: "Price",
              numeric: true,
              sortable: true,
              sortValue: (t) => t.price ?? null,
              cell: (t) => <Money value={t.price ?? null} currency="INR" digits={2} />,
            },
            {
              key: "fees",
              header: "Fees",
              numeric: true,
              sortable: true,
              sortValue: (t) => t.fees ?? null,
              hideBelow: "sm",
              cell: (t) => <Money value={t.fees ?? null} currency="INR" digits={2} />,
            },
          ]}
        />
      )}
    </Panel>
  );
}
