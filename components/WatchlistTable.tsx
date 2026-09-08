"use client";

import { useRouter } from "next/navigation";
import { StarIcon } from "lucide-react";

import { currencyForSymbol, toNum } from "@/components/market/symbol";
import {
  DataTable,
  Delta,
  EmptyState,
  Money,
  NumberValue,
  type Column,
} from "@/components/system";

import WatchlistButton from "./WatchlistButton";

/** Keeps a row action from also triggering the row's navigation. */
function stop(e: React.MouseEvent) {
  e.stopPropagation();
}

export function WatchlistTable({ watchlist }: WatchlistTableProps) {
  const router = useRouter();

  const columns: Column<StockWithData>[] = [
    {
      key: "company",
      header: "Company",
      width: "16rem",
      sortable: true,
      sortValue: (row) => row.company,
      cell: (row) => (
        <span className="block truncate font-medium text-ink">
          {row.company || row.symbol}
        </span>
      ),
    },
    {
      key: "symbol",
      header: "Symbol",
      width: "9rem",
      sortable: true,
      sortValue: (row) => row.symbol,
      cell: (row) => (
        <span className="tnum text-ink-secondary">{row.symbol}</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      numeric: true,
      sortable: true,
      sortValue: (row) => row.currentPrice ?? null,
      cell: (row) =>
        typeof row.currentPrice === "number" ? (
          <Money
            value={row.currentPrice}
            currency={currencyForSymbol(row.symbol)}
          />
        ) : (
          <span className="text-ink-faint">{row.priceFormatted || "—"}</span>
        ),
    },
    {
      key: "change",
      header: "Change",
      numeric: true,
      sortable: true,
      sortValue: (row) => row.changePercent ?? null,
      cell: (row) =>
        typeof row.changePercent === "number" ? (
          <Delta percent={row.changePercent} arrow size="sm" />
        ) : (
          <span className="text-ink-faint">{row.changeFormatted || "—"}</span>
        ),
    },
    {
      key: "marketCap",
      header: "Market Cap",
      numeric: true,
      hideBelow: "md",
      sortable: true,
      sortValue: (row) => toNum(row.marketCap),
      cell: (row) => (
        <span className="tnum text-ink-secondary">{row.marketCap || "—"}</span>
      ),
    },
    {
      key: "peRatio",
      header: "P/E",
      numeric: true,
      hideBelow: "md",
      sortable: true,
      sortValue: (row) => toNum(row.peRatio),
      cell: (row) => (
        <NumberValue
          value={toNum(row.peRatio)}
          digits={1}
          unit="x"
          className="text-ink-secondary"
        />
      ),
    },
    {
      key: "alert",
      header: "Alert",
      hideBelow: "lg",
      cell: () => (
        <button
          type="button"
          onClick={stop}
          className="app-press app-focus whitespace-nowrap rounded-md border border-brand/30 px-2.5 py-1 text-xs font-medium text-brand"
        >
          Add Alert
        </button>
      ),
    },
    {
      key: "action",
      header: <span className="sr-only">Remove from watchlist</span>,
      align: "right",
      width: "4rem",
      cell: (row) => (
        <span onClick={stop} className="inline-flex">
          <WatchlistButton
            symbol={row.symbol}
            company={row.company}
            isInWatchlist={true}
            showTrashIcon={true}
            type="icon"
          />
        </span>
      ),
    },
  ];

  return (
    <DataTable
      caption="Watched stocks with last price, change, market cap and P/E"
      columns={columns}
      rows={watchlist}
      getRowKey={(row, i) => `${row.symbol}-${i}`}
      stickyFirstColumn
      stickyHeader
      onRowClick={(row) =>
        router.push(`/stocks/${encodeURIComponent(row.symbol)}`)
      }
      empty={
        <EmptyState
          icon={<StarIcon className="size-5" />}
          title="Your watchlist is empty"
          description="Search for a stock and tap the star to start tracking it here."
        />
      }
    />
  );
}

export default WatchlistTable;
