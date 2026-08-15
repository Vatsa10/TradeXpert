// India equity market data source hitting NSE's and BSE's own public JSON
// endpoints directly — free, zero-auth, and therefore the PUBLIC default for
// Indian tickers (the Kite provider in lib/data/providers/kite.ts is
// personal-use-only and stays behind isKiteAvailable()).
//
// Follows the "cache -> primary -> free fallback -> explicit null, never
// fabricate" data-cascade discipline used elsewhere in lib/data/providers.
//
// NSE etiquette baked in here, because these are somebody else's servers:
//   - one lazy cookie bootstrap per process (NSE 401s any cold client),
//   - a global minimum gap between requests (no bursts),
//   - a browser-shaped User-Agent + Referer (NSE only checks it is an
//     nseindia.com page, so the Referer is static),
//   - 15-30s quote caching plus single-flight de-duplication via getOrFetch.
//
// NSE_INDIA_API_BASE_URL is still honoured (a mirror/proxy in front of the same
// route shapes) but is now OPTIONAL: with nothing configured we talk to
// www.nseindia.com directly, so isNSEProviderConfigured() is true by default.

import { getCacheKey, getOrFetch, getTTL } from "@/lib/chat/cache";
import type { OHLCV } from "@/lib/analysis/technical-indicators";

const NSE_BASE_URL = (process.env.NSE_INDIA_API_BASE_URL || "https://www.nseindia.com/api").replace(
  /\/+$/,
  ""
);
// Must be a real HTML page, and the same one the Referer claims: the bare
// https://www.nseindia.com/ root itself answers 403 to a cold client, so
// priming from it yields no cookies at all.
const NSE_PRIME_URL = "https://www.nseindia.com/get-quotes/equity?symbol=HDFCBANK";
const BSE_API_URL = "https://api.bseindia.com/BseIndiaAPI/api";

const TIMEOUT_MS = 8000;
// NSE blocks bursty clients outright, and it is the only free source of this
// data — ~6 rps is well inside what a browser session generates.
const MIN_REQUEST_GAP_MS = 160;
// Cookies rot; NSE hands out a fresh session happily, so re-prime periodically
// rather than waiting for the 401 that costs a wasted request.
const COOKIE_TTL_MS = 10 * 60 * 1000;

const NSE_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/118.0",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.5",
  Referer: "https://www.nseindia.com/get-quotes/equity?symbol=HDFCBANK",
};

const BSE_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:138.0) Gecko/20100101 Firefox/138.0",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.5",
  Origin: "https://www.bseindia.com",
  Referer: "https://www.bseindia.com/",
};

// Circuit breaker: once the upstream has failed 3 times in a row it is almost
// certainly down (or has blocked us), so stop paying the timeout on every
// subsequent call until the cooldown elapses. Module-level state is per server
// instance, which is the right granularity — the outage is per host.
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 10 * 60 * 1000;

let consecutiveFailures = 0;
let circuitOpenedAt = 0;

function isProviderAvailable(): boolean {
  if (!NSE_BASE_URL) return false;

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

// Lets callers explain a miss without paying a request. The direct NSE
// endpoints need no key, so the public provider is always "configured".
export function isNSEProviderConfigured(): boolean {
  return NSE_BASE_URL.length > 0;
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

export interface IndianStockSearchResult {
  symbol: string;
  companyName: string;
}

// ---------------------------------------------------------------- symbols

export interface ParsedIndianSymbol {
  symbol: string;
  exchange: IndianExchange;
  ticker: string;
}

// symbol may be bare ("RELIANCE"), or suffixed (".NS" / ".BO"). Bare defaults
// to NSE, which is where the free quote/history endpoints live.
export function parseIndianSymbol(input: string): ParsedIndianSymbol {
  const raw = String(input || "").trim().toUpperCase();
  const suffix = /\.(NS|BO)$/.exec(raw);
  const exchange: IndianExchange = suffix?.[1] === "BO" ? "BSE" : "NSE";
  const symbol = raw.replace(/\.(NS|BO)$/, "");

  return { symbol, exchange, ticker: `${symbol}.${exchange === "NSE" ? "NS" : "BO"}` };
}

function num(value: any): number {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function optionalNum(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

// NSE's historical endpoint speaks DD-MM-YYYY.
export function formatDateDMY(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${date.getUTCFullYear()}`;
}

// ---------------------------------------------------------------- transport

let cookieHeader = "";
let cookiePrimedAt = 0;
let priming: Promise<void> | null = null;
let lastRequestAt = 0;
let requestGate: Promise<void> = Promise.resolve();

// Serialises every outbound request through a single chain so concurrent
// callers space themselves out instead of all firing at once.
function throttle(): Promise<void> {
  const wait = requestGate.then(async () => {
    const gap = Date.now() - lastRequestAt;
    if (gap < MIN_REQUEST_GAP_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_GAP_MS - gap));
    }
    lastRequestAt = Date.now();
  });

  requestGate = wait.catch(() => {});
  return wait;
}

function mergeSetCookie(res: Response) {
  // Node/undici exposes getSetCookie(); fall back to the folded header.
  const anyHeaders = res.headers as any;
  const list: string[] =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie") as string]
        : [];
  if (list.length === 0) return;

  const jar = new Map<string, string>();
  for (const pair of cookieHeader.split("; ").filter(Boolean)) {
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  for (const entry of list) {
    const [pair] = entry.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }

  cookieHeader = Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

// NSE 401s any client without a session cookie, so warm one lazily — once per
// process, shared by every concurrent caller (single-flight), and never fatal:
// a failed prime still lets the real request run and report its own error.
async function primeCookies(force = false): Promise<void> {
  if (!force && cookieHeader && Date.now() - cookiePrimedAt < COOKIE_TTL_MS) return;
  if (priming) return priming;

  priming = (async () => {
    try {
      await throttle();
      const res = await fetch(NSE_PRIME_URL, {
        headers: NSE_HEADERS,
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      mergeSetCookie(res);
      cookiePrimedAt = Date.now();
    } catch (error: any) {
      console.error(`[NSE] cookie-prime-failed errorType=${error?.name || "Error"}`);
    } finally {
      priming = null;
    }
  })();

  return priming;
}

// THROWS (rather than returning null) on failure so getOrFetch does not
// negative-cache a transient outage for the full quote TTL — same discipline as
// fetchDailySeries in lib/analysis/technical-indicators.ts. Failures are logged
// once here (host + endpoint + error type only, never the query string) so a
// dead upstream is greppable instead of silently null.
async function fetchNseJson(url: string, retryOnBlock = true): Promise<any> {
  await primeCookies();
  await throttle();

  let res: Response;
  try {
    res = await fetch(url, {
      headers: cookieHeader ? { ...NSE_HEADERS, Cookie: cookieHeader } : NSE_HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error: any) {
    throw failed(url, error?.name === "TimeoutError" ? "timeout" : "network", error);
  }

  // 401/403 is NSE's block signal and usually just means a stale cookie:
  // re-prime once and retry before declaring the host down.
  if ((res.status === 401 || res.status === 403) && retryOnBlock) {
    console.error(`[NSE] session-expired ${describeUrl(url)} status=${res.status}; re-priming`);
    await primeCookies(true);
    return fetchNseJson(url, false);
  }

  if (!res.ok) {
    // 403/404 means THIS route is blocked or retired, not that nseindia.com is
    // down — NSE edge-blocks individual /api paths while the rest keep serving.
    // Ticking the circuit here would let one dead endpoint disable every
    // working one for the whole cooldown, so only real outages count.
    const routeGone = res.status === 403 || res.status === 404;
    throw failed(url, "http-status", new Error(`NSE responded ${res.status}`), !routeGone);
  }

  mergeSetCookie(res);

  try {
    const json = await res.json();
    recordSuccess();
    return json;
  } catch (error: any) {
    throw failed(url, "parse", error);
  }
}

async function fetchBseText(url: string): Promise<string> {
  await throttle();

  let res: Response;
  try {
    res = await fetch(url, { headers: BSE_HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error: any) {
    throw failed(url, error?.name === "TimeoutError" ? "timeout" : "network", error);
  }

  if (!res.ok) throw failed(url, "http-status", new Error(`BSE responded ${res.status}`));

  const text = await res.text();
  recordSuccess();
  return text;
}

// One log line per failure, whatever the stage, plus a circuit-breaker tick
// unless the caller says this failure is route-scoped rather than host-scoped.
function failed(url: string, stage: string, error: any, tripsCircuit = true): Error {
  console.error(
    `[NSE] fetch-failed ${describeUrl(url)} stage=${stage} errorType=${error?.name || "Error"} error=${String(error?.message || error).replace(/\s+/g, " ").slice(0, 120)}`
  );
  if (tripsCircuit) recordFailure();
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

// ---------------------------------------------------------------- mappers
// Pure functions over raw payloads: everything below is unit-testable without
// touching the network (see scripts/test-analysis.ts).

// GET /api/quote-equity?symbol=X, optionally merged with the same call's
// &section=trade_info response — which is the ONLY place NSE exposes volume.
export function mapNseQuote(raw: any, tradeInfo?: any): IndianStockQuote | null {
  const price = raw?.priceInfo;
  const symbol = typeof raw?.info?.symbol === "string" && raw.info.symbol ? raw.info.symbol : null;
  if (!price || !symbol) return null;
  const lastPrice = optionalNum(price.lastPrice);
  if (lastPrice === null) return null;

  const dp = tradeInfo?.securityWiseDP;
  const tradeVolume = tradeInfo?.marketDeptOrderBook?.tradeInfo;
  // NSE reports total market cap in lakhs on the trade_info section.
  const marketCapLakhs = optionalNum(tradeVolume?.totalMarketCap);

  return {
    symbol,
    exchange: "NSE",
    ticker: `${symbol}.NS`,
    companyName: raw?.info?.companyName || symbol,
    lastPrice,
    change: num(price.change),
    percentChange: num(price.pChange),
    previousClose: num(price.previousClose),
    open: num(price.open),
    dayHigh: num(price.intraDayHighLow?.max),
    dayLow: num(price.intraDayHighLow?.min),
    yearHigh: num(price.weekHighLow?.max),
    yearLow: num(price.weekHighLow?.min),
    volume: num(tradeVolume?.totalTradedVolume ?? dp?.quantityTraded),
    marketCap: marketCapLakhs === null ? null : marketCapLakhs * 100000,
    peRatio: optionalNum(raw?.metadata?.pdSymbolPe),
    dividendYield: null,
    sector: raw?.industryInfo?.macro ?? raw?.metadata?.industry ?? null,
    industry: raw?.industryInfo?.industry ?? raw?.metadata?.industry ?? null,
    lastUpdate: raw?.metadata?.lastUpdateTime || new Date().toISOString(),
  };
}

// GET {bseApi}/getScripHeaderData/w?scripcode=NNNNNN — every numeric arrives as
// a string, and there is no volume/52w data on this payload. The live response
// is { CurrRate, Cmpname, Header, CompResp }: prices sit on Header, the scrip
// code and company name only on Cmpname, so both are read.
export function mapBseQuote(raw: any, fallbackSymbol = ""): IndianStockQuote | null {
  const header = raw?.Header ?? raw;
  if (!header) return null;

  const last = optionalNum(header.LTP ?? raw?.CurrRate?.LTP);
  if (last === null) return null;

  const symbol = String(
    header.ScripCode || raw?.Cmpname?.EquityScrips || fallbackSymbol || ""
  ).trim();
  if (!symbol) return null;

  const previousClose = num(header.PrevClose);
  const change = previousClose ? last - previousClose : 0;

  return {
    symbol,
    exchange: "BSE",
    ticker: `${symbol}.BO`,
    companyName: header.CompanyName || raw?.Cmpname?.FullN || symbol,
    lastPrice: last,
    change,
    percentChange: previousClose ? (change / previousClose) * 100 : 0,
    previousClose,
    open: num(header.Open),
    dayHigh: num(header.High),
    dayLow: num(header.Low),
    yearHigh: num(raw?.Fifty2WkHigh_adj),
    yearLow: num(raw?.Fifty2WkLow_adj),
    volume: num(header.TotalTradedQty ?? header.Volume),
    marketCap: optionalNum(header.MktCapFull),
    peRatio: null,
    dividendYield: null,
    sector: null,
    industry: null,
    lastUpdate: new Date().toISOString(),
  };
}

// GET /api/master-quote → a bare string[] of every tradable NSE symbol. This
// is the search source now: /api/search/autocomplete was retired (it 404s), and
// this list is the only free, zero-auth symbol index NSE still serves. It
// carries no company names, so companyName mirrors the symbol — callers already
// treat it as a display fallback.
//
// Ranking is prefix-first then substring, so "REL" puts RELIANCE above
// SWARAJENG rather than sorting alphabetically into noise.
export function mapNseSymbolList(raw: any, query: string, limit = 20): IndianStockSearchResult[] {
  const q = String(query || "").trim().toUpperCase();
  if (!q) return [];

  const symbols: string[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.symbols)
        ? raw.symbols
        : [];

  return symbols
    .map((s) => String(s || "").toUpperCase())
    .filter((s) => s.includes(q))
    .sort((a, b) => {
      const rank = Number(b.startsWith(q)) - Number(a.startsWith(q));
      return rank !== 0 ? rank : a.length - b.length || a.localeCompare(b);
    })
    .slice(0, limit)
    .map((symbol) => ({ symbol, companyName: symbol }));
}

// GET /api/search/autocomplete?q= — the payload nests the tradable name under
// `symbol_info`, with the display string in `symbol`. RETIRED upstream (404 as
// of Aug 2026); kept because mirrors configured via NSE_INDIA_API_BASE_URL may
// still serve this shape, and searchIndianStocks falls back to it.
export function mapNseSearchResults(raw: any): IndianStockSearchResult[] {
  const rows = Array.isArray(raw?.symbols) ? raw.symbols : [];

  return rows
    .filter((r: any) => !r?.result_type || r.result_type === "symbol")
    .map((r: any) => ({
      symbol: String(r?.symbol || "").toUpperCase(),
      companyName: String(r?.symbol_info || r?.symbol || ""),
    }))
    .filter((r: IndianStockSearchResult) => r.symbol.length > 0);
}

// GET /api/historicalOR/generateSecurityWiseHistoricalData
// Rows are returned newest-first with NSE's CH_* column names. Two other
// spellings exist in the wild and are accepted rather than silently dropping
// every row: the NextApi/GetQuoteApi mirror returns camelCase (chClosingPrice),
// and older proxies return bare lower-case keys.
//
// mTIMESTAMP is preferred over CH_TIMESTAMP deliberately. CH_TIMESTAMP is an
// ISO instant at IST midnight ("2026-07-30T18:30:00.000Z" for the 31-Jul bar),
// so slicing its UTC date shifts every candle back a day; mTIMESTAMP
// ("31-Jul-2026") is the trading date NSE actually means.
export function mapNseHistorical(raw: any): OHLCV[] {
  const rows: any[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

  const mapped = rows
    .map((r: any) => {
      const rawDate = r?.mTIMESTAMP ?? r?.CH_TIMESTAMP ?? r?.chTimestamp ?? r?.TIMESTAMP ?? r?.date;
      const date = normalizeHistoricalDate(rawDate);
      const close = optionalNum(r?.CH_CLOSING_PRICE ?? r?.chClosingPrice ?? r?.close ?? r?.CLOSE);
      if (!date || close === null) return null;

      return {
        date,
        open: num(r?.CH_OPENING_PRICE ?? r?.chOpeningPrice ?? r?.open ?? r?.OPEN),
        high: num(r?.CH_TRADE_HIGH_PRICE ?? r?.chTradeHighPrice ?? r?.high ?? r?.HIGH),
        low: num(r?.CH_TRADE_LOW_PRICE ?? r?.chTradeLowPrice ?? r?.low ?? r?.LOW),
        close,
        volume: num(r?.CH_TOT_TRADED_QTY ?? r?.chTotTradedQty ?? r?.volume ?? r?.TOTTRDQTY),
      } as OHLCV;
    })
    .filter(Boolean) as OHLCV[];

  // Ascending by date is what computeIndicatorsFromSeries expects.
  return mapped.sort((a, b) => a.date.localeCompare(b.date));
}

// NSE mixes ISO timestamps and "DD-MMM-YYYY" across endpoints; OHLCV.date is
// always YYYY-MM-DD.
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function normalizeHistoricalDate(value: any): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const dmy = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/.exec(raw);
  if (dmy) {
    const month = MONTHS.indexOf(dmy[2].toUpperCase());
    if (month < 0) return null;
    return `${dmy[3]}-${String(month + 1).padStart(2, "0")}-${dmy[1]}`;
  }

  const numeric = /^(\d{2})-(\d{2})-(\d{4})$/.exec(raw);
  if (numeric) return `${numeric[3]}-${numeric[2]}-${numeric[1]}`;

  return null;
}

export interface IndianIndexQuote {
  index: string;
  last: number;
  change: number;
  percentChange: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  yearHigh: number | null;
  yearLow: number | null;
}

// GET /api/allIndices → { data: [{ index, last, open, high, low, ... }] }
export function mapNseIndices(raw: any): IndianIndexQuote[] {
  const rows: any[] = Array.isArray(raw?.data) ? raw.data : [];

  return rows
    .map((r: any) => {
      const name = String(r?.index || r?.indexSymbol || "").trim();
      // Number(null) is 0, so guard on optionalNum rather than Number.isFinite.
      const last = optionalNum(r?.last);
      if (!name || last === null) return null;

      return {
        index: name,
        last,
        change: num(r.variation ?? r.change),
        percentChange: num(r.percentChange ?? r.pChange),
        open: num(r.open),
        dayHigh: num(r.high ?? r.dayHigh),
        dayLow: num(r.low ?? r.dayLow),
        previousClose: num(r.previousClose),
        yearHigh: optionalNum(r.yearHigh),
        yearLow: optionalNum(r.yearLow),
      } as IndianIndexQuote;
    })
    .filter(Boolean) as IndianIndexQuote[];
}

// ---------------------------------------------------------------- fetchers

async function fetchNseQuote(symbol: string): Promise<IndianStockQuote | null> {
  const encoded = encodeURIComponent(symbol);
  const raw = await fetchNseJson(`${NSE_BASE_URL}/quote-equity?symbol=${encoded}`);

  // trade_info is a second round trip purely for volume/market cap, so a
  // failure there must not sink the quote we already have.
  let tradeInfo: any = null;
  try {
    tradeInfo = await fetchNseJson(`${NSE_BASE_URL}/quote-equity?symbol=${encoded}&section=trade_info`);
  } catch {
    tradeInfo = null;
  }

  const quote = mapNseQuote(raw, tradeInfo);
  if (!quote) throw new Error(`NSE returned no quote payload for ${symbol}`);
  return quote;
}

// BSE has no symbol-keyed quote route — everything is by scrip code — and its
// search returns HTML, so resolve the code first and cache it for a long time
// (scrip codes are permanent).
async function resolveBseScripCode(symbol: string): Promise<string | null> {
  if (/^\d{6}$/.test(symbol)) return symbol;

  return getOrFetch(
    getCacheKey("bse_scrip_code", { symbol }),
    async () => {
      const html = await fetchBseText(
        `${BSE_API_URL}/PeerSmartSearch/w?Type=SS&text=${encodeURIComponent(symbol)}`
      );
      const code = extractBseScripCode(html, symbol);
      if (!code) throw new Error(`BSE search returned no scrip code for ${symbol}`);
      return code;
    },
    getTTL("finnhubProfile"),
    true
  ).catch(() => null);
}

// The PeerSmartSearch response is an HTML fragment shaped like
// `<span>SYMBOL   INE...<strong>500325</strong></span>`; the six-digit code in
// the row whose text mentions the symbol is the one we want.
export function extractBseScripCode(html: string, symbol: string): string | null {
  const upper = String(symbol || "").toUpperCase();
  const rows = String(html || "").split(/<\/li>|<br\s*\/?>/i);

  for (const row of rows) {
    const text = row.replace(/<[^>]*>/g, " ");
    if (upper && !text.toUpperCase().includes(upper)) continue;
    const code = /\b(\d{6})\b/.exec(text);
    if (code) return code[1];
  }

  const anyCode = /\b(\d{6})\b/.exec(String(html || "").replace(/<[^>]*>/g, " "));
  return anyCode ? anyCode[1] : null;
}

async function fetchBseQuote(symbol: string): Promise<IndianStockQuote | null> {
  const code = await resolveBseScripCode(symbol);
  if (!code) throw new Error(`BSE scrip code unresolved for ${symbol}`);

  const text = await fetchBseText(`${BSE_API_URL}/getScripHeaderData/w?scripcode=${code}`);
  const quote = mapBseQuote(JSON.parse(text), symbol);
  if (!quote) throw new Error(`BSE returned no quote payload for ${symbol}`);
  return quote;
}

// NSE edge-blocks /api/quote-equity (403 Access Denied on the path itself, for
// any client — a cookie re-prime does not help), so the quote cascade for an
// NSE symbol is: NSE first, because it is the right exchange and the block may
// lift, then BSE for the same company. Both are free and zero-auth.
//
// The BSE fallback returns exchange:"BSE"/ticker:".BO" rather than pretending
// to be an NSE print: the two venues quote the same stock a few paise apart and
// mislabelling which one produced the number is the kind of quiet lie the
// data-cascade rule exists to prevent.
// Track whether NSE's quote endpoint has recovered. While it is known-dead we
// go STRAIGHT to BSE: the chat queue gives the whole price task a small budget,
// and burning ~2s on a guaranteed 403 + cookie re-prime made every Indian
// quote time out downstream even though the BSE path works fine.
let nseQuoteDeadUntil = Date.now() + 0; // probe on first call after boot
const NSE_QUOTE_RETRY_MS = 30 * 60 * 1000; // re-probe the NSE path every 30min

async function fetchIndianQuote(symbol: string): Promise<IndianStockQuote | null> {
  if (Date.now() < nseQuoteDeadUntil) {
    return fetchBseQuote(symbol);
  }
  try {
    return await fetchNseQuote(symbol);
  } catch {
    nseQuoteDeadUntil = Date.now() + NSE_QUOTE_RETRY_MS;
    return fetchBseQuote(symbol);
  }
}

// ---------------------------------------------------------------- public API

export async function getIndianStockQuote(symbol: string): Promise<IndianStockQuote | null> {
  const parsed = parseIndianSymbol(symbol);
  if (!parsed.symbol) return null;

  const cacheKey = getCacheKey("nse_india_quote", { symbol: parsed.ticker });

  if (!isProviderAvailable()) return null;

  try {
    return await getOrFetch(
      cacheKey,
      () => (parsed.exchange === "BSE" ? fetchBseQuote(parsed.symbol) : fetchIndianQuote(parsed.symbol)),
      // 30s — NSE's own site polls no faster, and it collapses the burst a
      // single chat turn makes into one upstream hit.
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

  if (!isProviderAvailable()) return [];

  // NSE has no multi-symbol quote route, so this fans out one request per
  // symbol — sequentially, because the throttle serialises them anyway and a
  // Promise.all would only queue 25 sockets to be polite about.
  const quotes: IndianStockQuote[] = [];
  for (const symbol of batch) {
    const quote = await getIndianStockQuote(symbol);
    if (quote) quotes.push(quote);
  }

  return quotes;
}

export async function searchIndianStocks(query: string): Promise<IndianStockSearchResult[]> {
  const q = String(query || "").trim();
  if (!q) return [];

  const cacheKey = getCacheKey("nse_india_search", { query: q.toUpperCase() });

  if (!isProviderAvailable()) return [];

  try {
    const result = await getOrFetch(
      cacheKey,
      async () => {
        // The symbol master is one payload for every query, so cache it under
        // its own long-lived key and filter locally instead of hitting NSE once
        // per keystroke.
        const master = await getOrFetch(
          getCacheKey("nse_india_symbol_master", {}),
          () => fetchNseJson(`${NSE_BASE_URL}/master-quote`),
          getTTL("finnhubProfile"),
          true
        );

        const results = mapNseSymbolList(master, q);
        if (results.length > 0) return results;

        // A configured mirror may still serve the retired autocomplete shape.
        const legacy = mapNseSearchResults(
          await fetchNseJson(`${NSE_BASE_URL}/search/autocomplete?q=${encodeURIComponent(q)}`)
        );
        if (legacy.length === 0) throw new Error(`NSE returned no search payload for ${q}`);
        return legacy;
      },
      getTTL("search"),
      true
    );

    return result || [];
  } catch {
    return [];
  }
}

// Daily OHLCV for the technical-indicator stack. Shape matches OHLCV in
// lib/analysis/technical-indicators.ts so the rows drop straight into
// computeIndicatorsFromSeries.
export async function getIndianHistorical(symbol: string, days = 180): Promise<OHLCV[]> {
  const parsed = parseIndianSymbol(symbol);
  if (!parsed.symbol) return [];

  const window = Math.max(1, Math.min(Math.round(days), 365));
  const cacheKey = getCacheKey("nse_india_historical", { symbol: parsed.symbol, days: window });

  if (!isProviderAvailable()) return [];

  try {
    const result = await getOrFetch(
      cacheKey,
      async () => {
        const to = new Date();
        const rows: OHLCV[] = [];

        // NSE caps this endpoint at 100 days per call, so walk backwards in
        // chunks instead of asking for a range it will silently truncate.
        for (let offset = 0; offset < window; offset += 100) {
          const chunkTo = new Date(to.getTime() - offset * 86400000);
          const chunkDays = Math.min(100, window - offset);
          const chunkFrom = new Date(chunkTo.getTime() - (chunkDays - 1) * 86400000);

          // historicalOR is the route NSE's own "Historical Data" tab calls; the
          // NextApi/GetQuoteApi mirror also answers but returns camelCase keys
          // and no `data` envelope, so prefer the canonical one.
          const url =
            `${NSE_BASE_URL}/historicalOR/generateSecurityWiseHistoricalData` +
            `?symbol=${encodeURIComponent(parsed.symbol)}&series=EQ&type=priceVolumeDeliverable` +
            `&from=${formatDateDMY(chunkFrom)}&to=${formatDateDMY(chunkTo)}`;

          rows.push(...mapNseHistorical(await fetchNseJson(url)));
        }

        if (rows.length === 0) throw new Error(`NSE returned no history for ${parsed.symbol}`);

        // Chunks can overlap at their boundaries; de-duplicate by date.
        const byDate = new Map(rows.map((r) => [r.date, r]));
        return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
      },
      // Daily bars only change once a day, but an intraday refresh keeps the
      // last (still-forming) candle honest.
      getTTL("kiteHistorical"),
      true
    );

    return result || [];
  } catch {
    return [];
  }
}

// Whole-market index snapshot (NIFTY 50, BANK NIFTY, sectorals, ...).
export async function getIndianIndexQuotes(): Promise<IndianIndexQuote[]> {
  if (!isProviderAvailable()) return [];

  try {
    const result = await getOrFetch(
      getCacheKey("nse_india_indices", {}),
      async () => {
        const indices = mapNseIndices(await fetchNseJson(`${NSE_BASE_URL}/allIndices`));
        if (indices.length === 0) throw new Error("NSE returned no index payload");
        return indices;
      },
      getTTL("finnhubQuote"),
      true
    );

    return result || [];
  } catch {
    return [];
  }
}

export async function getIndianIndexQuote(index: string): Promise<IndianIndexQuote | null> {
  const wanted = String(index || "").trim().toUpperCase();
  if (!wanted) return null;

  const all = await getIndianIndexQuotes();
  return all.find((i) => i.index.toUpperCase() === wanted) || null;
}

// ---------------------------------------------------------------- routing

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
