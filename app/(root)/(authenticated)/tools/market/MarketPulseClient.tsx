"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { ActionButton } from "@/components/app/ActionButton";
import {
  DataTable,
  EmptyState,
  ErrorState,
  InlineNotice,
  PageShell,
  Panel,
  Percent,
  Skeleton,
  formatCompactNum,
} from "@/components/system";
import { cn, formatMarketCapValue, formatPrice } from "@/lib/utils";

const REFRESH_MS = 2 * 60 * 1000;

const SCREENS = [
  { value: "most_actives", label: "Most Active", icon: Activity },
  { value: "day_gainers", label: "Top Gainers", icon: TrendingUp },
  { value: "day_losers", label: "Top Losers", icon: TrendingDown },
] as const;

type Screen = (typeof SCREENS)[number]["value"];

interface PulseQuote {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap: number | null;
}

export default function MarketPulseClient() {
  const [screen, setScreen] = useState<Screen>("most_actives");
  const [quotes, setQuotes] = useState<PulseQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Guards against a slow response for a previously-selected tab landing after
  // the user has already switched tabs and overwriting the newer data.
  const requestRef = useRef(0);

  const load = useCallback(async (target: Screen, isBackground: boolean) => {
    const requestId = ++requestRef.current;

    if (isBackground) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/market/pulse?screen=${target}`, { cache: "no-store" });
      const json = await res.json();

      if (requestId !== requestRef.current) return;

      if (!res.ok) throw new Error(json?.error || "Failed to load market pulse");

      setQuotes(Array.isArray(json.quotes) ? json.quotes : []);
      setUpdatedAt(new Date());

      // The route reports `available: false` when the upstream screener is
      // down, which is not the same as "no movers today". Say which it is.
      setError(
        json.available === false
          ? "Market data source is unavailable right now. Try again shortly."
          : null
      );
    } catch (err) {
      if (requestId !== requestRef.current) return;

      const message = err instanceof Error ? err.message : "Failed to load market pulse";
      setError(message);
      if (!isBackground) setQuotes([]);
      toast.error(message);
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    load(screen, false);

    const interval = setInterval(() => load(screen, true), REFRESH_MS);
    return () => clearInterval(interval);
  }, [screen, load]);

  return (
    <PageShell
      width="wide"
      eyebrow="Tools"
      title="Market Pulse"
      description="What is moving right now — refreshed automatically every two minutes."
      actions={
        <>
          {updatedAt && (
            <span className="tnum text-xs text-ink-faint">
              Updated {updatedAt.toLocaleTimeString("en-US", { hour12: false })}
            </span>
          )}
          <ActionButton
            size="sm"
            onClick={() => load(screen, true)}
            disabled={loading || refreshing}
          >
            <RefreshCw className={cn(refreshing && "motion-safe:animate-spin")} aria-hidden />
            Refresh
          </ActionButton>
        </>
      }
    >
      <div
        role="tablist"
        aria-label="Market screen"
        className="flex flex-wrap gap-2 rounded-xl border border-hairline bg-surface-raised p-1"
      >
        {SCREENS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            onClick={() => setScreen(value)}
            aria-selected={screen === value}
            className={cn(
              "app-press app-focus flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2",
              "text-sm font-medium transition-colors duration-200",
              screen === value
                ? "bg-surface-raised-2 text-ink"
                : "text-ink-secondary [@media(hover:hover)]:hover:text-ink"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <Panel flush padding="none">
        {loading ? (
          <div className="space-y-2 p-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : error && quotes.length === 0 ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={() => load(screen, false)} />
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 pb-0">
                <InlineNotice tone="warn">{error}</InlineNotice>
              </div>
            )}

            <DataTable
              rows={quotes}
              getRowKey={(quote) => quote.symbol}
              stickyFirstColumn
              stickyHeader
              caption="Market movers"
              empty={
                <div className="p-4">
                  <EmptyState title="No movers reported for this screen." />
                </div>
              }
              columns={[
                {
                  key: "symbol",
                  header: "Symbol",
                  sortable: true,
                  sortValue: (q) => q.symbol,
                  cell: (q) => (
                    <Link
                      href={`/stocks/${encodeURIComponent(q.symbol)}`}
                      className="app-focus font-medium text-ink transition-colors duration-200 [@media(hover:hover)]:hover:text-brand"
                    >
                      {q.symbol}
                    </Link>
                  ),
                },
                {
                  key: "name",
                  header: "Name",
                  hideBelow: "md",
                  cell: (q) => (
                    <span className="block max-w-[220px] truncate text-ink-secondary">
                      {q.name}
                    </span>
                  ),
                },
                {
                  key: "price",
                  header: "Price",
                  numeric: true,
                  sortable: true,
                  sortValue: (q) => q.price,
                  cell: (q) => formatPrice(q.price),
                },
                {
                  key: "change",
                  header: "Change",
                  numeric: true,
                  sortable: true,
                  sortValue: (q) => q.changePercent,
                  cell: (q) => <Percent value={q.changePercent} colored signed />,
                },
                {
                  key: "volume",
                  header: "Volume",
                  numeric: true,
                  sortable: true,
                  sortValue: (q) => q.volume,
                  hideBelow: "sm",
                  cell: (q) => formatCompactNum(q.volume, 2),
                },
                {
                  key: "marketCap",
                  header: "Market Cap",
                  numeric: true,
                  sortable: true,
                  sortValue: (q) => q.marketCap,
                  hideBelow: "sm",
                  cell: (q) => (q.marketCap ? formatMarketCapValue(q.marketCap) : "—"),
                },
              ]}
            />
          </>
        )}
      </Panel>
    </PageShell>
  );
}
