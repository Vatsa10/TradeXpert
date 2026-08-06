// Zerodha Kite Connect — the PRIMARY India equity data source.
//
// Replaces lib/data/providers/nse-india.ts as the first stop for Indian
// tickers: that provider's host is dead unless NSE_INDIA_API_BASE_URL is set,
// so it now serves only as a fallback behind this one.
//
// PAPER TRADING ONLY: this module is read-only market/portfolio data. It never
// calls placeOrder (or any order-mutating endpoint) and must not grow one.
//
// Every function degrades gracefully when Kite is unconfigured or the user has
// not linked their Zerodha account: getKiteForUser() returns null and callers
// get null/[] rather than an exception, so the aggregator simply falls through.

import { getCacheKey, getOrFetch, getTTL } from "@/lib/chat/cache";
import { getKiteForUser, isKiteConfigured } from "@/lib/kite/client";
import type { OHLCV } from "@/lib/analysis/technical-indicators";

export type KiteExchange = "NSE" | "BSE";

// Same shape the chat aggregator's quote objects use (see getFinnhubQuote), so
// this can be dropped into the Indian branch without any remapping.
export interface KiteQuote {
  current: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

// ------------------------------------------------------------ symbol mapping

// Chat/intent emits "RELIANCE", the portfolio models store "RELIANCE.NS", and
// Kite wants "NSE:RELIANCE". Bare symbols default to NSE (the Indian equity
// default across this codebase — see nse-india.ts).
export function toKiteInstrument(symbol: string): string {
  const trimmed = (symbol || "").trim().toUpperCase();

  // Already in Kite form ("NSE:RELIANCE") — pass through untouched.
  if (trimmed.includes(":")) return trimmed;

  if (trimmed.endsWith(".NS")) return `NSE:${trimmed.slice(0, -3)}`;
  if (trimmed.endsWith(".BO")) return `BSE:${trimmed.slice(0, -3)}`;

  return `NSE:${trimmed}`;
}

export function kiteExchangeOf(symbol: string): KiteExchange {
  return toKiteInstrument(symbol).startsWith("BSE:") ? "BSE" : "NSE";
}

export function kiteTradingSymbol(symbol: string): string {
  const instrument = toKiteInstrument(symbol);
  return instrument.slice(instrument.indexOf(":") + 1);
}

// Lets callers explain a miss ("Kite not configured") without paying a request.
export function isKiteAvailable(): boolean {
  return isKiteConfigured();
}

// ------------------------------------------------------------------- quotes

function toNumber(value: any): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Exported for tests: the raw getQuote payload -> aggregator quote shape.
// Kite gives net_change but not a percent, and OHLC-only responses give
// neither, so both are derived from the previous close when absent.
export function mapKiteQuote(raw: any): KiteQuote | null {
  if (!raw) return null;

  const current = toNumber(raw.last_price);
  if (current === null || current <= 0) return null;

  const ohlc = raw.ohlc || {};
  const prevClose = toNumber(ohlc.close) ?? current;
  const change = toNumber(raw.net_change) ?? current - prevClose;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

  return {
    current,
    change,
    changePercent,
    high: toNumber(ohlc.high) ?? current,
    low: toNumber(ohlc.low) ?? current,
    open: toNumber(ohlc.open) ?? current,
    prevClose,
  };
}

// symbol may be bare ("RELIANCE"), suffixed (".NS"/".BO") or already
// exchange-qualified ("NSE:RELIANCE").
export async function getKiteQuote(
  userEmail: string | undefined,
  symbol: string
): Promise<KiteQuote | null> {
  if (!userEmail || !isKiteConfigured()) return null;

  const instrument = toKiteInstrument(symbol);
  const cacheKey = getCacheKey("kite_quote", { userEmail, instrument });

  try {
    // NOTE: the fetcher THROWS rather than returning null on failure, so
    // getOrFetch does not negative-cache a transient Kite outage for the full
    // TTL — same discipline as fetchDailySeries in technical-indicators.ts.
    return await getOrFetch(
      cacheKey,
      async () => {
        const kc = await getKiteForUser(userEmail);
        if (!kc) throw new Error("Kite not connected for user");

        let quote: KiteQuote | null = null;

        try {
          const res = await kc.getQuote([instrument]);
          quote = mapKiteQuote(res?.[instrument]);
        } catch (error: any) {
          console.warn(
            `[Kite] getQuote failed instrument=${instrument} error=${String(error?.message || error).slice(0, 120)}`
          );
        }

        // getOHLC is the cheaper, more widely permitted endpoint — worth a
        // second try before declaring the symbol unavailable.
        if (!quote) {
          const res = await kc.getOHLC([instrument]);
          quote = mapKiteQuote(res?.[instrument]);
        }

        if (!quote) throw new Error(`Kite returned no quote for ${instrument}`);
        return quote;
      },
      getTTL("kiteQuote"),
      true
    );
  } catch (error: any) {
    console.warn(
      `[Kite] quote-miss instrument=${instrument} error=${String(error?.message || error).slice(0, 120)}`
    );
    return null;
  }
}

// --------------------------------------------------------------- instruments

// tradingsymbol -> instrument_token, for the exchange's full equity list.
// getInstruments returns tens of thousands of rows and several MB of payload,
// so it is fetched at most once a day and reduced to a plain map immediately.
export function buildInstrumentTokenMap(instruments: any[]): Record<string, number> {
  const map: Record<string, number> = {};

  for (const row of instruments || []) {
    const tradingsymbol = typeof row?.tradingsymbol === "string" ? row.tradingsymbol.toUpperCase() : "";
    // instrument_token arrives as a string in the SDK's typings.
    const token = Number(row?.instrument_token);
    if (!tradingsymbol || !Number.isFinite(token) || token <= 0) continue;
    // Equities only — options/futures share tradingsymbol prefixes and would
    // otherwise shadow the cash-market row.
    if (row?.instrument_type && row.instrument_type !== "EQ") continue;
    if (map[tradingsymbol] === undefined) map[tradingsymbol] = token;
  }

  return map;
}

async function getInstrumentTokenMap(
  userEmail: string,
  exchange: KiteExchange
): Promise<Record<string, number> | null> {
  const cacheKey = getCacheKey("kite_instruments", { exchange });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const kc = await getKiteForUser(userEmail);
        if (!kc) throw new Error("Kite not connected for user");

        // getInstruments takes a single exchange, not an array.
        const instruments = await kc.getInstruments(exchange);
        const map = buildInstrumentTokenMap(instruments);
        if (Object.keys(map).length === 0) {
          throw new Error(`Kite returned an empty ${exchange} instrument dump`);
        }
        return map;
      },
      getTTL("kiteInstruments"),
      true
    );
  } catch (error: any) {
    console.warn(
      `[Kite] instruments-miss exchange=${exchange} error=${String(error?.message || error).slice(0, 120)}`
    );
    return null;
  }
}

export async function getKiteInstrumentToken(
  userEmail: string | undefined,
  symbol: string
): Promise<number | null> {
  if (!userEmail || !isKiteConfigured()) return null;

  const map = await getInstrumentTokenMap(userEmail, kiteExchangeOf(symbol));
  if (!map) return null;

  return map[kiteTradingSymbol(symbol)] ?? null;
}

// ---------------------------------------------------------------- historical

// Exported for tests: Kite daily candles -> the OHLCV rows the indicator and
// optimizer modules consume, oldest-first, with malformed rows dropped so a
// single NaN close cannot poison EMA/RSI downstream.
export function mapKiteCandles(candles: any[]): OHLCV[] {
  return (candles || [])
    .map((c: any) => {
      const raw = c?.date;
      const date = raw instanceof Date ? raw : new Date(raw);
      return {
        date: Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10),
        open: Number(c?.open),
        high: Number(c?.high),
        low: Number(c?.low),
        close: Number(c?.close),
        volume: Number(c?.volume),
      };
    })
    .filter(
      (r) =>
        r.date.length === 10 &&
        Number.isFinite(r.close) &&
        Number.isFinite(r.high) &&
        Number.isFinite(r.low) &&
        Number.isFinite(r.open)
    )
    .map((r) => ({ ...r, volume: Number.isFinite(r.volume) ? r.volume : 0 }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function formatKiteDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getKiteHistorical(
  userEmail: string | undefined,
  symbol: string,
  days: number = 120
): Promise<OHLCV[] | null> {
  if (!userEmail || !isKiteConfigured()) return null;

  const instrument = toKiteInstrument(symbol);
  const window = Math.max(1, Math.floor(days));
  const cacheKey = getCacheKey("kite_historical", { instrument, days: window });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const token = await getKiteInstrumentToken(userEmail, symbol);
        if (token === null) {
          throw new Error(`No Kite instrument_token for ${instrument}`);
        }

        const kc = await getKiteForUser(userEmail);
        if (!kc) throw new Error("Kite not connected for user");

        const to = new Date();
        const from = new Date(to.getTime() - window * 24 * 60 * 60 * 1000);

        const candles = await kc.getHistoricalData(
          token,
          "day",
          formatKiteDate(from),
          formatKiteDate(to)
        );

        const rows = mapKiteCandles(candles);
        if (rows.length === 0) {
          throw new Error(`Kite returned no daily candles for ${instrument}`);
        }
        return rows;
      },
      getTTL("kiteHistorical"),
      true
    );
  } catch (error: any) {
    console.warn(
      `[Kite] historical-miss instrument=${instrument} days=${window} error=${String(error?.message || error).slice(0, 120)}`
    );
    return null;
  }
}

// ----------------------------------------------------------------- portfolio

export interface KiteHolding {
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  dayChange: number;
  dayChangePercentage: number;
}

export interface KitePosition {
  tradingsymbol: string;
  exchange: string;
  product: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  unrealised: number;
  realised: number;
}

export interface KiteMargins {
  equity: any | null;
  commodity: any | null;
}

async function withKite<T>(
  userEmail: string | undefined,
  label: string,
  fn: (kc: any) => Promise<T>,
  fallback: T
): Promise<T> {
  if (!userEmail || !isKiteConfigured()) return fallback;

  try {
    const kc = await getKiteForUser(userEmail);
    if (!kc) return fallback;
    return await fn(kc);
  } catch (error: any) {
    console.warn(
      `[Kite] ${label}-miss error=${String(error?.message || error).slice(0, 120)}`
    );
    return fallback;
  }
}

export async function getKiteHoldings(userEmail: string | undefined): Promise<KiteHolding[]> {
  return await withKite<KiteHolding[]>(
    userEmail,
    "holdings",
    async (kc) => {
      const raw = await kc.getHoldings();
      return (raw || []).map((h: any) => ({
        tradingsymbol: String(h?.tradingsymbol || ""),
        exchange: String(h?.exchange || "NSE"),
        quantity: Number(h?.quantity) || 0,
        averagePrice: Number(h?.average_price) || 0,
        lastPrice: Number(h?.last_price) || 0,
        pnl: Number(h?.pnl) || 0,
        dayChange: Number(h?.day_change) || 0,
        dayChangePercentage: Number(h?.day_change_percentage) || 0,
      }));
    },
    []
  );
}

export async function getKitePositions(userEmail: string | undefined): Promise<KitePosition[]> {
  return await withKite<KitePosition[]>(
    userEmail,
    "positions",
    async (kc) => {
      const raw = await kc.getPositions();
      // `net` is the actionable book; `day` double-counts intraday legs.
      return (raw?.net || []).map((p: any) => ({
        tradingsymbol: String(p?.tradingsymbol || ""),
        exchange: String(p?.exchange || "NSE"),
        product: String(p?.product || ""),
        quantity: Number(p?.quantity) || 0,
        averagePrice: Number(p?.average_price) || 0,
        lastPrice: Number(p?.last_price) || 0,
        pnl: Number(p?.pnl) || 0,
        unrealised: Number(p?.unrealised) || 0,
        realised: Number(p?.realised) || 0,
      }));
    },
    []
  );
}

export async function getKiteMargins(userEmail: string | undefined): Promise<KiteMargins | null> {
  return await withKite<KiteMargins | null>(
    userEmail,
    "margins",
    async (kc) => {
      const raw = await kc.getMargins();
      return {
        equity: raw?.equity ?? null,
        commodity: raw?.commodity ?? null,
      };
    },
    null
  );
}
