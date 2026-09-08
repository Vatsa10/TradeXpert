"use client";

import { ChevronRight, Search } from "lucide-react";

import { ActionButton } from "@/components/app/ActionButton";
import { Surface } from "@/components/system";
import { cn } from "@/lib/utils";

import type { AnalysisMode, AnalysisStatus } from "./useAnalysisRun";

const POPULAR = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL"];

interface Suggestion {
  symbol: string;
  name?: string;
}

function SymbolField({
  id,
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  disabled,
  suggestions,
  onPick,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  suggestions: Suggestion[];
  onPick: (symbol: string) => void;
}) {
  return (
    <div className="relative w-full flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex w-full items-center gap-3 rounded-md border border-hairline-strong bg-surface-sunken px-3 transition-colors duration-200 focus-within:border-brand/50">
        <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value) {
              e.preventDefault();
              onSubmit();
            }
          }}
          className="w-full flex-1 border-none bg-transparent py-3 text-sm font-medium text-ink placeholder:text-ink-faint focus:outline-none"
          disabled={disabled}
          required
        />
      </div>

      {suggestions.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="app-shadow-3 custom-scrollbar absolute top-full right-0 left-0 z-50 mt-1 max-h-[300px] overflow-y-auto rounded-xl border border-hairline bg-surface-overlay py-1"
        >
          {suggestions.map((s, idx) => (
            <li key={`${s.symbol}-${idx}`} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => onPick(s.symbol)}
                className="app-press app-focus group flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left [@media(hover:hover)]:hover:bg-white/[0.04]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="text-sm font-semibold tracking-widest text-brand">
                    {s.symbol}
                  </span>
                  <span className="truncate text-xs font-medium text-ink-secondary">
                    {s.name}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-ink-faint" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AnalysisSearchBar({
  mode,
  setMode,
  status,
  loading,
  symbol,
  setSymbol,
  symbolB,
  setSymbolB,
  suggestionsA,
  suggestionsB,
  onPick,
  onSubmit,
}: {
  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;
  status: AnalysisStatus;
  loading: boolean;
  symbol: string;
  setSymbol: (value: string) => void;
  symbolB: string;
  setSymbolB: (value: string) => void;
  suggestionsA: Suggestion[];
  suggestionsB: Suggestion[];
  onPick: (which: "a" | "b", value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const submit = () => onSubmit({ preventDefault: () => {} } as React.FormEvent);

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Analysis mode" className="flex items-center gap-4 border-b border-hairline">
        {(["single", "compare"] as const).map((value) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "app-press app-focus relative cursor-pointer pb-3 text-sm font-medium tracking-wider uppercase",
              "transition-colors duration-200",
              mode === value ? "text-ink" : "text-ink-faint [@media(hover:hover)]:hover:text-ink-secondary"
            )}
          >
            {value === "single" ? "Single Analysis" : "Comparative"}
            {mode === value && (
              <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-brand" aria-hidden />
            )}
          </button>
        ))}
      </div>

      <Surface level="raised" padding="sm">
        <form onSubmit={onSubmit} className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
          <div className="flex w-full flex-1 flex-col items-stretch gap-2 md:flex-row md:items-center">
            <SymbolField
              id="analysis-symbol-a"
              label={mode === "single" ? "Stock ticker" : "First ticker"}
              placeholder={mode === "single" ? "Enter ticker (AAPL, TSLA, NVDA...)" : "Ticker 1"}
              value={symbol}
              onChange={setSymbol}
              onSubmit={submit}
              disabled={loading}
              suggestions={suggestionsA}
              onPick={(value) => onPick("a", value)}
            />

            {mode === "compare" && (
              <>
                <span className="app-label px-1 text-center">vs</span>
                <SymbolField
                  id="analysis-symbol-b"
                  label="Second ticker"
                  placeholder="Ticker 2"
                  value={symbolB}
                  onChange={setSymbolB}
                  onSubmit={submit}
                  disabled={loading}
                  suggestions={suggestionsB}
                  onPick={(value) => onPick("b", value)}
                />
              </>
            )}
          </div>

          <ActionButton
            type="submit"
            variant="brand"
            loading={loading}
            disabled={!symbol || (mode === "compare" && !symbolB)}
            className="h-11 w-full px-8 md:w-auto"
          >
            Analyze
          </ActionButton>
        </form>

        {!loading && status === "idle" && (
          <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
            <span className="text-xs text-ink-faint">Popular:</span>
            {POPULAR.map((ticker) => (
              <ActionButton
                key={ticker}
                size="sm"
                onClick={() => onPick("a", ticker)}
                className="px-2.5"
              >
                {ticker}
              </ActionButton>
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}
