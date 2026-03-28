
import { fetchJSON } from "../actions/finnhub.actions";
import { getDateRange } from "../utils";
import { getCacheKey, getOrFetch, getTTL } from "./cache";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_TOKEN = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

const TIMEOUT_MS = 500;

export interface MarketData {
  symbol: string;
  priceData: {
    current: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    prevClose: number;
  } | null;
  profile: any | null;
  metrics: any | null;
  news: Array<{
    headline: string;
    summary: string;
    datetime: number;
    source: string;
  }>;
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), ms)
      ),
    ]);
  } catch {
    return fallback;
  }
}

export async function getFinnhubQuote(symbol: string) {
  if (!FINNHUB_TOKEN) return null;

  const cacheKey = getCacheKey("finnhub_quote", { symbol });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_TOKEN}`;
        const data = await withTimeout(
          fetchJSON<any>(url),
          TIMEOUT_MS,
          null
        );

        if (!data || !data.c) return null;

        return {
          current: data.c,
          change: data.d,
          changePercent: data.dp,
          high: data.h,
          low: data.l,
          open: data.o,
          prevClose: data.pc,
        };
      },
      getTTL("finnhubQuote"),
      true
    );
  } catch (error) {
    console.error("Finnhub quote error:", error);
    return null;
  }
}

export async function getStockProfile(symbol: string) {
  if (!FINNHUB_TOKEN) return null;

  const cacheKey = getCacheKey("finnhub_profile", { symbol });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_TOKEN}`;
        return await withTimeout(fetchJSON<any>(url, 3600), TIMEOUT_MS, null);
      },
      getTTL("finnhubProfile"),
      false
    );
  } catch {
    return null;
  }
}

export async function getStockMetrics(symbol: string) {
  if (!FINNHUB_TOKEN) return null;

  const cacheKey = getCacheKey("finnhub_metrics", { symbol });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const url = `${FINNHUB_BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_TOKEN}`;
        return await withTimeout(fetchJSON<any>(url, 1800), TIMEOUT_MS, null);
      },
      getTTL("finnhubMetrics"),
      false
    );
  } catch {
    return null;
  }
}

export async function getCompanyNews(symbol: string, daysBack: number = 7) {
  if (!FINNHUB_TOKEN) return [];

  const cacheKey = getCacheKey("company_news", { symbol, daysBack });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const range = getDateRange(daysBack);
        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${range.from}&to=${range.to}&token=${FINNHUB_TOKEN}`;
        const news = await withTimeout(fetchJSON<any[]>(url, 300), 600, []);

        return (news || [])
          .slice(0, 10)
          .map((n: any) => ({
            headline: n.headline,
            summary: n.summary,
            datetime: n.datetime,
            source: n.source,
          }));
      },
      getTTL("news"),
      true
    );
  } catch {
    return [];
  }
}

export async function getGeneralNews() {
  if (!FINNHUB_TOKEN) return [];

  const cacheKey = getCacheKey("general_news", {});

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const url = `${FINNHUB_BASE_URL}/news?category=general&token=${FINNHUB_TOKEN}`;
        const news = await withTimeout(fetchJSON<any[]>(url, 300), 600, []);

        return (news || [])
          .slice(0, 10)
          .map((n: any) => ({
            headline: n.headline,
            summary: n.summary,
            datetime: n.datetime,
            source: n.source,
          }));
      },
      getTTL("news"),
      true
    );
  } catch {
    return [];
  }
}

export async function aggregateMarketData(symbol: string): Promise<MarketData> {
  const [priceData, profile, metrics, news] = await Promise.all([
    getFinnhubQuote(symbol),
    getStockProfile(symbol),
    getStockMetrics(symbol),
    getCompanyNews(symbol),
  ]);

  return {
    symbol,
    priceData,
    profile,
    metrics: metrics?.metric || null,
    news,
  };
}

export function extractSymbolFromQuery(query: string): string | null {
  const stockPattern = /\b([A-Z]{1,5})\b/g;
  const matches = query.match(stockPattern);
  
  const commonStocks = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", "JPM", "V", "WMT", "DIS", "NFLX"];
  
  if (matches) {
    for (const match of matches) {
      if (commonStocks.includes(match)) {
        return match;
      }
    }
    return matches[0] || null;
  }

  return null;
}
