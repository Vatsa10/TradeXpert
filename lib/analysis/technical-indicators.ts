import { getCacheKey, getOrFetch, getTTL } from "@/lib/chat/cache";

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const TIMEOUT_MS = 2000;

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
export async function fetchDailySeries(symbol: string): Promise<OHLCV[] | null> {
  if (!ALPHA_VANTAGE_API_KEY) return null;

  const cacheKey = getCacheKey("av_daily_series", { symbol });

  return getOrFetch(
    cacheKey,
    async () => {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const res = await withTimeout(fetch(url), TIMEOUT_MS);
      if (!res) return null;

      const data = await res.json();
      const series = data?.["Time Series (Daily)"];
      if (!series) return null;

      const rows: OHLCV[] = Object.keys(series)
        .sort()
        .map((date) => ({
          date,
          open: parseFloat(series[date]["1. open"]),
          high: parseFloat(series[date]["2. high"]),
          low: parseFloat(series[date]["3. low"]),
          close: parseFloat(series[date]["4. close"]),
          volume: parseFloat(series[date]["5. volume"]),
        }));

      return rows;
    },
    getTTL("alphaVantage"),
    true
  );
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

function atr(rows: OHLCV[], period = 14): (number | null)[] {
  const trueRanges: number[] = rows.map((row, i) => {
    if (i === 0) return row.high - row.low;
    const prevClose = rows[i - 1].close;
    return Math.max(row.high - row.low, Math.abs(row.high - prevClose), Math.abs(row.low - prevClose));
  });
  return sma(trueRanges, period);
}

const last = <T>(arr: T[]): T => arr[arr.length - 1];
const lastN = <T>(arr: T[], n: number): T => arr[arr.length - 1 - n];

export function computeIndicatorsFromSeries(rows: OHLCV[]): TechnicalIndicators {
  const closes = rows.map((r) => r.close);
  const indicators: TechnicalIndicators = {};

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

  const bands = bollingerBands(closes);
  const upperVal = last(bands.upper);
  const lowerVal = last(bands.lower);
  if (upperVal !== null && lowerVal !== null) {
    const currentClose = last(closes);
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
  return computeIndicatorsFromSeries(rows);
}
