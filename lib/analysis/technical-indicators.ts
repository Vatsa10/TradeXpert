import { getCacheKey, getOrFetch, getTTL } from "@/lib/chat/cache";

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
// Alpha Vantage's free tier throttles at ~1 request/second and answers 200-OK
// with a prose "spread your requests out" body when exceeded. Callers such as
// the portfolio optimizer fan out over up to 10 symbols at once, so an unpaced
// Promise.all meant every symbol but the first came back empty. Serialise the
// network hits through one queue that spaces them out; cache hits never reach
// here, so warm paths stay fast.
const AV_MIN_INTERVAL_MS = 1100;
let avQueue: Promise<unknown> = Promise.resolve();
let avLastRequestAt = 0;

function paceAlphaVantage<T>(task: () => Promise<T>): Promise<T> {
  const scheduled = avQueue.then(async () => {
    const wait = AV_MIN_INTERVAL_MS - (Date.now() - avLastRequestAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    avLastRequestAt = Date.now();
    return task();
  });
  // Keep the chain alive regardless of individual failures.
  avQueue = scheduled.catch(() => undefined);
  return scheduled;
}

// Generous enough to cover the queue wait plus a slow upstream response; the
// old 2s budget expired while a symbol was still sitting behind the pacer.
const TIMEOUT_MS = 8000;

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  name: string;
  value: number | null;
  signal: "bullish" | "bearish" | "neutral";
  description: string;
}

export interface TechnicalIndicators {
  rsi?: TechnicalIndicator;
  macd?: TechnicalIndicator & { crossover?: "bullish" | "bearish" | null };
  sma20?: TechnicalIndicator;
  sma50?: TechnicalIndicator;
  ema20?: TechnicalIndicator;
  ema50?: TechnicalIndicator;
  bollinger?: TechnicalIndicator & { upper: number; lower: number; percentB: number };
  atr?: TechnicalIndicator;
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

// Single OHLCV fetch replaces 4 separate rate-limited Alpha Vantage indicator
// endpoint calls (RSI/MACD/SMA/ADX) previously used in lib/chat/indicators.ts.
/**
 * `outputsize=compact` returns 100 bars, which is not enough for the 200-bar
 * SMA the regime detector needs — callers that want a regime must pass
 * `outputsize: "full"`. Cached separately so the two never overwrite each other.
 *
 * `full` is a premium feature on some Alpha Vantage plans. The first refusal
 * flips this process to compact permanently rather than burning one of the free
 * tier's 25 daily requests on a call that can never succeed — the caller gets a
 * shorter (100-bar) series instead of nothing at all.
 */
let alphaVantageFullUnsupported = false;

export async function fetchDailySeries(
  symbol: string,
  options: { outputsize?: "compact" | "full" } = {}
): Promise<OHLCV[] | null> {
  if (!ALPHA_VANTAGE_API_KEY) return null;

  const requested = options.outputsize ?? "compact";
  const outputsize = requested === "full" && alphaVantageFullUnsupported ? "compact" : requested;
  const cacheKey = getCacheKey("av_daily_series", { symbol, outputsize });

  // NOTE: the fetcher throws (rather than returning null) on failure so that
  // getOrFetch does not cache a null for the full alphaVantage TTL (3h) after
  // a single transient timeout or rate-limit response.
  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const res = await paceAlphaVantage(() => withTimeout(fetch(url), TIMEOUT_MS));
        if (!res) throw new Error("Alpha Vantage daily series request timed out");

        const data = await res.json();
        const series = data?.["Time Series (Daily)"];
        if (!series) {
          // Alpha Vantage answers 200-OK with a prose Note/Information body when
          // it throttles (free tier: 5 req/min, 25 req/day). Reporting that as a
          // flat "unavailable" made a quota problem look like a missing symbol.
          const notice =
            data?.["Note"] ?? data?.["Information"] ?? data?.["Error Message"];
          throw new Error(
            notice
              ? `Alpha Vantage refused the request: ${String(notice).slice(0, 200)}`
              : "Alpha Vantage daily series unavailable"
          );
        }

        const rows: OHLCV[] = Object.keys(series)
          .sort()
          .map((date) => ({
            date,
            open: parseFloat(series[date]["1. open"]),
            high: parseFloat(series[date]["2. high"]),
            low: parseFloat(series[date]["3. low"]),
            close: parseFloat(series[date]["4. close"]),
            volume: parseFloat(series[date]["5. volume"]),
          }))
          // Drop malformed rows so a single NaN close cannot poison every
          // downstream indicator (EMA/RSI propagate NaN forever).
          .filter((r) => Number.isFinite(r.close) && Number.isFinite(r.high) && Number.isFinite(r.low));

        if (rows.length === 0) throw new Error("Alpha Vantage daily series empty");

        return rows;
      },
      getTTL("alphaVantage"),
      true
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // "full is a premium feature": remember it and serve the compact series so
    // indicators still render, instead of returning nothing.
    if (outputsize === "full" && /premium/i.test(message)) {
      alphaVantageFullUnsupported = true;
      console.warn(
        `[AlphaVantage] outputsize=full is not available on this key — falling back to compact (100 bars); regime detection stays unavailable for US symbols.`
      );
      return fetchDailySeries(symbol, { outputsize: "compact" });
    }

    // Never swallow this silently: a null here degrades optimizer/indicator
    // output into "insufficient history", and without the reason the failure is
    // undiagnosable from the outside.
    console.warn(`[AlphaVantage] daily series failed for ${symbol}:`, message);
    return null;
  }
}

function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    const window = values.slice(i - period + 1, i + 1);
    out.push(window.reduce((a, b) => a + b, 0) / period);
  }
  return out;
}

function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  if (values.length < period) return out;

  let seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = seed;

  for (let i = period; i < values.length; i++) {
    seed = values[i] * k + seed * (1 - k);
    out[i] = seed;
  }
  return out;
}

// Wilder-smoothed RSI-14.
function rsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum -= diff;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

function macd(closes: number[]) {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine: (number | null)[] = closes.map((_, i) =>
    ema12[i] !== null && ema26[i] !== null ? (ema12[i] as number) - (ema26[i] as number) : null
  );

  const macdValues = macdLine.filter((v): v is number => v !== null);
  const signalRaw = ema(macdValues, 9);
  const signalLine: (number | null)[] = new Array(closes.length).fill(null);
  let offset = macdLine.findIndex((v) => v !== null);
  signalRaw.forEach((v, i) => {
    if (offset + i < signalLine.length) signalLine[offset + i] = v;
  });

  const histogram: (number | null)[] = closes.map((_, i) =>
    macdLine[i] !== null && signalLine[i] !== null ? (macdLine[i] as number) - (signalLine[i] as number) : null
  );

  return { macdLine, signalLine, histogram };
}

function bollingerBands(closes: number[], period = 20, stdDevMult = 2) {
  const mid = sma(closes, period);
  const upper: (number | null)[] = new Array(closes.length).fill(null);
  const lower: (number | null)[] = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const window = closes.slice(i - period + 1, i + 1);
    const mean = mid[i] as number;
    const variance = window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);
    upper[i] = mean + stdDevMult * stdDev;
    lower[i] = mean - stdDevMult * stdDev;
  }

  return { mid, upper, lower };
}

// Wilder-smoothed ATR (the standard definition): seed with the SMA of the
// first `period` true ranges, then ATR_i = (ATR_{i-1} * (period - 1) + TR_i) / period.
// A plain rolling SMA of TR is NOT ATR and reacts far too quickly.
function atr(rows: OHLCV[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(rows.length).fill(null);
  if (rows.length < period + 1) return out;

  const trueRanges: number[] = rows.map((row, i) => {
    if (i === 0) return row.high - row.low;
    const prevClose = rows[i - 1].close;
    return Math.max(row.high - row.low, Math.abs(row.high - prevClose), Math.abs(row.low - prevClose));
  });

  // Index 0's TR is not a true "true range" (no previous close), so seed from index 1.
  let running = trueRanges.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  out[period] = running;

  for (let i = period + 1; i < trueRanges.length; i++) {
    running = (running * (period - 1) + trueRanges[i]) / period;
    out[i] = running;
  }
  return out;
}

const last = <T>(arr: (T | null | undefined)[]): T | null =>
  arr.length === 0 ? null : arr[arr.length - 1] ?? null;
const lastN = <T>(arr: (T | null | undefined)[], n: number): T | null =>
  arr.length <= n ? null : arr[arr.length - 1 - n] ?? null;

export function computeIndicatorsFromSeries(rows: OHLCV[]): TechnicalIndicators {
  const indicators: TechnicalIndicators = {};
  if (rows.length === 0) return indicators;

  const closes = rows.map((r) => r.close);

  const rsiSeries = rsi(closes);
  const rsiVal = last(rsiSeries);
  if (rsiVal !== null) {
    indicators.rsi = {
      name: "RSI (14)",
      value: rsiVal,
      signal: rsiVal > 70 ? "bearish" : rsiVal < 30 ? "bullish" : "neutral",
      description:
        rsiVal > 70 ? "Overbought - potential pullback" : rsiVal < 30 ? "Oversold - potential bounce" : "Neutral range",
    };
  }

  const { histogram } = macd(closes);
  const macdVal = last(histogram);
  const macdPrev = lastN(histogram, 1);
  if (macdVal !== null) {
    let crossover: "bullish" | "bearish" | null = null;
    if (macdPrev !== null) {
      if (macdPrev <= 0 && macdVal > 0) crossover = "bullish";
      else if (macdPrev >= 0 && macdVal < 0) crossover = "bearish";
    }
    indicators.macd = {
      name: "MACD",
      value: macdVal,
      signal: macdVal > 0 ? "bullish" : macdVal < 0 ? "bearish" : "neutral",
      description: macdVal > 0 ? "Bullish momentum" : "Bearish momentum",
      crossover,
    };
  }

  const sma20Series = sma(closes, 20);
  const sma20Val = last(sma20Series);
  if (sma20Val !== null) {
    indicators.sma20 = {
      name: "SMA (20)",
      value: sma20Val,
      signal: "neutral",
      description: "20-day simple moving average",
    };
  }

  const sma50Series = sma(closes, 50);
  const sma50Val = last(sma50Series);
  if (sma50Val !== null) {
    indicators.sma50 = {
      name: "SMA (50)",
      value: sma50Val,
      signal: "neutral",
      description: "50-day simple moving average",
    };
  }

  const ema20Series = ema(closes, 20);
  const ema20Val = last(ema20Series);
  if (ema20Val !== null) {
    indicators.ema20 = {
      name: "EMA (20)",
      value: ema20Val,
      signal: closes[closes.length - 1] > ema20Val ? "bullish" : "bearish",
      description: "20-day exponential moving average",
    };
  }

  // ema50 is part of the exported TechnicalIndicators shape but was never
  // populated, so consumers always saw it as undefined.
  const ema50Val = last(ema(closes, 50));
  if (ema50Val !== null) {
    indicators.ema50 = {
      name: "EMA (50)",
      value: ema50Val,
      signal: closes[closes.length - 1] > ema50Val ? "bullish" : "bearish",
      description: "50-day exponential moving average",
    };
  }

  const bands = bollingerBands(closes);
  const upperVal = last(bands.upper);
  const lowerVal = last(bands.lower);
  if (upperVal !== null && lowerVal !== null) {
    const currentClose = closes[closes.length - 1];
    const percentB = (currentClose - lowerVal) / (upperVal - lowerVal || 1);
    indicators.bollinger = {
      name: "Bollinger Bands",
      value: percentB,
      upper: upperVal,
      lower: lowerVal,
      percentB,
      signal: percentB > 1 ? "bearish" : percentB < 0 ? "bullish" : "neutral",
      description: percentB > 1 ? "Above upper band - overextended" : percentB < 0 ? "Below lower band - oversold" : "Within bands",
    };
  }

  const atrSeries = atr(rows);
  const atrVal = last(atrSeries);
  if (atrVal !== null) {
    indicators.atr = {
      name: "ATR (14)",
      value: atrVal,
      signal: "neutral",
      description: "Average true range - volatility measure",
    };
  }

  return indicators;
}

export async function getLocalTechnicalIndicators(symbol: string): Promise<TechnicalIndicators | null> {
  const rows = await fetchDailySeries(symbol);
  if (!rows || rows.length < 20) return null;
  const indicators = computeIndicatorsFromSeries(rows);
  // An empty object is truthy — returning it would suppress the caller's
  // Alpha Vantage indicator-endpoint fallback for zero benefit.
  return Object.keys(indicators).length > 0 ? indicators : null;
}
