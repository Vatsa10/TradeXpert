
import { fetchJSON } from "../actions/finnhub.actions";
import { getDateRange } from "../utils";
import { getCacheKey, getOrFetch, getTTL } from "./cache";
import { getIndianStockQuote, isLikelyIndianTicker } from "@/lib/data/providers/nse-india";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_TOKEN = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

const TIMEOUT_MS = 1200;

const SYMBOL_TO_COMPANY: Record<string, string> = {
  AAPL: "Apple",
  MSFT: "Microsoft",
  GOOGL: "Google",
  GOOG: "Google",
  AMZN: "Amazon",
  TSLA: "Tesla",
  META: "Meta",
  NVDA: "NVIDIA",
  NFLX: "Netflix",
  JPM: "JPMorgan",
  BABA: "Alibaba",
  TCS: "TCS",
  INFY: "Infosys",
};

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
  // India-listed tickers (.NS/.BO) aren't covered by Finnhub/Alpha Vantage's
  // free tiers — route them to the free NSE/BSE data source instead.
  if (isLikelyIndianTicker(symbol)) {
    const indian = await getIndianStockQuote(symbol);
    if (indian) {
      return {
        current: indian.lastPrice,
        change: indian.change,
        changePercent: indian.percentChange,
        high: indian.dayHigh,
        low: indian.dayLow,
        open: indian.open,
        prevClose: indian.previousClose,
      };
    }
  }

  if (!FINNHUB_TOKEN) {
    return await getAlphaVantageQuote(symbol);
  }

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

        if (!data || !data.c) {
          return await getAlphaVantageQuote(symbol);
        }

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
    return await getAlphaVantageQuote(symbol);
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
  if (!FINNHUB_TOKEN) {
    return await getAlphaVantageOverview(symbol);
  }

  const cacheKey = getCacheKey("finnhub_metrics", { symbol });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const url = `${FINNHUB_BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_TOKEN}`;
        const finnhubMetrics = await withTimeout(fetchJSON<any>(url, 1800), TIMEOUT_MS, null);
        if (!finnhubMetrics || !finnhubMetrics.metric) {
          return await getAlphaVantageOverview(symbol);
        }
        return finnhubMetrics;
      },
      getTTL("finnhubMetrics"),
      false
    );
  } catch {
    return await getAlphaVantageOverview(symbol);
  }
}

export async function getCompanyNews(symbol: string, daysBack: number = 7) {
  if (!FINNHUB_TOKEN) return [];

  const cacheKey = getCacheKey("company_news", { symbol, daysBack });

  try {
    const finnhubNews = await getOrFetch(
      cacheKey,
      async () => {
        const range = getDateRange(daysBack);
        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${range.from}&to=${range.to}&token=${FINNHUB_TOKEN}`;
        const news = await withTimeout(fetchJSON<any[]>(url, 300), 1500, []);

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

    const supplementalNews = await getNewsApiNews(symbol, 4);
    return mergeNewsItems(finnhubNews || [], supplementalNews);
  } catch {
    return await getNewsApiNews(symbol, 6);
  }
}

export async function getGeneralNews() {
  if (!FINNHUB_TOKEN) {
    return await getNewsApiNews("stock market", 8);
  }

  const cacheKey = getCacheKey("general_news", {});

  try {
    const finnhubNews = await getOrFetch(
      cacheKey,
      async () => {
        const url = `${FINNHUB_BASE_URL}/news?category=general&token=${FINNHUB_TOKEN}`;
        const news = await withTimeout(fetchJSON<any[]>(url, 300), 1500, []);

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

    const supplementalNews = await getNewsApiNews("stock market", 6);
    return mergeNewsItems(finnhubNews || [], supplementalNews);
  } catch {
    return await getNewsApiNews("stock market", 8);
  }
}

async function getAlphaVantageQuote(symbol: string) {
  if (!ALPHA_VANTAGE_API_KEY) return null;

  const cacheKey = getCacheKey("alpha_quote", { symbol });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const data = await withTimeout(fetchJSON<any>(url, 1200), 1600, null);
        const quote = data?.["Global Quote"];

        if (!quote) return null;

        const current = parseFloat(quote["05. price"] || quote["02. open"] || "0");
        const change = parseFloat(quote["09. change"] || "0");
        const changePercent = parseFloat(String(quote["10. change percent"] || "0").replace("%", ""));
        const high = parseFloat(quote["03. high"] || String(current));
        const low = parseFloat(quote["04. low"] || String(current));
        const open = parseFloat(quote["02. open"] || String(current));
        const prevClose = parseFloat(quote["08. previous close"] || String(current));

        if (!Number.isFinite(current) || current <= 0) return null;

        return {
          current,
          change: Number.isFinite(change) ? change : current - prevClose,
          changePercent: Number.isFinite(changePercent)
            ? changePercent
            : prevClose > 0
              ? ((current - prevClose) / prevClose) * 100
              : 0,
          high: Number.isFinite(high) ? high : current,
          low: Number.isFinite(low) ? low : current,
          open: Number.isFinite(open) ? open : current,
          prevClose: Number.isFinite(prevClose) ? prevClose : current,
        };
      },
      getTTL("alphaVantage"),
      false
    );
  } catch {
    return null;
  }
}

async function getAlphaVantageOverview(symbol: string) {
  if (!ALPHA_VANTAGE_API_KEY) return null;

  const cacheKey = getCacheKey("alpha_overview", { symbol });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const data = await withTimeout(fetchJSON<any>(url, 1800), 2200, null);

        if (!data || data.Note || data.Information || Object.keys(data).length === 0) {
          return null;
        }

        return data;
      },
      getTTL("alphaVantage"),
      false
    );
  } catch {
    return null;
  }
}

export async function getNewsApiNews(queryOrSymbol: string, pageSize: number = 5) {
  if (!NEWS_API_KEY) return [];

  const company = SYMBOL_TO_COMPANY[queryOrSymbol.toUpperCase()] || queryOrSymbol;
  const query = `${company} stock OR ${queryOrSymbol}`;
  const cacheKey = getCacheKey("news_api", { query, pageSize });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
        const data = await withTimeout(fetchJSON<any>(url, 1200), 1800, null);
        const articles = data?.articles;
        if (!Array.isArray(articles)) return [];

        return articles
          .slice(0, pageSize)
          .map((a: any) => ({
            headline: a.title || "No title",
            summary: a.description || a.content || "",
            datetime: a.publishedAt ? Math.floor(new Date(a.publishedAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
            source: a.source?.name || "NewsAPI",
          }));
      },
      getTTL("news"),
      false
    );
  } catch {
    return [];
  }
}

function mergeNewsItems(primary: Array<{ headline: string; summary: string; datetime: number; source: string }>, secondary: Array<{ headline: string; summary: string; datetime: number; source: string }>) {
  const combined = [...primary, ...secondary];
  const seen = new Set<string>();
  const deduped: Array<{ headline: string; summary: string; datetime: number; source: string }> = [];

  for (const item of combined) {
    const key = item.headline.toLowerCase().trim();
    if (!seen.has(key) && key.length > 0) {
      seen.add(key);
      deduped.push(item);
    }
  }

  deduped.sort((a, b) => b.datetime - a.datetime);
  return deduped.slice(0, 12);
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
