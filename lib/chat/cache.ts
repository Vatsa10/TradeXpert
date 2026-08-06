const globalCache = new Map<string, CacheEntry>();
// In-flight de-duplication. This used to be a plain result map cleared by
// clearRequestCache() at the top of every orchestrateQuery call — but module
// state is shared across concurrent requests on the server, so one request
// wiped another's mid-flight entries, and anything not cleared lived forever
// with no TTL. Keying by promise and deleting on settle is self-cleaning and
// race-free.
const inFlight = new Map<string, Promise<any>>();

interface CacheEntry {
  data: any;
  expiry: number;
  staleWhileRevalidate?: boolean;
}

const TTL = {
  finnhubQuote: 30 * 1000,
  finnhubProfile: 6 * 60 * 60 * 1000,
  finnhubMetrics: 60 * 60 * 1000,
  news: 3 * 60 * 1000,
  search: 5 * 60 * 1000,
  alphaVantage: 3 * 60 * 60 * 1000,
  // Kite quotes are the live Indian tape — short TTL keeps them near-real-time
  // while still collapsing the burst of calls a single chat turn makes.
  kiteQuote: 15 * 1000,
  // The NSE instruments dump is several MB and only changes on corporate
  // actions / new listings, so it is refetched once a day at most.
  kiteInstruments: 24 * 60 * 60 * 1000,
  kiteHistorical: 10 * 60 * 1000,
  kitePortfolio: 30 * 1000,
};

export function getCacheKey(type: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, any>);
  
  return `${type}:${JSON.stringify(sortedParams)}`;
}

export function getFromCache(key: string): { data: any; isStale: boolean } | null {
  const entry = globalCache.get(key);
  
  if (!entry) {
    return null;
  }

  const now = Date.now();
  
  if (entry.expiry > now) {
    return { data: entry.data, isStale: false };
  }

  if (entry.staleWhileRevalidate) {
    return { data: entry.data, isStale: true };
  }

  globalCache.delete(key);
  return null;
}

export function setCache(
  key: string,
  data: any,
  ttl: number,
  staleWhileRevalidate: boolean = true
): void {
  globalCache.set(key, {
    data,
    expiry: Date.now() + ttl,
    staleWhileRevalidate,
  });
}

export function getRequestCache<T>(key: string): Promise<T> | null {
  return (inFlight.get(key) as Promise<T> | undefined) || null;
}

export function setRequestCache<T>(key: string, promise: Promise<T>): void {
  inFlight.set(key, promise);
}

// Kept for API compatibility. Deliberately a no-op for in-flight entries:
// clearing them from one request cancelled de-duplication for every other
// concurrent request.
export function clearRequestCache(): void {}

export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  staleWhileRevalidate: boolean = true
): Promise<T> {
  const cached = getFromCache(key);
  
  if (cached && !cached.isStale) {
    return cached.data;
  }

  const pending = getRequestCache<T>(key);
  if (pending) {
    try {
      return await pending;
    } catch {
      if (cached) return cached.data;
      throw new Error(`Fetch failed for ${key}`);
    }
  }

  const promise = fetcher();
  setRequestCache(key, promise);

  try {
    const data = await promise;
    setCache(key, data, ttl, staleWhileRevalidate);

    if (cached && cached.isStale && staleWhileRevalidate) {
      fetcher().then(freshData => {
        setCache(key, freshData, ttl, staleWhileRevalidate);
      }).catch(() => {});
    }

    return data;
  } catch (error) {
    if (cached) {
      return cached.data;
    }
    throw error;
  } finally {
    if (inFlight.get(key) === promise) inFlight.delete(key);
  }
}

export function getTTL(type: keyof typeof TTL): number {
  return TTL[type];
}

export function cleanupExpiredCache(): void {
  const now = Date.now();
  
  for (const [key, entry] of globalCache.entries()) {
    if (entry.expiry < now && !entry.staleWhileRevalidate) {
      globalCache.delete(key);
    }
  }
}

if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(cleanupExpiredCache, 60 * 1000);
  // A janitor timer should never be the reason a process stays alive. Without
  // unref, importing this module from a script (or a test runner) hangs the
  // process forever waiting on an interval that only sweeps an in-memory Map.
  if (typeof cleanupTimer === "object" && typeof cleanupTimer?.unref === "function") {
    cleanupTimer.unref();
  }
}
