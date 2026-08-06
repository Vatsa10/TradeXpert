"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn, formatMarketCapValue, formatPrice, getChangeColorClass } from "@/lib/utils";

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

function formatVolume(volume: number): string {
  if (!Number.isFinite(volume) || volume <= 0) return "—";
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
  return volume.toLocaleString("en-US");
}

function formatChange(changePercent: number): string {
  if (!Number.isFinite(changePercent)) return "—";
  const sign = changePercent > 0 ? "+" : "";
  return `${sign}${changePercent.toFixed(2)}%`;
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

  const load = useCallback(
    async (target: Screen, isBackground: boolean) => {
      const requestId = ++requestRef.current;

      if (isBackground) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await fetch(`/api/market/pulse?screen=${target}`, {
          cache: "no-store",
        });
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
    },
    []
  );

  useEffect(() => {
    load(screen, false);

    const interval = setInterval(() => load(screen, true), REFRESH_MS);
    return () => clearInterval(interval);
  }, [screen, load]);

  return (
    <section className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Market <span className="text-blue-500">Pulse</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-gray-400">
            What is moving right now — refreshed automatically every two minutes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-xs text-gray-500">
              Updated {updatedAt.toLocaleTimeString("en-US", { hour12: false })}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => load(screen, true)}
            disabled={loading || refreshing}
            className="border-[#27272A] bg-[#111111] text-gray-300 hover:bg-[#18181B] hover:text-white"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-[#27272A] bg-[#111111] p-1">
        {SCREENS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setScreen(value)}
            aria-pressed={screen === value}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              screen === value
                ? "bg-[#27272A] text-white"
                : "text-gray-400 hover:bg-[#18181B] hover:text-gray-200"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#111111]">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-sm text-gray-400">
            <Loader2 className="size-5 animate-spin text-blue-500" />
            Loading market movers…
          </div>
        ) : error && quotes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <p className="text-sm text-gray-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(screen, false)}
              className="border-[#27272A] bg-[#0A0A0A] text-gray-300 hover:bg-[#18181B] hover:text-white"
            >
              Try again
            </Button>
          </div>
        ) : quotes.length === 0 ? (
          <div className="px-6 py-20 text-center text-sm text-gray-400">
            No movers reported for this screen.
          </div>
        ) : (
          <>
            {error && (
              <p className="border-b border-[#27272A] px-4 py-2 text-xs text-yellow-500">
                {error}
              </p>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header-row">
                    <TableHead className="table-header">Symbol</TableHead>
                    <TableHead className="table-header">Name</TableHead>
                    <TableHead className="table-header text-right">Price</TableHead>
                    <TableHead className="table-header text-right">Change</TableHead>
                    <TableHead className="table-header text-right">Volume</TableHead>
                    <TableHead className="table-header text-right">Market Cap</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.symbol} className="table-row">
                      <TableCell className="table-cell pl-4 font-medium text-white">
                        <Link
                          href={`/stocks/${encodeURIComponent(quote.symbol)}`}
                          className="transition-colors hover:text-yellow-500"
                        >
                          {quote.symbol}
                        </Link>
                      </TableCell>

                      <TableCell className="table-cell max-w-[220px] truncate text-gray-300">
                        {quote.name}
                      </TableCell>

                      <TableCell className="table-cell text-right">
                        {formatPrice(quote.price)}
                      </TableCell>

                      <TableCell
                        className={cn(
                          "table-cell text-right font-medium",
                          getChangeColorClass(quote.changePercent)
                        )}
                      >
                        {formatChange(quote.changePercent)}
                      </TableCell>

                      <TableCell className="table-cell text-right">
                        {formatVolume(quote.volume)}
                      </TableCell>

                      <TableCell className="table-cell text-right">
                        {quote.marketCap ? formatMarketCapValue(quote.marketCap) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
