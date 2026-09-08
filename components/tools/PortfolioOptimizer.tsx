"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { ActionButton } from "@/components/app/ActionButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CHART_COLORS,
  EmptyState,
  ErrorState,
  LineChart,
  Panel,
  SectionHeader,
  Skeleton,
  StatGrid,
  type ChartSeries,
} from "@/components/system";
import { AllocationBreakdown } from "@/components/tools/portfolio/AllocationBreakdown";
import { CorrelationMatrix } from "@/components/tools/portfolio/CorrelationMatrix";
import { RiskMetrics, type PortfolioMetrics } from "@/components/tools/portfolio/RiskMetrics";
import { MAX_SYMBOLS, SymbolPicker } from "@/components/tools/portfolio/SymbolPicker";
import { cn } from "@/lib/utils";

const METHODS = [
  { value: "hrp", label: "Hierarchical Risk Parity" },
  { value: "inverse_vol", label: "Inverse Volatility" },
  { value: "mean_variance", label: "Mean-Variance" },
] as const;

type Method = (typeof METHODS)[number]["value"];

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

/** Brand amber for the portfolio line — the single accent in the app. */
const PORTFOLIO_COLOR = "#E8BA40";

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
          color: PORTFOLIO_COLOR,
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
        <SymbolPicker
          symbols={symbols}
          draft={draft}
          setDraft={setDraft}
          onAdd={addSymbols}
          onRemove={(symbol) => setSymbols((prev) => prev.filter((s) => s !== symbol))}
        />

        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <Select value={method} onValueChange={(value) => setMethod(value as Method)}>
            <SelectTrigger
              className="!h-12 w-full border-hairline-strong bg-surface-sunken text-ink sm:w-[230px]"
              aria-label="Optimization method"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-hairline bg-surface-overlay text-ink">
              {METHODS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ActionButton
            variant="brand"
            onClick={() => run(symbols, method, true)}
            disabled={!canRun}
            loading={loading}
            className="!h-12 px-6 sm:w-auto"
          >
            {!loading && <RefreshCw aria-hidden />}
            Optimize
          </ActionButton>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {error && <ErrorState message={error} onRetry={() => run(symbols, method, true)} />}

        {loading && !data && (
          <div className="space-y-4" aria-busy="true">
            <StatGrid columns={6}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[86px]" />
              ))}
            </StatGrid>
            <Skeleton className="h-[300px]" />
          </div>
        )}

        {!loading && !error && !data && (
          <EmptyState
            title="Nothing to optimize yet"
            description="Add at least two symbols above — or build a watchlist — then run the optimizer."
          />
        )}

        {data && (
          <>
            {metrics && <RiskMetrics metrics={metrics} />}

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <AllocationBreakdown rows={weightRows} />
              </div>

              <div className="lg:col-span-3">
                <SectionHeader
                  as="h3"
                  title="Growth of $1"
                  className="mb-3"
                  action={
                    <button
                      type="button"
                      onClick={() => setShowAssets((prev) => !prev)}
                      aria-pressed={showAssets}
                      className={cn(
                        "app-press app-focus cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium",
                        "transition-colors duration-200",
                        showAssets
                          ? "border-brand/40 bg-brand/10 text-brand"
                          : "border-hairline-strong text-ink-secondary [@media(hover:hover)]:hover:text-ink"
                      )}
                    >
                      <Plus className="mr-1 inline size-3" aria-hidden />
                      Individual assets
                    </button>
                  }
                />
                <LineChart
                  series={chartSeries}
                  labels={data.dates}
                  height={280}
                  yFormat={(v) => v.toFixed(2)}
                  xFormat={formatDate}
                />
              </div>
            </div>

            <CorrelationMatrix symbols={data.symbols ?? []} matrix={data.correlationMatrix} />
          </>
        )}
      </div>
    </Panel>
  );
}
