"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import NavChart, { type NavPoint } from "./NavChart";

const SEARCH_DEBOUNCE_MS = 350;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

interface Scheme {
  schemeCode: number;
  schemeName: string;
  fundHouse?: string;
  schemeType?: string;
  schemeCategory?: string;
}

interface SipResult {
  totalInvested: number;
  units: number;
  currentValue: number;
  absoluteReturnPct: number;
  installments: number;
}

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

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

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
        const params = sip
          ? `?sipAmount=${sip.amount}&sipMonths=${sip.months}`
          : "";
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
    <section className="flex flex-col gap-6 font-sans">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Mutual <span className="text-blue-500">Funds</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-gray-400">
          Search Indian schemes, review NAV history and model what a monthly SIP would
          have returned.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Search + results */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#27272A] bg-[#111111] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search schemes (min 3 characters)…"
              aria-label="Search mutual fund schemes"
              className="border-[#27272A] bg-[#0A0A0A] pl-9 text-gray-100 placeholder:text-gray-500"
            />
          </div>

          <div className="max-h-[520px] min-h-[120px] overflow-y-auto custom-scrollbar">
            {searching ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
                <Loader2 className="size-4 animate-spin text-blue-500" />
                Searching…
              </div>
            ) : searchError ? (
              <p className="px-2 py-10 text-center text-sm text-red-500">{searchError}</p>
            ) : results.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {results.map((scheme) => (
                  <li key={scheme.schemeCode}>
                    <button
                      type="button"
                      onClick={() => handleSelect(scheme.schemeCode)}
                      aria-pressed={selectedCode === scheme.schemeCode}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        selectedCode === scheme.schemeCode
                          ? "bg-[#27272A] text-white"
                          : "text-gray-300 hover:bg-[#18181B] hover:text-white"
                      )}
                    >
                      <span className="line-clamp-2">{scheme.schemeName}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        #{scheme.schemeCode}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 py-10 text-center text-sm text-gray-500">
                {hasSearched
                  ? "No schemes matched that search."
                  : "Type at least 3 characters to search."}
              </p>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="flex flex-col gap-6">
          {detailLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#27272A] bg-[#111111] py-24 text-sm text-gray-400">
              <Loader2 className="size-5 animate-spin text-blue-500" />
              Loading scheme…
            </div>
          ) : detailError && !detail ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#27272A] bg-[#111111] px-6 py-24 text-center">
              <p className="text-sm text-gray-400">{detailError}</p>
              {selectedCode !== null && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadDetail(selectedCode)}
                  className="border-[#27272A] bg-[#0A0A0A] text-gray-300 hover:bg-[#18181B] hover:text-white"
                >
                  Try again
                </Button>
              )}
            </div>
          ) : !detail ? (
            <div className="rounded-2xl border border-[#27272A] bg-[#111111] px-6 py-24 text-center text-sm text-gray-500">
              Select a scheme to see its NAV history and SIP projection.
            </div>
          ) : (
            <>
              {/* Meta */}
              <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-5">
                <h2 className="text-lg font-semibold text-white">
                  {detail.scheme.schemeName}
                </h2>

                <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "Fund House", value: detail.scheme.fundHouse },
                    { label: "Category", value: detail.scheme.schemeCategory },
                    { label: "Type", value: detail.scheme.schemeType },
                    {
                      label: "Latest NAV",
                      value: detail.latestNav
                        ? `₹${detail.latestNav.nav.toFixed(2)} · ${detail.latestNav.date}`
                        : undefined,
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs text-gray-500">{label}</dt>
                      <dd className="mt-1 text-sm text-gray-200">{value || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* NAV chart */}
              <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-5">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-medium text-white">NAV — last 12 months</h3>
                  <span className="text-xs text-gray-500">
                    {chartPoints.length} of {detail.navHistoryCount} points
                  </span>
                </div>

                <NavChart points={chartPoints} />
              </div>

              {/* SIP calculator */}
              <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-5">
                <h3 className="text-sm font-medium text-white">SIP calculator</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Modelled against this scheme&apos;s actual NAV history.
                </p>

                <form
                  onSubmit={handleSipSubmit}
                  className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                  <div className="flex-1">
                    <label
                      htmlFor="sip-amount"
                      className="mb-1.5 block text-xs text-gray-400"
                    >
                      Monthly amount (₹)
                    </label>
                    <Input
                      id="sip-amount"
                      type="number"
                      min={1}
                      step={100}
                      value={sipAmount}
                      onChange={(e) => setSipAmount(e.target.value)}
                      className="border-[#27272A] bg-[#0A0A0A] text-gray-100"
                    />
                  </div>

                  <div className="flex-1">
                    <label
                      htmlFor="sip-months"
                      className="mb-1.5 block text-xs text-gray-400"
                    >
                      Duration (months)
                    </label>
                    <Input
                      id="sip-months"
                      type="number"
                      min={1}
                      step={1}
                      value={sipMonths}
                      onChange={(e) => setSipMonths(e.target.value)}
                      className="border-[#27272A] bg-[#0A0A0A] text-gray-100"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sipLoading}
                    className="yellow-btn sm:w-auto"
                  >
                    {sipLoading && <Loader2 className="size-4 animate-spin" />}
                    Calculate
                  </Button>
                </form>

                {detail.sip && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-4">
                      <p className="text-xs text-gray-500">Invested</p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {currency.format(detail.sip.totalInvested)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {detail.sip.installments} installments
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-4">
                      <p className="text-xs text-gray-500">Current value</p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {currency.format(detail.sip.currentValue)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {detail.sip.units.toFixed(3)} units
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-4">
                      <p className="text-xs text-gray-500">Absolute return</p>
                      <p
                        className={cn(
                          "mt-1 text-lg font-semibold",
                          detail.sip.absoluteReturnPct >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                      >
                        {detail.sip.absoluteReturnPct >= 0 ? "+" : ""}
                        {detail.sip.absoluteReturnPct.toFixed(2)}%
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {currency.format(
                          detail.sip.currentValue - detail.sip.totalInvested
                        )}{" "}
                        gain
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
