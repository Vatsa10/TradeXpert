const globalCache = new Map<string, CacheEntry>();
const requestCache = new Map<string, any>();

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

export function getRequestCache<T>(key: string): T | null {
  return requestCache.get(key) || null;
}

export function setRequestCache<T>(key: string, data: T): void {
  requestCache.set(key, data);
}

export function clearRequestCache(): void {
  requestCache.clear();
}

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

  const requestCached = getRequestCache<T>(key);
  if (requestCached) {
    return requestCached;
  }

  try {
    const data = await fetcher();
    setCache(key, data, ttl, staleWhileRevalidate);
    setRequestCache(key, data);
    
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
  setInterval(cleanupExpiredCache, 60 * 1000);
}
