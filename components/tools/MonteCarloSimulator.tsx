"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  ErrorState,
  LineChart,
  Panel,
  SectionHeader,
  Skeleton,
  StatCard,
  StatGrid,
  formatCompactMoney,
  formatMoney,
  formatPct,
  type ChartSeries,
} from "@/components/system";
import {
  MONTE_CARLO_DEFAULTS,
  MonteCarloControls,
  type MonteCarloForm,
} from "@/components/tools/portfolio/MonteCarloControls";

interface MonteCarloResponse {
  finalCapitalStats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    p5: number;
    p95: number;
  };
  maxDrawdownStats: { mean: number; worst: number };
  winProbability: number;
  ruinProbability: number;
  ruinThreshold: number;
  sampleEquityCurves: number[][];
}

/** Muted grey for the sample paths, brand amber for the median. */
const PATH_COLOR = "#52525b";
const MEDIAN_COLOR = "#E8BA40";

/** Pointwise median across the returned sample paths, for a readable centre line. */
function medianCurve(curves: number[][]): number[] {
  if (curves.length === 0) return [];
  const length = curves.reduce((min, c) => Math.min(min, c.length), Infinity);
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    const column = curves.map((c) => c[i]).sort((a, b) => a - b);
    const mid = Math.floor(column.length / 2);
    out.push(column.length % 2 === 0 ? (column[mid - 1] + column[mid]) / 2 : column[mid]);
  }
  return out;
}

export default function MonteCarloSimulator() {
  const [form, setForm] = useState<MonteCarloForm>(MONTE_CARLO_DEFAULTS);
  const [data, setData] = useState<MonteCarloResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);
  const set = <K extends keyof MonteCarloForm>(key: K, value: MonteCarloForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const run = useCallback(async (params: MonteCarloForm, notify: boolean) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio/monte-carlo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Simulation failed");
      if (id !== requestId.current) return;

      setData(payload as MonteCarloResponse);
      if (notify) toast.success("Simulation complete");
    } catch (err) {
      if (id !== requestId.current) return;
      const message = err instanceof Error ? err.message : "Simulation failed";
      setError(message);
      setData(null);
      if (notify) toast.error(message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    run(MONTE_CARLO_DEFAULTS, false);
  }, [run]);

  const invalid =
    !Number.isFinite(form.startingCapital) ||
    form.startingCapital < 1 ||
    !Number.isFinite(form.rewardRiskRatio) ||
    form.rewardRiskRatio <= 0 ||
    !Number.isFinite(form.tradeCount) ||
    form.tradeCount < 1;

  const curves = data?.sampleEquityCurves ?? [];
  const median = medianCurve(curves);

  const series: ChartSeries[] = [
    ...curves.map((values, index) => ({
      name: `Path ${index + 1}`,
      values,
      color: PATH_COLOR,
      muted: true,
    })),
    ...(median.length ? [{ name: "Median path", values: median, color: MEDIAN_COLOR }] : []),
  ];

  const tradeLabels = median.map((_, i) => `Trade ${i}`);

  // Expectancy in R per trade — negative means the edge itself is unprofitable.
  const expectancy = form.winRate * form.rewardRiskRatio - (1 - form.winRate);

  return (
    <Panel
      title="Monte Carlo Simulator"
      description="Project thousands of trade sequences from your edge to see the range of outcomes."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <MonteCarloControls
            form={form}
            set={set}
            onRun={() => run(form, true)}
            loading={loading}
            invalid={invalid}
            expectancy={expectancy}
          />
        </div>

        <div className="space-y-5 lg:col-span-3">
          {error && <ErrorState message={error} onRetry={() => run(form, true)} />}

          {loading && !data && (
            <div className="space-y-4" aria-busy="true">
              <StatGrid columns={3}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[86px]" />
                ))}
              </StatGrid>
              <Skeleton className="h-[280px]" />
            </div>
          )}

          {data && (
            <>
              <StatGrid columns={3}>
                <StatCard
                  index={0}
                  label="Median final"
                  value={formatMoney(data.finalCapitalStats.median)}
                  tone={
                    data.finalCapitalStats.median >= form.startingCapital
                      ? "positive"
                      : "negative"
                  }
                  hint={`Mean ${formatMoney(data.finalCapitalStats.mean)}`}
                />
                <StatCard
                  index={1}
                  label="5th – 95th pct"
                  value={`${formatCompactMoney(data.finalCapitalStats.p5)} – ${formatCompactMoney(
                    data.finalCapitalStats.p95
                  )}`}
                  hint="90% of outcomes land here"
                />
                <StatCard
                  index={2}
                  label="Profitable paths"
                  value={formatPct(data.winProbability, 1)}
                  tone={data.winProbability >= 0.5 ? "positive" : "negative"}
                  hint="Ended above starting capital"
                />
                <StatCard
                  index={3}
                  label="Avg max drawdown"
                  value={formatPct(data.maxDrawdownStats.mean, 1)}
                  tone="negative"
                />
                <StatCard
                  index={4}
                  label="Worst drawdown"
                  value={formatPct(data.maxDrawdownStats.worst, 1)}
                  tone="negative"
                  hint={`Range ${formatCompactMoney(
                    data.finalCapitalStats.min
                  )} – ${formatCompactMoney(data.finalCapitalStats.max)}`}
                />
                <StatCard
                  index={5}
                  label="Risk of ruin"
                  value={formatPct(data.ruinProbability, 1)}
                  tone={data.ruinProbability > 0.05 ? "negative" : "positive"}
                  hint={`Equity hit ${formatPct(data.ruinThreshold, 0)} of start`}
                />
              </StatGrid>

              <div>
                <SectionHeader
                  as="h3"
                  title="Sample equity curves"
                  description={`${curves.length} of ${form.numSimulations.toLocaleString()} paths`}
                  className="mb-3"
                />
                <LineChart
                  series={series}
                  labels={tradeLabels}
                  height={280}
                  showLegend={false}
                  yFormat={formatCompactMoney}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}
