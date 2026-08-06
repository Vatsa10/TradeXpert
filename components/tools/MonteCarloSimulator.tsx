"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ChartSeries, LineChart } from "./charts";
import {
  ErrorState,
  Panel,
  Skeleton,
  StatCard,
  formatCompactMoney,
  formatMoney,
  formatNum,
  formatPct,
} from "./shared";

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

interface FormState {
  startingCapital: number;
  winRate: number;
  rewardRiskRatio: number;
  riskPct: number;
  tradeCount: number;
  numSimulations: number;
  ruinThreshold: number;
}

const DEFAULTS: FormState = {
  startingCapital: 10000,
  winRate: 0.5,
  rewardRiskRatio: 2,
  riskPct: 0.01,
  tradeCount: 100,
  numSimulations: 1000,
  ruinThreshold: 0.5,
};

/** Labelled range input — the repo has no slider primitive, so this is native. */
function Slider({
  id,
  label,
  display,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  display: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <Label htmlFor={id} className="text-sm font-medium text-gray-400">
          {label}
        </Label>
        <span className="text-sm font-semibold tabular-nums text-yellow-500">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-yellow-500"
      />
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  prefix,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-400">
        {label}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-500">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`form-input ${prefix ? "pl-7" : ""}`}
        />
      </div>
    </div>
  );
}

/** Pointwise median across the returned sample paths, for a readable centre line. */
function medianCurve(curves: number[][]): number[] {
  if (curves.length === 0) return [];
  const length = curves.reduce((min, c) => Math.min(min, c.length), Infinity);
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    const column = curves.map((c) => c[i]).sort((a, b) => a - b);
    const mid = Math.floor(column.length / 2);
    out.push(
      column.length % 2 === 0 ? (column[mid - 1] + column[mid]) / 2 : column[mid]
    );
  }
  return out;
}

export default function MonteCarloSimulator() {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [data, setData] = useState<MonteCarloResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const run = useCallback(async (params: FormState, notify: boolean) => {
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
    run(DEFAULTS, false);
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
      color: "#52525b",
      muted: true,
    })),
    ...(median.length ? [{ name: "Median path", values: median, color: "#eab308" }] : []),
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
        <div className="space-y-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <NumberField
              id="mc-capital"
              label="Starting capital"
              value={form.startingCapital}
              min={1}
              max={100_000_000}
              step={500}
              prefix="$"
              onChange={(v) => set("startingCapital", v)}
            />
            <NumberField
              id="mc-rr"
              label="Reward : risk"
              value={form.rewardRiskRatio}
              min={0.1}
              max={20}
              step={0.1}
              onChange={(v) => set("rewardRiskRatio", v)}
            />
            <NumberField
              id="mc-trades"
              label="Trades per path"
              value={form.tradeCount}
              min={1}
              max={2000}
              onChange={(v) => set("tradeCount", v)}
            />
            <NumberField
              id="mc-sims"
              label="Simulations"
              value={form.numSimulations}
              min={1}
              max={5000}
              step={100}
              onChange={(v) => set("numSimulations", v)}
            />
          </div>

          <Slider
            id="mc-winrate"
            label="Win rate"
            display={formatPct(form.winRate, 0)}
            value={form.winRate * 100}
            min={0}
            max={100}
            step={1}
            onChange={(v) => set("winRate", v / 100)}
          />
          <Slider
            id="mc-risk"
            label="Risk per trade"
            display={formatPct(form.riskPct, 2)}
            value={form.riskPct * 100}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(v) => set("riskPct", v / 100)}
          />
          <Slider
            id="mc-ruin"
            label="Ruin threshold"
            display={`${formatPct(form.ruinThreshold, 0)} of capital`}
            value={form.ruinThreshold * 100}
            min={5}
            max={95}
            step={5}
            onChange={(v) => set("ruinThreshold", v / 100)}
          />

          <div className="rounded-lg border border-zinc-800 bg-[#1A1A1A] px-3 py-2.5 text-sm">
            <span className="text-gray-500">Expectancy per trade</span>
            <span
              className={`ml-2 font-semibold tabular-nums ${
                expectancy > 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {expectancy >= 0 ? "+" : ""}
              {formatNum(expectancy)}R
            </span>
          </div>

          <Button
            onClick={() => run(form, true)}
            disabled={loading || invalid}
            className="yellow-btn !h-12 w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run simulation
          </Button>
        </div>

        <div className="space-y-5 lg:col-span-3">
          {error && <ErrorState message={error} onRetry={() => run(form, true)} />}

          {loading && !data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[86px]" />
                ))}
              </div>
              <Skeleton className="h-[280px]" />
            </div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                <StatCard
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
                  label="5th – 95th pct"
                  value={`${formatCompactMoney(data.finalCapitalStats.p5)} – ${formatCompactMoney(
                    data.finalCapitalStats.p95
                  )}`}
                  hint="90% of outcomes land here"
                />
                <StatCard
                  label="Profitable paths"
                  value={formatPct(data.winProbability, 1)}
                  tone={data.winProbability >= 0.5 ? "positive" : "negative"}
                  hint="Ended above starting capital"
                />
                <StatCard
                  label="Avg max drawdown"
                  value={formatPct(data.maxDrawdownStats.mean, 1)}
                  tone="negative"
                />
                <StatCard
                  label="Worst drawdown"
                  value={formatPct(data.maxDrawdownStats.worst, 1)}
                  tone="negative"
                  hint={`Range ${formatCompactMoney(
                    data.finalCapitalStats.min
                  )} – ${formatCompactMoney(data.finalCapitalStats.max)}`}
                />
                <StatCard
                  label="Risk of ruin"
                  value={formatPct(data.ruinProbability, 1)}
                  tone={data.ruinProbability > 0.05 ? "negative" : "positive"}
                  hint={`Equity hit ${formatPct(data.ruinThreshold, 0)} of start`}
                />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-300">
                  Sample equity curves
                  <span className="ml-2 font-normal text-gray-500">
                    {curves.length} of {form.numSimulations.toLocaleString()} paths
                  </span>
                </h3>
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
