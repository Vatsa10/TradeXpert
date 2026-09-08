"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, PageShell, Panel, Skeleton } from "@/components/system";
import { SchemeOverview } from "@/components/tools/funds/SchemeOverview";
import { SchemeSearch, type Scheme } from "@/components/tools/funds/SchemeSearch";
import { SipCalculator, type SipResult } from "@/components/tools/funds/SipCalculator";

import { type NavPoint } from "./NavChart";

const SEARCH_DEBOUNCE_MS = 350;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

interface FundDetail {
  scheme: Scheme;
  latestNav: NavPoint | null;
  navHistoryCount: number;
  navHistory: NavPoint[];
  sip: SipResult | null;
}

// mfapi.in publishes dates as DD-MM-YYYY, which Date cannot parse directly.
function parseNavDate(date: string): number {
  const [day, month, year] = date.split("-").map(Number);
  if (!day || !month || !year) return NaN;
  return Date.UTC(year, month - 1, day);
}

// navHistory arrives newest-first; return the last ~1y oldest-first for plotting.
function lastYearChronological(history: NavPoint[]): NavPoint[] {
  const withTime = history
    .map((p) => ({ point: p, time: parseNavDate(p.date) }))
    .filter((p) => Number.isFinite(p.time))
    .sort((a, b) => a.time - b.time);

  if (withTime.length === 0) return [];

  const cutoff = withTime[withTime.length - 1].time - ONE_YEAR_MS;
  const windowed = withTime.filter((p) => p.time >= cutoff);

  // A scheme younger than a year still deserves a chart of everything it has.
  return (windowed.length > 1 ? windowed : withTime).map((p) => p.point);
}

export default function MutualFundsClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Scheme[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedCode, setSelectedCode] = useState<number | null>(null);
  const [detail, setDetail] = useState<FundDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [sipAmount, setSipAmount] = useState("5000");
  const [sipMonths, setSipMonths] = useState("12");
  const [sipLoading, setSipLoading] = useState(false);

  const searchRequestRef = useRef(0);
  const detailRequestRef = useRef(0);

  // Debounced search. The ref guard drops stale responses so a slow early
  // keystroke can't overwrite results for what the user has since typed.
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      searchRequestRef.current++;
      setResults([]);
      setSearching(false);
      setSearchError(null);
      setHasSearched(false);
      return;
    }

    const requestId = ++searchRequestRef.current;
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/mutual-funds/search?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json();

        if (requestId !== searchRequestRef.current) return;
        if (!res.ok) throw new Error(json?.error || "Search failed");

        setResults(Array.isArray(json.schemes) ? json.schemes : []);
        setSearchError(null);
        setHasSearched(true);
      } catch (err) {
        if (requestId !== searchRequestRef.current) return;

        const message = err instanceof Error ? err.message : "Search failed";
        setResults([]);
        setSearchError(message);
        setHasSearched(true);
      } finally {
        if (requestId === searchRequestRef.current) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const loadDetail = useCallback(
    async (schemeCode: number, sip?: { amount: number; months: number }) => {
      const requestId = ++detailRequestRef.current;

      if (sip) setSipLoading(true);
      else setDetailLoading(true);

      try {
        const params = sip ? `?sipAmount=${sip.amount}&sipMonths=${sip.months}` : "";
        const res = await fetch(`/api/mutual-funds/${schemeCode}${params}`);
        const json = await res.json();

        if (requestId !== detailRequestRef.current) return;
        if (!res.ok) throw new Error(json?.error || "Failed to load scheme");

        setDetail(json);
        setDetailError(null);
      } catch (err) {
        if (requestId !== detailRequestRef.current) return;

        const message = err instanceof Error ? err.message : "Failed to load scheme";
        setDetailError(message);
        if (!sip) setDetail(null);
        toast.error(message);
      } finally {
        if (requestId === detailRequestRef.current) {
          setDetailLoading(false);
          setSipLoading(false);
        }
      }
    },
    []
  );

  const handleSelect = (schemeCode: number) => {
    setSelectedCode(schemeCode);
    setDetail(null);
    setDetailError(null);
    loadDetail(schemeCode);
  };

  const handleSipSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedCode === null) return;

    const amount = Number(sipAmount);
    const months = Number(sipMonths);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Monthly amount must be a positive number");
      return;
    }

    if (!Number.isFinite(months) || months < 1) {
      toast.error("Duration must be at least 1 month");
      return;
    }

    loadDetail(selectedCode, { amount, months: Math.floor(months) });
  };

  const chartPoints = detail ? lastYearChronological(detail.navHistory) : [];

  return (
    <PageShell
      width="wide"
      eyebrow="Tools"
      title="Mutual Funds"
      description="Search Indian schemes, review NAV history and model what a monthly SIP would have returned."
    >
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <SchemeSearch
          query={query}
          setQuery={setQuery}
          results={results}
          searching={searching}
          searchError={searchError}
          hasSearched={hasSearched}
          selectedCode={selectedCode}
          onSelect={handleSelect}
        />

        <div className="flex flex-col gap-6">
          {detailLoading ? (
            <div className="space-y-6" aria-busy="true">
              <Skeleton className="h-32" />
              <Skeleton className="h-64" />
            </div>
          ) : detailError && !detail ? (
            <ErrorState
              message={detailError}
              onRetry={selectedCode !== null ? () => loadDetail(selectedCode) : undefined}
            />
          ) : !detail ? (
            <Panel>
              <EmptyState
                className="border-0 py-16"
                title="No scheme selected"
                description="Select a scheme to see its NAV history and SIP projection."
              />
            </Panel>
          ) : (
            <>
              <SchemeOverview
                scheme={detail.scheme}
                latestNav={detail.latestNav}
                navHistoryCount={detail.navHistoryCount}
                chartPoints={chartPoints}
              />

              <SipCalculator
                amount={sipAmount}
                months={sipMonths}
                setAmount={setSipAmount}
                setMonths={setSipMonths}
                onSubmit={handleSipSubmit}
                loading={sipLoading}
                result={detail.sip}
              />
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
