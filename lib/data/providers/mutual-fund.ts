// Indian mutual fund data via mfapi.in (free, no-auth JSON API), the same
// data source mftool wraps in Python. Skips mftool's yfinance/matplotlib
// helpers and deprecated AMC/AUM HTML scrapers — those don't apply to a
// server-rendered Next.js app and mfapi.in already covers NAV + scheme
// metadata cleanly.

import { getCacheKey, getOrFetch, getTTL } from "@/lib/chat/cache";

const MFAPI_BASE_URL = "https://api.mfapi.in/mf";
const TIMEOUT_MS = 3000;
const NAV_HISTORY_TTL_MS = 24 * 60 * 60 * 1000; // NAV published once daily

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

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
    ]);
  } catch {
    return null;
  }
}

export async function searchMutualFundSchemes(query: string): Promise<MutualFundScheme[]> {
  const cacheKey = getCacheKey("mfapi_search", { query });

  const result = await getOrFetch(
    cacheKey,
    async () => {
      const url = `${MFAPI_BASE_URL}/search?q=${encodeURIComponent(query)}`;
      const res = await withTimeout(fetch(url), TIMEOUT_MS);
      if (!res || !res.ok) return null;

      const json = await res.json();
      if (!Array.isArray(json)) return null;

      return json.map((s: any) => ({
        schemeCode: s.schemeCode,
        schemeName: s.schemeName,
      })) as MutualFundScheme[];
    },
    getTTL("finnhubProfile"),
    true
  );

  return result || [];
}

export async function getMutualFundDetail(schemeCode: number): Promise<MutualFundDetail | null> {
  const cacheKey = getCacheKey("mfapi_scheme", { schemeCode });

  return getOrFetch(
    cacheKey,
    async () => {
      const url = `${MFAPI_BASE_URL}/${schemeCode}`;
      const res = await withTimeout(fetch(url), TIMEOUT_MS);
      if (!res || !res.ok) return null;

      const json = await res.json();
      if (json?.status !== "SUCCESS" || !json?.meta) return null;

      const navHistory: MutualFundNAVPoint[] = Array.isArray(json.data)
        ? json.data.map((d: any) => ({ date: d.date, nav: parseFloat(d.nav) }))
        : [];

      return {
        schemeCode: json.meta.scheme_code,
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

  // navHistory is newest-first from mfapi.in; walk oldest-to-newest for SIP dates.
  const chronological = [...navHistory].reverse();
  const step = Math.max(1, Math.floor(chronological.length / months));

  let units = 0;
  let installments = 0;
  let totalInvested = 0;

  for (let i = 0; i < chronological.length && installments < months; i += step) {
    const nav = chronological[i].nav;
    if (!nav || nav <= 0) continue;
    units += monthlyAmount / nav;
    totalInvested += monthlyAmount;
    installments++;
  }

  if (installments === 0) return null;

  const latestNav = chronological[chronological.length - 1].nav;
  const currentValue = units * latestNav;
  const absoluteReturnPct = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

  return { totalInvested, units, currentValue, absoluteReturnPct, installments };
}
