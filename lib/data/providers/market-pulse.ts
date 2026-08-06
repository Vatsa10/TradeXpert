// Fast market-pulse screener: "what is moving right now" without downloading a
// single candle. Ported from intraday-stock-targets/trading_engine.py:206-255
// (screen_stocks_yfinance), which called yfinance's `yf.screen`. That helper is
// Python-only, but it is a thin wrapper over Yahoo Finance's public predefined
// screener endpoint, which we call directly here.
//
// Deliberately NOT ported: the donor's derived "technicals" (line 227,
// `rsi_est = 50 + chg_pct * 1.5`, plus the MACD/ATR/volatility values built from
// 50-day and 52-week averages). Those are invented numbers wearing the names of
// real indicators — a screener quote carries no series to compute them from.
// Real indicators live in lib/analysis/technical-indicators.ts and are computed
// from actual OHLCV. This provider returns only fields Yahoo actually reports.

import { getCacheKey, getOrFetch } from "@/lib/chat/cache";

const YAHOO_SCREENER_URL =
  process.env.YAHOO_SCREENER_URL ||
  "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved";
const TIMEOUT_MS = 4000;
const PULSE_TTL_MS = 2 * 60 * 1000;
const MAX_COUNT = 50;

// Yahoo rejects requests with no browser-ish User-Agent.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export const PULSE_SCREENS = ["most_actives", "day_gainers", "day_losers"] as const;
export type PulseScreen = (typeof PULSE_SCREENS)[number];

export function isPulseScreen(value: unknown): value is PulseScreen {
  return typeof value === "string" && (PULSE_SCREENS as readonly string[]).includes(value);
}

export interface MarketPulseQuote {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap: number | null;
}

// Yahoo returns each field either as a bare number or, when `formatted=true`
// slips in, as `{ raw, fmt }`. Accept both rather than silently reading NaN.
function toNumber(value: any): number | null {
  const candidate =
    value !== null && typeof value === "object" && "raw" in value ? value.raw : value;
  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapScreenerQuote(raw: any): MarketPulseQuote | null {
  if (!raw) return null;

  // The donor stripped ".NS" so NSE names render bare; keep that, but leave
  // every other suffix (".BO", ".TO", ...) intact so the symbol stays routable.
  const symbol = typeof raw.symbol === "string" ? raw.symbol.replace(/\.NS$/i, "") : "";
  if (!symbol) return null;

  // A screener row without a price is not a quote — the donor skipped these too.
  const price = toNumber(raw.regularMarketPrice);
  if (price === null) return null;

  return {
    symbol,
    name: raw.shortName || raw.longName || symbol,
    price,
    changePercent: toNumber(raw.regularMarketChangePercent) ?? 0,
    volume: toNumber(raw.regularMarketVolume) ?? 0,
    marketCap: toNumber(raw.marketCap),
  };
}

async function fetchScreener(screen: PulseScreen, count: number): Promise<MarketPulseQuote[] | null> {
  const url = `${YAHOO_SCREENER_URL}?scrIds=${encodeURIComponent(screen)}&count=${count}&formatted=false`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const json: any = await res.json();
    const quotes = json?.finance?.result?.[0]?.quotes;
    if (!Array.isArray(quotes)) return null;

    return quotes.map(mapScreenerQuote).filter(Boolean) as MarketPulseQuote[];
  } catch {
    // Rate limit, network failure, or a shape change: report nothing rather
    // than fabricate a market picture.
    return null;
  }
}

export async function getMarketPulse(
  screen: PulseScreen = "most_actives",
  count: number = 25
): Promise<MarketPulseQuote[]> {
  const size = Math.min(Math.max(Math.trunc(count) || 25, 1), MAX_COUNT);
  const cacheKey = getCacheKey("market_pulse", { screen, count: size });

  const result = await getOrFetch(
    cacheKey,
    () => fetchScreener(screen, size),
    PULSE_TTL_MS,
    true
  );

  return result || [];
}

// Chat-side trigger: a "how is the market doing / top gainers today" question
// that names no ticker. Returns the screen the query is asking for, or null.
const SCREEN_PATTERNS: Array<[PulseScreen, RegExp]> = [
  [
    "day_losers",
    /\b(top|worst|biggest|largest)\s+(loser|decliner|laggard|drop|fall|declin)\w*\b|\blosers\b|\bdecliners\b|\blaggards\b|\bworst\s+perform\w*\b|\bwhat'?s\s+(down|falling|dropping|selling off)\b|\b(stocks|shares)\s+(that\s+are\s+)?(down|falling|dropping)\b|\bwhat\s+(stocks|shares)\s+are\s+(down|falling)\b/i,
  ],
  [
    "day_gainers",
    /\b(top|best|biggest|largest|leading)\s+(gainer|performer|mover|winner|riser|advanc)\w*\b|\bgainers\b|\badvancers\b|\bbest\s+perform\w*\b|\bwhat'?s\s+(up|rallying|surging)\b|\b(stocks|shares)\s+(that\s+are\s+)?(up|rallying|surging)\b|\bwhat\s+(stocks|shares)\s+are\s+up\b/i,
  ],
  [
    "most_actives",
    /\bmost\s+active\w*\b|\bmost\s+traded\b|\bactively\s+traded\b|\bhighest\s+volume\b|\bvolume\s+leaders?\b|\bmarket\s+(overview|pulse|today|movers|summary|snapshot|breadth)\b|\bhow\s+(is|'?s)\s+the\s+market\b|\btop\s+movers\b|\bwhat'?s\s+moving\b/i,
  ],
];

export function detectPulseScreen(query: string): PulseScreen | null {
  for (const [screen, pattern] of SCREEN_PATTERNS) {
    if (pattern.test(query)) return screen;
  }
  return null;
}

export function formatMarketPulse(screen: PulseScreen, quotes: MarketPulseQuote[], limit: number = 8): string {
  if (quotes.length === 0) return "";
  const label = screen.replace(/_/g, " ").toUpperCase();
  const rows = quotes
    .slice(0, limit)
    .map((q) => `${q.symbol} ${q.price} (${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)`)
    .join(", ");
  return `${label}: ${rows}`;
}
