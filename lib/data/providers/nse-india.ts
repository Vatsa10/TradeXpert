// India equity market data source using a free, no-auth NSE/BSE REST API
// (host supplied via NSE_INDIA_API_BASE_URL), following the "cache -> primary -> free fallback ->
// explicit null, never fabricate" data-cascade discipline from
// india-trade-cli/market/quotes.py and yfinance_provider.py.
// Avoids raw NSE HTML/cookie scraping (india-trade-cli's active_stocks.py /
// nse_scraper.py) entirely — this API is a documented JSON endpoint.

import { getCacheKey, getOrFetch, getTTL } from "@/lib/chat/cache";

// The previously hardcoded default host (65.0.104.9) is dead — TCP never
// connects — so every Indian-ticker query paid a full 3s timeout before falling
// through. The base URL is now required from env: with no NSE_INDIA_API_BASE_URL
// configured the provider skips instantly instead of stalling the request.
const NSE_INDIA_BASE_URL = process.env.NSE_INDIA_API_BASE_URL || "";
const TIMEOUT_MS = 3000;

// Circuit breaker: once the configured host has failed 3 times in a row it is
// almost certainly down, so stop paying the timeout on every subsequent call
// until the cooldown elapses. Module-level state is per server instance, which
// is the right granularity — the outage is per host, not per user.
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 10 * 60 * 1000;

let consecutiveFailures = 0;
let circuitOpenedAt = 0;

function isProviderAvailable(): boolean {
  if (!NSE_INDIA_BASE_URL) return false;

  if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    if (Date.now() - circuitOpenedAt < CIRCUIT_COOLDOWN_MS) return false;
    // Cooldown elapsed: half-open the circuit and let one probe through.
    consecutiveFailures = 0;
    circuitOpenedAt = 0;
  }

  return true;
}

function recordFailure() {
  consecutiveFailures++;
  if (consecutiveFailures === CIRCUIT_FAILURE_THRESHOLD) {
    circuitOpenedAt = Date.now();
    console.error(
      `[NSE] circuit-open after ${consecutiveFailures} consecutive failures; skipping calls for ${CIRCUIT_COOLDOWN_MS / 60000}min`
    );
  }
}

function recordSuccess() {
  consecutiveFailures = 0;
  circuitOpenedAt = 0;
}

// Lets callers explain a miss ("provider not configured") without paying a request.
export function isNSEProviderConfigured(): boolean {
  return NSE_INDIA_BASE_URL.length > 0;
}

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

// AbortSignal.timeout actually cancels the in-flight request and leaves no
// dangling timer, unlike a Promise.race against setTimeout (which kept the
// socket open and the event loop alive for the full TTL after a timeout).
// Failures are logged once here (host + endpoint + error type only, never the
// query string) so a dead upstream is greppable instead of silently null.
// It also THROWS (rather than returning null) on failure so getOrFetch does not
// negative-cache a transient outage for the full quote TTL — same discipline as
// fetchDailySeries in lib/analysis/technical-indicators.ts.
async function fetchJson(url: string): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error: any) {
    throw failed(url, error?.name === "TimeoutError" ? "timeout" : "network", error);
  }

  if (!res.ok) {
    throw failed(url, "http-status", new Error(`NSE India responded ${res.status}`));
  }

  try {
    const json = await res.json();
    recordSuccess();
    return json;
  } catch (error: any) {
    throw failed(url, "parse", error);
  }
}

// One log line + one circuit-breaker tick per failure, whatever the stage.
function failed(url: string, stage: string, error: any): Error {
  console.error(
    `[NSE] fetch-failed ${describeUrl(url)} stage=${stage} errorType=${error?.name || "Error"} error=${String(error?.message || error).replace(/\s+/g, " ").slice(0, 120)}`
  );
  recordFailure();
  return error instanceof Error ? error : new Error(String(error));
}

function describeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `host=${parsed.host} endpoint=${parsed.pathname}`;
  } catch {
    return `host=unknown endpoint=unknown`;
  }
}

// The API is untyped JSON: `exchange` arrives as a plain string and may be
// absent, so normalize it rather than trusting the IndianExchange cast.
function normalizeExchange(value: any): IndianExchange {
  return String(value || "").toUpperCase() === "BSE" ? "BSE" : "NSE";
}

function mapQuote(rawSymbol: any, rawExchange: any, data: any): IndianStockQuote | null {
  if (!data) return null;

  // Without a symbol the record is unusable (ticker would render as
  // "undefined.NS"), and without a numeric price it is not a quote.
  const symbol = typeof rawSymbol === "string" && rawSymbol ? rawSymbol : null;
  if (!symbol) return null;
  if (!Number.isFinite(Number(data.last_price))) return null;

  const exchange = normalizeExchange(rawExchange);

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

  if (!isProviderAvailable()) return null;

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const url = `${NSE_INDIA_BASE_URL}/stock?symbol=${encodeURIComponent(symbol)}&res=num`;
        const json = await fetchJson(url);
        if (json?.status !== "success" || !json?.data) {
          throw new Error(`NSE India returned no quote payload for ${symbol}`);
        }

        // The single-stock response nests the fields under `data` and carries
        // symbol/exchange at the top level; fall back to the requested symbol
        // when the payload omits the echo.
        return mapQuote(json.symbol ?? symbol, json.exchange ?? json.data?.exchange, json.data);
      },
      getTTL("finnhubQuote"),
      true
    );
  } catch {
    return null;
  }
}

export async function getIndianStockQuotes(symbols: string[]): Promise<IndianStockQuote[]> {
  // De-duplicate and sort so ["A","B"] and ["B","A","A"] share one cache entry
  // instead of thrashing the cache with permutations of the same basket.
  const batch = Array.from(new Set(symbols.map((s) => s.trim()).filter(Boolean)))
    .sort()
    .slice(0, 25);
  if (batch.length === 0) return [];

  const cacheKey = getCacheKey("nse_india_quote_list", { symbols: batch.join(",") });

  if (!isProviderAvailable()) return [];

  try {
    const result = await getOrFetch(
      cacheKey,
      async () => {
        const url = `${NSE_INDIA_BASE_URL}/stock/list?symbols=${encodeURIComponent(batch.join(","))}&res=num`;
        const json = await fetchJson(url);
        if (json?.status !== "success" || !Array.isArray(json?.stocks)) {
          throw new Error("NSE India returned no stock list payload");
        }

        return json.stocks
          .map((s: any) => mapQuote(s.symbol, s.exchange, s))
          .filter(Boolean) as IndianStockQuote[];
      },
      getTTL("finnhubQuote"),
      true
    );

    return result || [];
  } catch {
    return [];
  }
}

export interface IndianStockSearchResult {
  symbol: string;
  companyName: string;
}

export async function searchIndianStocks(query: string): Promise<IndianStockSearchResult[]> {
  const cacheKey = getCacheKey("nse_india_search", { query });

  if (!isProviderAvailable()) return [];

  try {
    const result = await getOrFetch(
      cacheKey,
      async () => {
        const url = `${NSE_INDIA_BASE_URL}/search?q=${encodeURIComponent(query)}`;
        const json = await fetchJson(url);
        if (json?.status !== "success" || !Array.isArray(json?.results)) {
          throw new Error("NSE India returned no search payload");
        }

        return json.results.map((r: any) => ({
          symbol: r.symbol,
          companyName: r.company_name,
        })) as IndianStockSearchResult[];
      },
      getTTL("finnhubProfile"),
      true
    );

    return result || [];
  } catch {
    return [];
  }
}

// Bare NSE tickers (no dot suffix) are the common case for Indian equities
// mentioned in chat queries, so a suffix-only test left this provider dead for
// the chat path (lib/chat/intent.ts emits bare symbols like "RELIANCE").
// Only NSE-exclusive names are listed: symbols with a US ADR under the same
// code (e.g. INFY) must keep routing to the US providers to avoid mixing
// INR and USD prices.
const BARE_NSE_TICKERS = new Set([
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "ICICIBANK",
  "SBIN",
  "WIPRO",
  "AXISBANK",
  "KOTAKBANK",
  "BHARTIARTL",
  "ITC",
  "LT",
  "MARUTI",
  "TATAMOTORS",
  "TATASTEEL",
  "ASIANPAINT",
  "BAJFINANCE",
  "HINDUNILVR",
  "SUNPHARMA",
  "TITAN",
  "ULTRACEMCO",
]);

export function isLikelyIndianTicker(symbol: string): boolean {
  if (/\.(NS|BO)$/i.test(symbol)) return true;
  return BARE_NSE_TICKERS.has(symbol.trim().toUpperCase());
}
