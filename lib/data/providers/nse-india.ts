// India equity market data source using the free, no-auth NSE/BSE REST API
// (http://65.0.104.9/), following the "cache -> primary -> free fallback ->
// explicit null, never fabricate" data-cascade discipline from
// india-trade-cli/market/quotes.py and yfinance_provider.py.
// Avoids raw NSE HTML/cookie scraping (india-trade-cli's active_stocks.py /
// nse_scraper.py) entirely — this API is a documented JSON endpoint.

import { getCacheKey, getOrFetch, getTTL } from "@/lib/chat/cache";

const NSE_INDIA_BASE_URL = process.env.NSE_INDIA_API_BASE_URL || "http://65.0.104.9";
const TIMEOUT_MS = 3000;

export type IndianExchange = "NSE" | "BSE";

export interface IndianStockQuote {
  symbol: string;
  exchange: IndianExchange;
  ticker: string;
  companyName: string;
  lastPrice: number;
  change: number;
  percentChange: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  volume: number;
  marketCap: number | null;
  peRatio: number | null;
  dividendYield: number | null;
  sector: string | null;
  industry: string | null;
  lastUpdate: string;
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

function mapQuote(symbol: string, exchange: IndianExchange, data: any): IndianStockQuote | null {
  if (!data) return null;
  return {
    symbol,
    exchange,
    ticker: `${symbol}.${exchange === "NSE" ? "NS" : "BO"}`,
    companyName: data.company_name,
    lastPrice: data.last_price,
    change: data.change,
    percentChange: data.percent_change,
    previousClose: data.previous_close,
    open: data.open,
    dayHigh: data.day_high,
    dayLow: data.day_low,
    yearHigh: data.year_high,
    yearLow: data.year_low,
    volume: data.volume,
    marketCap: data.market_cap ?? null,
    peRatio: data.pe_ratio ?? null,
    dividendYield: data.dividend_yield ?? null,
    sector: data.sector ?? null,
    industry: data.industry ?? null,
    lastUpdate: data.last_update,
  };
}

// symbol may be bare ("RELIANCE"), or suffixed (".NS" / ".BO"). Bare defaults to NSE.
export async function getIndianStockQuote(symbol: string): Promise<IndianStockQuote | null> {
  const cacheKey = getCacheKey("nse_india_quote", { symbol });

  return getOrFetch(
    cacheKey,
    async () => {
      const url = `${NSE_INDIA_BASE_URL}/stock?symbol=${encodeURIComponent(symbol)}&res=num`;
      const res = await withTimeout(fetch(url), TIMEOUT_MS);
      if (!res || !res.ok) return null;

      const json = await res.json();
      if (json?.status !== "success" || !json?.data) return null;

      return mapQuote(json.symbol, json.exchange, json.data);
    },
    getTTL("finnhubQuote"),
    true
  );
}

export async function getIndianStockQuotes(symbols: string[]): Promise<IndianStockQuote[]> {
  const batch = symbols.slice(0, 25);
  const cacheKey = getCacheKey("nse_india_quote_list", { symbols: batch.join(",") });

  const result = await getOrFetch(
    cacheKey,
    async () => {
      const url = `${NSE_INDIA_BASE_URL}/stock/list?symbols=${encodeURIComponent(batch.join(","))}&res=num`;
      const res = await withTimeout(fetch(url), TIMEOUT_MS);
      if (!res || !res.ok) return null;

      const json = await res.json();
      if (json?.status !== "success" || !Array.isArray(json?.stocks)) return null;

      return json.stocks
        .map((s: any) => mapQuote(s.symbol, s.exchange, s))
        .filter(Boolean) as IndianStockQuote[];
    },
    getTTL("finnhubQuote"),
    true
  );

  return result || [];
}

export interface IndianStockSearchResult {
  symbol: string;
  companyName: string;
}

export async function searchIndianStocks(query: string): Promise<IndianStockSearchResult[]> {
  const cacheKey = getCacheKey("nse_india_search", { query });

  const result = await getOrFetch(
    cacheKey,
    async () => {
      const url = `${NSE_INDIA_BASE_URL}/search?q=${encodeURIComponent(query)}`;
      const res = await withTimeout(fetch(url), TIMEOUT_MS);
      if (!res || !res.ok) return null;

      const json = await res.json();
      if (json?.status !== "success" || !Array.isArray(json?.results)) return null;

      return json.results.map((r: any) => ({
        symbol: r.symbol,
        companyName: r.company_name,
      })) as IndianStockSearchResult[];
    },
    getTTL("finnhubProfile"),
    true
  );

  return result || [];
}

// Bare NSE tickers (no dot suffix) are the common case for Indian equities
// mentioned in chat queries; anything with a known India-exchange pattern.
export function isLikelyIndianTicker(symbol: string): boolean {
  return /\.(NS|BO)$/i.test(symbol);
}
