
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 1024,
}) as any;

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

  const ruleBasedSignals = extractMacroSignals(headlines);

  const prompt = `Analyze the sentiment of these financial news headlines. Provide a sentiment score from -1 (very bearish) to 1 (very bullish).

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Return a JSON object with:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": number between 0 and 1,
  "reasoning": brief explanation
}`;

  try {
    const response = await llm.invoke(prompt);
    const content = typeof response === "string" ? response : response.content;
    
    const parsed = JSON.parse(content);
    
    return {
      overallSentiment: parsed.sentiment || "neutral",
      confidence: parsed.confidence || 0.5,
      macroSignals: ruleBasedSignals,
      keyHeadlines: headlines.slice(0, 3),
    };
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return {
      overallSentiment: ruleBasedSignals.includes("geopolitical_risk") 
        ? "bearish" 
        : ruleBasedSignals.length > 0 
          ? "bullish" 
          : "neutral",
      confidence: 0.5,
      macroSignals: ruleBasedSignals,
      keyHeadlines: headlines.slice(0, 3),
    };
  }
}
