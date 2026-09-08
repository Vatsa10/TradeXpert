"use client";

import { X } from "lucide-react";

import { TextInput } from "@/components/system";

export const MAX_SYMBOLS = 10;

/**
 * Tag-style symbol entry. Enter or comma commits a token; backspace on an
 * empty field removes the last one.
 */
export function SymbolPicker({
  symbols,
  draft,
  setDraft,
  onAdd,
  onRemove,
}: {
  symbols: string[];
  draft: string;
  setDraft: (value: string) => void;
  onAdd: (raw: string) => void;
  onRemove: (symbol: string) => void;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      // Enter would submit; comma is a separator, not a character we want typed.
      event.preventDefault();
      if (draft.trim()) onAdd(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "") {
      onRemove(symbols[symbols.length - 1]);
    }
  };

  return (
    <div className="flex-1">
      <label htmlFor="portfolio-symbols" className="sr-only">
        Portfolio symbols
      </label>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-md border border-hairline-strong bg-surface-sunken px-2 py-2 transition-colors duration-200 focus-within:border-brand/50">
        {symbols.map((symbol) => (
          <span
            key={symbol}
            className="flex items-center gap-1 rounded-md bg-surface-raised-2 py-1 pr-1 pl-2.5 text-sm font-medium text-ink"
          >
            {symbol}
            <button
              type="button"
              aria-label={`Remove ${symbol}`}
              onClick={() => onRemove(symbol)}
              className="app-press app-focus cursor-pointer rounded p-0.5 text-ink-faint [@media(hover:hover)]:hover:text-ink"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ))}
        <TextInput
          id="portfolio-symbols"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft.trim() && onAdd(draft)}
          placeholder={symbols.length ? "Add symbol…" : "AAPL, MSFT, NVDA…"}
          className="h-8 min-w-[140px] flex-1 border-0 bg-transparent px-1 shadow-none"
        />
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">
        Press Enter to add. 2–{MAX_SYMBOLS} symbols. Leave empty to use your watchlist.
      </p>
    </div>
  );
}
