"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { CHART_COLORS, ChartSeries, DonutChart, LineChart } from "./charts";
import {
  EmptyState,
  ErrorState,
  Panel,
  Skeleton,
  StatCard,
  formatNum,
  formatPct,
} from "./shared";

const METHODS = [
  { value: "hrp", label: "Hierarchical Risk Parity" },
  { value: "inverse_vol", label: "Inverse Volatility" },
  { value: "mean_variance", label: "Mean-Variance" },
] as const;

type Method = (typeof METHODS)[number]["value"];

interface PortfolioMetrics {
  annualReturn: number;
  annualVolatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  var95: number;
  cvar95: number;
  skewness: number;
  kurtosis: number;
}

interface OptimizeResponse {
  weights: Record<string, number>;
  correlationMatrix: number[][];
  symbols: string[];
  method: Method;
  dates: string[];
  metrics: PortfolioMetrics | null;
  portfolioCumulative: number[];
  assetCumulative: Record<string, number[]>;
}

const MAX_SYMBOLS = 10;

/** Diverging fill: red for co-movement, teal for hedging, transparent near zero. */
function correlationFill(value: number) {
  if (!Number.isFinite(value)) return "transparent";
  const magnitude = Math.min(1, Math.abs(value)) * 0.6;
  return value >= 0
    ? `rgba(239, 68, 68, ${magnitude})`
    : `rgba(45, 212, 191, ${magnitude})`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

export default function PortfolioOptimizer() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [method, setMethod] = useState<Method>("hrp");

  const [data, setData] = useState<OptimizeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssets, setShowAssets] = useState(false);

  // Guards against a slow first response overwriting a newer manual run.
  const requestId = useRef(0);

  const run = useCallback(
    async (nextSymbols: string[], nextMethod: Method, notify: boolean) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/portfolio/optimize?method=${nextMethod}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: nextSymbols }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to optimize portfolio");
        }

        if (id !== requestId.current) return;

        const result = payload as OptimizeResponse;
        setData(result);
        // Reflect the symbols the server actually used (watchlist fallback,
        // or the subset that had enough price history).
        if (result.symbols?.length) setSymbols(result.symbols);
        if (notify) toast.success(`Optimized ${result.symbols?.length ?? 0} holdings`);
      } catch (err) {
        if (id !== requestId.current) return;
        const message = err instanceof Error ? err.message : "Failed to optimize portfolio";
        setError(message);
        setData(null);
        if (notify) toast.error(message);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    []
  );

  // Prefill from the user's watchlist: an empty symbol list makes the API fall
  // back to it. Silent on failure — the empty state explains what to do next.
  useEffect(() => {
    run([], "hrp", false);
  }, [run]);

  const addSymbols = (raw: string) => {
    const parsed = raw
      .split(/[\s,]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (parsed.length === 0) return;

    setSymbols((prev) => {
      const next = [...prev];
      for (const symbol of parsed) {
        if (next.length >= MAX_SYMBOLS) {
          toast.error(`Up to ${MAX_SYMBOLS} symbols can be optimized at once`);
          break;
        }
        if (!next.includes(symbol)) next.push(symbol);
      }
      return next;
    });
    setDraft("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      // Enter would submit; comma is a separator, not a character we want typed.
      event.preventDefault();
      if (draft.trim()) addSymbols(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "") {
      setSymbols((prev) => prev.slice(0, -1));
    }
  };

  const canRun = symbols.length >= 2 && !loading;

  const weightRows = data
    ? [...(data.symbols ?? [])]
        .map((symbol, index) => ({
          symbol,
          weight: data.weights?.[symbol] ?? 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
        }))
        .sort((a, b) => b.weight - a.weight)
    : [];

  const chartSeries: ChartSeries[] = data
    ? [
        ...(showAssets
          ? (data.symbols ?? []).map((symbol, index) => ({
              name: symbol,
              values: data.assetCumulative?.[symbol] ?? [],
              color: CHART_COLORS[index % CHART_COLORS.length],
              muted: true,
            }))
          : []),
        {
          name: "Portfolio",
          values: data.portfolioCumulative ?? [],
          color: "#eab308",
        },
      ]
    : [];

  const metrics = data?.metrics;

  return (
    <Panel
      title="Portfolio Optimizer"
      description="Allocate weights across your holdings and stress-test the resulting risk profile."
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="flex-1">
          <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-2 py-2 focus-within:border-yellow-500">
            {symbols.map((symbol) => (
              <span
                key={symbol}
                className="flex items-center gap-1 rounded-md bg-zinc-700 py-1 pr-1 pl-2.5 text-sm font-medium text-gray-100"
              >
                {symbol}
                <button
                  type="button"
                  aria-label={`Remove ${symbol}`}
                  onClick={() => setSymbols((prev) => prev.filter((s) => s !== symbol))}
                  className="cursor-pointer rounded p-0.5 text-gray-400 hover:bg-zinc-600 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => draft.trim() && addSymbols(draft)}
              placeholder={symbols.length ? "Add symbol…" : "AAPL, MSFT, NVDA…"}
              aria-label="Add portfolio symbols"
              className="h-8 min-w-[140px] flex-1 border-0 bg-transparent px-1 text-base text-white shadow-none placeholder:text-gray-500 focus-visible:ring-0"
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            Press Enter to add. 2–{MAX_SYMBOLS} symbols. Leave empty to use your watchlist.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <Select value={method} onValueChange={(value) => setMethod(value as Method)}>
            <SelectTrigger
              className="!h-12 w-full border-gray-600 bg-gray-800 text-gray-200 sm:w-[230px]"
              aria-label="Optimization method"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-gray-600 bg-gray-800 text-gray-200">
              {METHODS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="select-item">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => run(symbols, method, true)}
            disabled={!canRun}
            className="yellow-btn !h-12 px-6 sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Optimize
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {error && (
          <ErrorState message={error} onRetry={() => run(symbols, method, true)} />
        )}

        {loading && !data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[86px]" />
              ))}
            </div>
            <Skeleton className="h-[300px]" />
          </div>
        )}

        {!loading && !error && !data && (
          <EmptyState>
            Add at least two symbols above — or build a watchlist — then run the optimizer.
          </EmptyState>
        )}

        {data && (
          <>
            {metrics && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard
                  label="Sharpe"
                  value={formatNum(metrics.sharpeRatio)}
                  tone={metrics.sharpeRatio >= 1 ? "positive" : "neutral"}
                  hint="Return per unit of risk"
                />
                <StatCard
                  label="Sortino"
                  value={formatNum(metrics.sortinoRatio)}
                  tone={metrics.sortinoRatio >= 1 ? "positive" : "neutral"}
                  hint="Downside-adjusted"
                />
                <StatCard
                  label="Calmar"
                  value={formatNum(metrics.calmarRatio)}
                  hint="Return vs. max drawdown"
                />
                <StatCard
                  label="Max Drawdown"
                  value={formatPct(metrics.maxDrawdown)}
                  tone="negative"
                  hint="Worst peak-to-trough"
                />
                <StatCard
                  label="VaR 95%"
                  value={formatPct(metrics.var95)}
                  tone="negative"
                  hint="Daily loss, 1-in-20"
                />
                <StatCard
                  label="CVaR 95%"
                  value={formatPct(metrics.cvar95)}
                  tone="negative"
                  hint="Avg loss beyond VaR"
                />
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <h3 className="mb-3 text-sm font-semibold text-gray-300">Allocation</h3>
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                  <DonutChart
                    size={180}
                    slices={weightRows.map((row) => ({
                      label: `${row.symbol} · ${formatPct(row.weight, 1)}`,
                      value: row.weight,
                      color: row.color,
                    }))}
                  />
                  <div className="w-full space-y-2">
                    {weightRows.map((row) => (
                      <div key={row.symbol} className="text-sm">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 font-medium text-gray-200">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: row.color }}
                            />
                            {row.symbol}
                          </span>
                          <span className="tabular-nums text-gray-400">
                            {formatPct(row.weight, 1)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(0, Math.min(1, row.weight)) * 100}%`,
                              backgroundColor: row.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-gray-300">Growth of $1</h3>
                  <button
                    type="button"
                    onClick={() => setShowAssets((prev) => !prev)}
                    className={cn(
                      "cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      showAssets
                        ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-500"
                        : "border-zinc-700 text-gray-400 hover:text-gray-200"
                    )}
                  >
                    <Plus className="mr-1 inline h-3 w-3" />
                    Individual assets
                  </button>
                </div>
                <LineChart
                  series={chartSeries}
                  labels={data.dates}
                  height={280}
                  yFormat={(v) => v.toFixed(2)}
                  xFormat={formatDate}
                />
              </div>
            </div>

            {data.correlationMatrix?.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-300">
                  Correlation Matrix
                  <span className="ml-2 font-normal text-gray-500">
                    red = moves together, teal = hedges
                  </span>
                </h3>
                <div className="horizontal-scroll overflow-x-auto">
                  <table className="w-full min-w-[420px] border-separate border-spacing-0.5 text-xs">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 bg-[#111111] px-2 py-1.5 text-left font-medium text-gray-500" />
                        {data.symbols.map((symbol) => (
                          <th
                            key={symbol}
                            className="px-2 py-1.5 text-center font-medium text-gray-400"
                          >
                            {symbol}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.correlationMatrix.map((row, i) => (
                        <tr key={data.symbols[i] ?? i}>
                          <th className="sticky left-0 z-10 bg-[#111111] px-2 py-1.5 text-left font-medium text-gray-400 whitespace-nowrap">
                            {data.symbols[i]}
                          </th>
                          {row.map((value, j) => (
                            <td
                              key={j}
                              className="rounded px-2 py-1.5 text-center tabular-nums text-gray-200"
                              style={{ backgroundColor: correlationFill(value) }}
                              title={`${data.symbols[i]} / ${data.symbols[j]}: ${formatNum(value)}`}
                            >
                              {formatNum(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
