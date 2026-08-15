// Indian mutual fund data via mfapi.in (free, no-auth JSON API), the same
// data source mftool wraps in Python. Skips mftool's yfinance/matplotlib
// helpers and deprecated AMC/AUM HTML scrapers — those don't apply to a
// server-rendered Next.js app and mfapi.in already covers NAV + scheme
// metadata cleanly.

import { getCacheKey, getOrFetch, getTTL } from "@/lib/chat/cache";

const MFAPI_BASE_URL = "https://api.mfapi.in/mf";
// mfapi.in answers a warm search in ~0.6s but a cold one measured ~3.1s through
// node's fetch, so the old 3s ceiling aborted essentially every first call.
const TIMEOUT_MS = 8000;
const NAV_HISTORY_TTL_MS = 24 * 60 * 60 * 1000; // NAV published once daily
const STALE_NAV_DAYS = 30;

export interface MutualFundNAVPoint {
  date: string; // DD-MM-YYYY as returned by mfapi.in
  nav: number;
}

export interface MutualFundScheme {
  schemeCode: number;
  schemeName: string;
  fundHouse?: string;
  schemeType?: string;
  schemeCategory?: string;
}

export interface MutualFundDetail extends MutualFundScheme {
  navHistory: MutualFundNAVPoint[];
  latestNav: MutualFundNAVPoint | null;
}

// AbortSignal.timeout cancels the request itself and leaves no dangling timer,
// unlike a Promise.race against setTimeout.
// NOTE: this THROWS (rather than returning null) on failure so that getOrFetch
// never caches the failure for the full TTL — one transient timeout used to make
// mutual-fund search permanently dead until the entry expired. Same discipline
// as fetchDailySeries in lib/analysis/technical-indicators.ts.
async function fetchJson(url: string): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error: any) {
    logFetchFailure(url, error?.name === "TimeoutError" ? "timeout" : "network", error);
    throw error instanceof Error ? error : new Error(String(error));
  }

  if (!res.ok) {
    logFetchFailure(url, "http-status", new Error(`status ${res.status}`));
    throw new Error(`mfapi.in responded ${res.status}`);
  }

  try {
    return await res.json();
  } catch (error: any) {
    logFetchFailure(url, "parse", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function logFetchFailure(url: string, stage: string, error: any) {
  console.error(
    `[MF] fetch-failed ${describeUrl(url)} stage=${stage} errorType=${error?.name || "Error"} error=${String(error?.message || error).replace(/\s+/g, " ").slice(0, 120)}`
  );
}

function describeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `host=${parsed.host} endpoint=${parsed.pathname}`;
  } catch {
    return `host=unknown endpoint=unknown`;
  }
}

export async function searchMutualFundSchemes(query: string): Promise<MutualFundScheme[]> {
  const cacheKey = getCacheKey("mfapi_search", { query });

  // The fetcher throws on an unusable payload so getOrFetch keeps no negative
  // cache entry; the catch here preserves the "empty list, never explode" contract.
  try {
    const result = await getOrFetch(
      cacheKey,
      async () => {
        const url = `${MFAPI_BASE_URL}/search?q=${encodeURIComponent(query)}`;
        const json = await fetchJson(url);
        if (!Array.isArray(json)) throw new Error("mfapi.in search returned a non-array payload");

        return json.map((s: any) => ({
          schemeCode: s.schemeCode,
          schemeName: s.schemeName,
        })) as MutualFundScheme[];
      },
      getTTL("finnhubProfile"),
      true
    );

    return result || [];
  } catch {
    return [];
  }
}

export async function getMutualFundDetail(schemeCode: number): Promise<MutualFundDetail | null> {
  const cacheKey = getCacheKey("mfapi_scheme", { schemeCode });

  // Same throw-don't-null discipline as the search path above: a transient
  // failure must not be negative-cached for the 24h NAV TTL.
  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const url = `${MFAPI_BASE_URL}/${schemeCode}`;
        const json = await fetchJson(url);
        // mfapi.in answers unknown scheme codes with status SUCCESS and a meta
        // block of empty strings, which used to surface as a 200 with a blank
        // scheme instead of a 404. Treat a nameless scheme as not found.
        if (json?.status !== "SUCCESS" || !json?.meta) {
          throw new Error(`mfapi.in returned no scheme payload for ${schemeCode}`);
        }
        if (!String(json.meta.scheme_name ?? "").trim()) {
          throw new Error(`mfapi.in has no scheme named for code ${schemeCode}`);
        }

        // mfapi.in returns NAV as a string and publishes "N.A." / "0" rows for
        // non-trading days; drop them here so downstream SIP/return maths never
        // divides by NaN or zero.
        const navHistory: MutualFundNAVPoint[] = Array.isArray(json.data)
          ? json.data
              .map((d: any) => ({ date: d.date, nav: parseFloat(d.nav) }))
              .filter((p: MutualFundNAVPoint) => Number.isFinite(p.nav) && p.nav > 0)
          : [];

        return {
          schemeCode: Number(json.meta.scheme_code) || schemeCode,
          schemeName: json.meta.scheme_name,
          fundHouse: json.meta.fund_house,
          schemeType: json.meta.scheme_type,
          schemeCategory: json.meta.scheme_category,
          navHistory,
          latestNav: navHistory[0] || null,
        };
      },
      NAV_HISTORY_TTL_MS,
      true
    );
  } catch (error) {
    console.warn(
      `[MF] scheme detail failed for ${schemeCode}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

// mfapi.in keeps delisted/merged schemes in its index and happily serves their
// last-ever NAV (we saw a 2018 one), so SIP maths can be computed off a NAV that
// is years old with no visible signal. Callers surface this alongside the result.
export interface StaleNavWarning {
  latestNavDate: string;
  daysStale: number;
  message: string;
}

// mfapi.in dates are DD-MM-YYYY; Date.parse does not understand that format, so
// parse the parts explicitly and treat anything malformed as "unknown, not stale".
export function parseNavDate(date: string | undefined | null): Date | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(date || "").trim());
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const parsed = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));

  // Rejects impossible dates like 31-02-2024, which Date.UTC would roll forward.
  if (parsed.getUTCDate() !== Number(dd) || parsed.getUTCMonth() !== Number(mm) - 1) return null;

  return parsed;
}

export function getStaleNavWarning(
  latestNav: MutualFundNAVPoint | null | undefined,
  now: Date = new Date()
): StaleNavWarning | null {
  if (!latestNav) return null;

  const navDate = parseNavDate(latestNav.date);
  if (!navDate) return null;

  const daysStale = Math.floor((now.getTime() - navDate.getTime()) / (24 * 60 * 60 * 1000));
  if (daysStale <= STALE_NAV_DAYS) return null;

  return {
    latestNavDate: latestNav.date,
    daysStale,
    message: `Latest available NAV is from ${latestNav.date} (${daysStale} days old). This scheme may be closed, merged or delisted — returns shown are based on stale data.`,
  };
}

// Simple SIP (Systematic Investment Plan) return calculator: fixed monthly
// investment against the actual NAV history, XIRR-free approximate return.
export interface SIPResult {
  totalInvested: number;
  units: number;
  currentValue: number;
  absoluteReturnPct: number;
  installments: number;
}

export function calculateSIPReturns(
  navHistory: MutualFundNAVPoint[],
  monthlyAmount: number,
  months: number
): SIPResult | null {
  if (navHistory.length === 0) return null;
  if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0) return null;
  if (!Number.isFinite(months) || months < 1) return null;

  const targetInstallments = Math.floor(months);

  // navHistory is newest-first from mfapi.in; walk oldest-to-newest for SIP dates.
  // Drop unusable NAVs first so the step sampling can't land on a hole and skew
  // the installment spacing.
  const chronological = [...navHistory]
    .reverse()
    .filter((p) => Number.isFinite(p.nav) && p.nav > 0);

  if (chronological.length === 0) return null;

  // When the history is shorter than the requested horizon we can only buy on
  // the days we actually have, so step stays 1 and installments < months.
  const step = Math.max(1, Math.floor(chronological.length / targetInstallments));

  let units = 0;
  let installments = 0;
  let totalInvested = 0;

  for (let i = 0; i < chronological.length && installments < targetInstallments; i += step) {
    units += monthlyAmount / chronological[i].nav;
    totalInvested += monthlyAmount;
    installments++;
  }

  if (installments === 0) return null;

  const latestNav = chronological[chronological.length - 1].nav;
  const currentValue = units * latestNav;
  const absoluteReturnPct = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

  return { totalInvested, units, currentValue, absoluteReturnPct, installments };
}
