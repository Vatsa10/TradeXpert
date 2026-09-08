"use client";

import { Search } from "lucide-react";

import { EmptyState, ErrorState, Panel, Skeleton, TextInput } from "@/components/system";
import { cn } from "@/lib/utils";

export interface Scheme {
  schemeCode: number;
  schemeName: string;
  fundHouse?: string;
  schemeType?: string;
  schemeCategory?: string;
}

export function SchemeSearch({
  query,
  setQuery,
  results,
  searching,
  searchError,
  hasSearched,
  selectedCode,
  onSelect,
}: {
  query: string;
  setQuery: (value: string) => void;
  results: Scheme[];
  searching: boolean;
  searchError: string | null;
  hasSearched: boolean;
  selectedCode: number | null;
  onSelect: (schemeCode: number) => void;
}) {
  return (
    <Panel flush padding="sm" as="aside">
      <div className="relative">
        <label htmlFor="mf-search" className="sr-only">
          Search mutual fund schemes
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint"
          aria-hidden
        />
        <TextInput
          id="mf-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search schemes (min 3 characters)…"
          className="pl-9"
        />
      </div>

      <div className="custom-scrollbar mt-3 max-h-[520px] min-h-[120px] overflow-y-auto">
        {searching ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : searchError ? (
          <ErrorState message={searchError} />
        ) : results.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {results.map((scheme) => (
              <li key={scheme.schemeCode}>
                <button
                  type="button"
                  onClick={() => onSelect(scheme.schemeCode)}
                  aria-pressed={selectedCode === scheme.schemeCode}
                  className={cn(
                    "app-press app-focus w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm",
                    "transition-colors duration-200",
                    selectedCode === scheme.schemeCode
                      ? "bg-surface-raised-2 text-ink"
                      : "text-ink-secondary [@media(hover:hover)]:hover:bg-white/[0.04] [@media(hover:hover)]:hover:text-ink"
                  )}
                >
                  <span className="line-clamp-2">{scheme.schemeName}</span>
                  <span className="tnum mt-0.5 block text-xs text-ink-faint">
                    #{scheme.schemeCode}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            className="border-0 py-10"
            description={
              hasSearched
                ? "No schemes matched that search."
                : "Type at least 3 characters to search."
            }
          />
        )}
      </div>
    </Panel>
  );
}
