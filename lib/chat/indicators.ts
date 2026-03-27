import { FinancialMetrics } from "./types";

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const TIMEOUT_MS = 800;

interface TechnicalIndicator {
  name: string;
  value: number | null;
  signal: "bullish" | "bearish" | "neutral";
  description: string;
}

interface TechnicalIndicators {
  rsi?: TechnicalIndicator;
  macd?: TechnicalIndicator;
  sma20?: TechnicalIndicator;
  sma50?: TechnicalIndicator;
  ema20?: TechnicalIndicator;
  ema50?: TechnicalIndicator;
  adx?: TechnicalIndicator;
  cci?: TechnicalIndicator;
  stoch?: TechnicalIndicator;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), ms)
      ),
    ]);
  } catch {
    return null;
  }
}

export async function getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn("Alpha Vantage API key not configured");
    return null;
  }

  try {
    const [rsiData, macdData, smaData, adxData] = await Promise.all([
      fetchIndicator(symbol, "RSI", "14", "daily"),
      fetchIndicator(symbol, "MACD", "", "daily"),
      fetchIndicator(symbol, "SMA", "20", "daily"),
      fetchIndicator(symbol, "ADX", "14", "daily"),
    ]);

    const indicators: TechnicalIndicators = {};

    if (rsiData) {
      const rsi = parseRSI(rsiData);
      if (rsi !== null) {
        indicators.rsi = {
          name: "RSI (14)",
          value: rsi,
          signal: rsi > 70 ? "bearish" : rsi < 30 ? "bullish" : "neutral",
          description: rsi > 70 ? "Overbought - potential pullback" : rsi < 30 ? "Oversold - potential bounce" : "Neutral range",
        };
      }
    }

    if (macdData) {
      const macd = parseMACD(macdData);
      if (macd) {
        indicators.macd = {
          name: "MACD",
          value: macd.histogram,
          signal: macd.histogram > 0 ? "bullish" : macd.histogram < 0 ? "bearish" : "neutral",
          description: macd.histogram > 0 ? "Bullish momentum" : "Bearish momentum",
        };
      }
    }

    if (smaData) {
      const sma = parseSMA(smaData);
      if (sma) {
        indicators.sma20 = {
          name: "SMA (20)",
          value: sma.sma20,
          signal: "neutral",
          description: "20-day simple moving average",
        };
      }
    }

    if (adxData) {
      const adx = parseADX(adxData);
      if (adx !== null) {
        indicators.adx = {
          name: "ADX (14)",
          value: adx,
          signal: adx > 25 ? "bullish" : "neutral",
          description: adx > 25 ? "Strong trend" : "Weak trend",
        };
      }
    }

    return indicators;
  } catch (error) {
    console.error("Alpha Vantage error:", error);
    return null;
  }
}

async function fetchIndicator(symbol: string, indicator: string, period: string, interval: string): Promise<any> {
  let url = `https://www.alphavantage.co/query?function=${indicator}&symbol=${symbol}&interval=${interval}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  if (period) {
    url += `&time_period=${period}`;
  }

  const response = await withTimeout(fetch(url), TIMEOUT_MS);
  if (!response) return null;

  return await response.json();
}

function parseRSI(data: any): number | null {
  try {
    const series = data?.["Technical Analysis: RSI"];
    if (!series) return null;
    
    const dates = Object.keys(series).sort().reverse();
    if (dates.length === 0) return null;
    
    return parseFloat(series[dates[0]]?.RSI);
  } catch {
    return null;
  }
}

function parseMACD(data: any): { histogram: number; signal: number; line: number } | null {
  try {
    const series = data?.["Technical Analysis: MACD"];
    if (!series) return null;
    
    const dates = Object.keys(series).sort().reverse();
    if (dates.length === 0) return null;
    
    const latest = series[dates[0]];
    return {
      histogram: parseFloat(latest?.["MACD_Hist"] || 0),
      signal: parseFloat(latest?.["MACD_Signal"] || 0),
      line: parseFloat(latest?.["MACD"] || 0),
    };
  } catch {
    return null;
  }
}

function parseSMA(data: any): { sma20: number } | null {
  try {
    const series = data?.["Technical Analysis: SMA"];
    if (!series) return null;
    
    const dates = Object.keys(series).sort().reverse();
    if (dates.length === 0) return null;
    
    return {
      sma20: parseFloat(series[dates[0]]?.SMA || 0),
    };
  } catch {
    return null;
  }
}

function parseADX(data: any): number | null {
  try {
    const series = data?.["Technical Analysis: ADX"];
    if (!series) return null;
    
    const dates = Object.keys(series).sort().reverse();
    if (dates.length === 0) return null;
    
    return parseFloat(series[dates[0]]?.ADX);
  } catch {
    return null;
  }
}

export function formatIndicatorsForPrompt(indicators: TechnicalIndicators): string {
  if (!indicators || Object.keys(indicators).length === 0) {
    return "No technical indicators available.";
  }

  let prompt = "### Technical Indicators:\n";

  if (indicators.rsi) {
    prompt += `- **RSI (${indicators.rsi.value?.toFixed(1)})**: ${indicators.rsi.signal.toUpperCase()} - ${indicators.rsi.description}\n`;
  }

  if (indicators.macd) {
    prompt += `- **MACD**: ${indicators.macd.signal.toUpperCase()} (histogram: ${indicators.macd.value?.toFixed(2)})\n`;
  }

  if (indicators.adx) {
    prompt += `- **ADX (${indicators.adx.value?.toFixed(1)})**: ${indicators.adx.signal.toUpperCase()} - ${indicators.adx.description}\n`;
  }

  if (indicators.sma20) {
    prompt += `- **SMA 20**: ${indicators.sma20.value?.toFixed(2)}\n`;
  }

  return prompt;
}

export function getTechnicalSignals(indicators: TechnicalIndicators): string[] {
  const signals: string[] = [];

  if (!indicators) return signals;

  if (indicators.rsi) {
    signals.push(`RSI: ${indicators.rsi.signal}`);
  }
  if (indicators.macd) {
    signals.push(`MACD: ${indicators.macd.signal}`);
  }
  if (indicators.adx) {
    signals.push(`ADX: ${indicators.adx.signal}`);
  }

  return signals;
}
