"use client";

import { Play } from "lucide-react";

import { ActionButton } from "@/components/app/ActionButton";
import { FormField, Surface, TextInput, formatNum, formatPct } from "@/components/system";
import { cn } from "@/lib/utils";

export interface MonteCarloForm {
  startingCapital: number;
  winRate: number;
  rewardRiskRatio: number;
  riskPct: number;
  tradeCount: number;
  numSimulations: number;
  ruinThreshold: number;
}

export const MONTE_CARLO_DEFAULTS: MonteCarloForm = {
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
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-ink-secondary">
          {label}
        </label>
        <span className="tnum text-sm font-semibold text-brand">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="app-focus h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-sunken accent-[var(--app-brand)]"
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
    <FormField id={id} label={label}>
      {(props) => (
        <div className="relative">
          {prefix && (
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-faint">
              {prefix}
            </span>
          )}
          <TextInput
            {...props}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={Number.isFinite(value) ? value : ""}
            onChange={(event) => onChange(Number(event.target.value))}
            className={cn(prefix && "pl-7")}
          />
        </div>
      )}
    </FormField>
  );
}

export function MonteCarloControls({
  form,
  set,
  onRun,
  loading,
  invalid,
  expectancy,
}: {
  form: MonteCarloForm;
  set: <K extends keyof MonteCarloForm>(key: K, value: MonteCarloForm[K]) => void;
  onRun: () => void;
  loading: boolean;
  invalid: boolean;
  expectancy: number;
}) {
  return (
    <div className="space-y-5">
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

      <Surface level="raised-2" radius="tile" padding="none" className="px-3 py-2.5 text-sm">
        <span className="text-ink-secondary">Expectancy per trade</span>
        <span
          className={cn(
            "tnum ml-2 font-semibold",
            expectancy > 0 ? "text-up" : "text-down"
          )}
        >
          {expectancy >= 0 ? "+" : ""}
          {formatNum(expectancy)}R
        </span>
      </Surface>

      <ActionButton
        variant="brand"
        onClick={onRun}
        disabled={invalid}
        loading={loading}
        className="!h-12 w-full"
      >
        {!loading && <Play aria-hidden />}
        Run simulation
      </ActionButton>
    </div>
  );
}
