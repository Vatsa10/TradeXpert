
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { withRateLimit } from "./rate-limiter";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite-preview",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 512,
  temperature: 0.2,
}) as any;

const SENTIMENT_TIMEOUT_MS = 8000;
const MAX_HEADLINES_FOR_SENTIMENT = 10;

export interface SentimentResult {
  overallSentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  macroSignals: string[];
  keyHeadlines: string[];
}

const RULE_BASED_TAGS: Record<string, string> = {
  war: "geopolitical_risk",
  conflict: "geopolitical_risk",
  sanctions: "geopolitical_risk",
  recession: "macro_risk",
  inflation: "macro_risk",
  interest: "macro_risk",
  rate: "macro_risk",
  fed: "macro_risk",
  earnings: "fundamental_positive",
  profit: "fundamental_positive",
  revenue: "fundamental_positive",
  growth: "fundamental_positive",
  upgrade: "bullish_signal",
  downgrade: "bearish_signal",
  buy: "bullish_signal",
  sell: "bearish_signal",
  miss: "bearish_signal",
  beat: "bullish_signal",
};

export function extractMacroSignals(headlines: string[]): string[] {
  const signals: string[] = [];
  const lowerHeadlines = headlines.map((h) => h.toLowerCase());

  for (const [keyword, signal] of Object.entries(RULE_BASED_TAGS)) {
    if (lowerHeadlines.some((h) => h.includes(keyword))) {
      if (!signals.includes(signal)) {
        signals.push(signal);
      }
    }
  }

  return signals;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Sentiment timeout")), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function buildRuleBasedSentiment(headlines: string[], signals: string[]): SentimentResult {
  const lower = headlines.map((h) => h.toLowerCase()).join(" ");
  const bullishHits = ["beat", "upgrade", "profit", "growth", "surge", "rally"].filter((k) => lower.includes(k)).length;
  const bearishHits = ["miss", "downgrade", "lawsuit", "probe", "fine", "decline", "drop"].filter((k) => lower.includes(k)).length;

  let overallSentiment: "bullish" | "bearish" | "neutral" = "neutral";
  if (bearishHits > bullishHits) overallSentiment = "bearish";
  if (bullishHits > bearishHits) overallSentiment = "bullish";

  if (signals.includes("geopolitical_risk") || signals.includes("macro_risk")) {
    overallSentiment = bearishHits === bullishHits ? "bearish" : overallSentiment;
  }

  const confidence = Math.min(0.35 + (Math.abs(bullishHits - bearishHits) * 0.12), 0.75);

  return {
    overallSentiment,
    confidence,
    macroSignals: signals,
    keyHeadlines: headlines.slice(0, 3),
  };
}

export async function analyzeSentiment(
  headlines: string[]
): Promise<SentimentResult> {
  if (!headlines || headlines.length === 0) {
    return {
      overallSentiment: "neutral",
      confidence: 0,
      macroSignals: [],
      keyHeadlines: [],
    };
  }

  const trimmedHeadlines = headlines
    .filter((h) => typeof h === "string" && h.trim().length > 0)
    .slice(0, MAX_HEADLINES_FOR_SENTIMENT);

  const ruleBasedSignals = extractMacroSignals(trimmedHeadlines);
  const ruleBasedSentiment = buildRuleBasedSentiment(trimmedHeadlines, ruleBasedSignals);

  const prompt = `Analyze sentiment of these financial headlines.

Headlines:
${trimmedHeadlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Return a JSON object with:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": number between 0 and 1,
  "reasoning": brief explanation,
  "signals": ["signal 1", "signal 2"]
}`;

  try {
    const llmCall = async () => {
      return await withTimeout(llm.invoke(prompt), SENTIMENT_TIMEOUT_MS);
    };
    const response = await withRateLimit("gemini-sentiment", llmCall, true);
    const content = typeof response === "string" ? response : (response as any).content;
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return ruleBasedSentiment;
    const parsed = JSON.parse(match[0]);

    return {
      overallSentiment: parsed.sentiment || ruleBasedSentiment.overallSentiment,
      confidence: Math.max(0, Math.min(1, parsed.confidence ?? ruleBasedSentiment.confidence)),
      macroSignals: Array.isArray(parsed.signals)
        ? Array.from(new Set([...(parsed.signals as string[]), ...ruleBasedSignals]))
        : ruleBasedSignals,
      keyHeadlines: trimmedHeadlines.slice(0, 3),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Sentiment timeout")) {
      console.warn("[Sentiment] Timeout, using rule-based fallback");
    } else {
      console.error("Sentiment analysis error:", error);
    }
    return ruleBasedSentiment;
  }
}
