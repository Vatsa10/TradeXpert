import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Mode, LLMResponse, QueryContext, Trend, Advice, DataQuality, Source, SignalBundle } from "./types";
import { assessDataQuality } from "./context-builder";
import { calibrateConfidence, getDataQuality } from "./confidence";

const fastLLM = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 2048,
}) as any;

const proLLM = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-pro",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 4096,
}) as any;

const OUTPUT_SCHEMA = `
Response MUST be valid JSON with this exact structure:
{
  "summary": "2-3 sentence investment summary",
  "trend": "bullish" | "bearish" | "neutral",
  "reasoning": ["point 1", "point 2", "point 3"],
  "advice": "Buy" | "Hold" | "Sell" | "Wait",
  "confidence": 0.0-1.0,
  "signalTrace": ["signal 1", "signal 2"]
}

CRITICAL RULES:
- Only use provided data
- Do not fabricate numbers or events
- If data missing, say "Insufficient data" in summary
- confidence must be 0.0-1.0 (float)
- trend must be exactly "bullish", "bearish", or "neutral"
- advice must be exactly "Buy", "Hold", "Sell", or "Wait"
`;

function getSystemPrompt(mode: Mode, currentDate: string): string {
  const basePrompts: Record<Mode, string> = {
    normal: `You are TradeXpert AI, a helpful financial assistant. Today's date is ${currentDate}.`,
    thinking: `You are TradeXpert AI, an institutional-grade financial analyst. Today's date is ${currentDate}.`,
    pro: `You are TradeXpert AI, a Senior Investment Strategist providing deep market analysis. Today's date is ${currentDate}.`,
  };

  return basePrompts[mode] + "\n" + OUTPUT_SCHEMA;
}

function buildContextPrompt(context: QueryContext): string {
  let prompt = "";

  if (context.priceData) {
    prompt += `
### PRICE DATA
- Current: $${context.priceData.current}
- Change: $${context.priceData.change} (${context.priceData.changePercent.toFixed(2)}%)
- High: $${context.priceData.high}
- Low: $${context.priceData.low}
`;
  }

  if (context.metrics) {
    prompt += `
### METRICS
${context.metrics.pe_ratio ? `- P/E: ${context.metrics.pe_ratio.toFixed(1)}` : ""}
${context.metrics.market_cap ? `- Market Cap: $${(context.metrics.market_cap / 1e9).toFixed(1)}B` : ""}
${context.metrics.revenue_growth ? `- Revenue Growth: ${context.metrics.revenue_growth.toFixed(1)}%` : ""}
${context.metrics.debt_to_equity ? `- Debt/Equity: ${context.metrics.debt_to_equity.toFixed(1)}` : ""}
`;
  }

  if (context.news && context.news.length > 0) {
    prompt += `
### NEWS
${context.news.slice(0, 5).map((n, i) => `${i + 1}. ${n.headline}`).join("\n")}
`;
  }

  if (context.searchResults && context.searchResults.length > 0) {
    prompt += `
### SEARCH RESULTS
${context.searchResults.slice(0, 3).map((r, i) => `${i + 1}. ${r.title}: ${r.content.substring(0, 200)}`).join("\n")}
`;
  }

  if (context.sentiment) {
    prompt += `
### SENTIMENT
- Overall: ${context.sentiment.overallSentiment}
- Confidence: ${(context.sentiment.confidence * 100).toFixed(0)}%
${context.sentiment.macroSignals.length > 0 ? `- Signals: ${context.sentiment.macroSignals.join(", ")}` : ""}
`;
  }

  return prompt;
}

function parseJSONResponse(response: string): Partial<LLMResponse> | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (
      typeof parsed.summary !== "string" ||
      !["bullish", "bearish", "neutral"].includes(parsed.trend) ||
      !Array.isArray(parsed.reasoning) ||
      !["Buy", "Hold", "Sell", "Wait"].includes(parsed.advice) ||
      typeof parsed.confidence !== "number"
    ) {
      return null;
    }

    return {
      summary: parsed.summary,
      trend: parsed.trend as Trend,
      reasoning: parsed.reasoning,
      advice: parsed.advice as Advice,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      signalTrace: Array.isArray(parsed.signalTrace) ? parsed.signalTrace : [],
    };
  } catch {
    return null;
  }
}

function createFallbackResponse(context: QueryContext): LLMResponse {
  const hasData = context.priceData || context.news?.length || context.searchResults?.length;

  return {
    summary: hasData 
      ? "Analysis completed based on available market data." 
      : "Insufficient data available for comprehensive analysis.",
    trend: "neutral" as Trend,
    reasoning: ["Based on available data points"],
    advice: "Hold" as Advice,
    confidence: 0.3,
    dataQuality: assessDataQuality(context),
    sources: [],
    signalTrace: [],
  };
}

export async function generateLLMResponse(
  query: string,
  context: QueryContext,
  signals: SignalBundle | undefined,
  mode: Mode
): Promise<LLMResponse> {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const llm = mode === "pro" ? proLLM : fastLLM;

  const contextPrompt = buildContextPrompt(context);
  const signalPrompt = signals 
    ? `\n### SIGNALS\n${signals.signals.map(s => `- ${s.indicator}: ${s.signal} (${s.reasoning})`).join("\n")}\nOverall: ${signals.overallTrend}` 
    : "";

  const userPrompt = `
Query: ${query}

${contextPrompt}
${signalPrompt}

Provide your analysis as JSON following the schema above.
`;

  try {
    const response = await llm.invoke([
      { role: "system", content: getSystemPrompt(mode, currentDate) },
      { role: "user", content: userPrompt },
    ]);

    const content = typeof response === "string" ? response : response.content;
    const parsed = parseJSONResponse(content);

    if (parsed) {
      const dataQuality = getDataQuality(context);
      const calibratedConfidence = calibrateConfidence(
        parsed.confidence || 0.5,
        context,
        context.intent
      );

      return {
        summary: parsed.summary || "Analysis completed.",
        trend: parsed.trend || "neutral",
        reasoning: parsed.reasoning || ["Based on available data"],
        advice: parsed.advice || "Hold",
        confidence: calibratedConfidence,
        dataQuality,
        sources: collectSources(context),
        signalTrace: parsed.signalTrace || signals?.signals.map(s => s.indicator) || [],
      };
    }

    const fallback = createFallbackResponse(context);
    fallback.confidence = calibrateConfidence(fallback.confidence, context, context.intent);
    fallback.dataQuality = getDataQuality(context);
    return fallback;
  } catch (error) {
    console.error("LLM response error:", error);
    return createFallbackResponse(context);
  }
}

function collectSources(context: QueryContext): Source[] {
  const sources: Source[] = [];

  if (context.priceData) {
    sources.push({ type: "finnhub", title: "Real-time Price" });
  }
  if (context.metrics) {
    sources.push({ type: "finnhub", title: "Financial Metrics" });
  }
  if (context.news && context.news.length > 0) {
    sources.push({ type: "news", title: "Company News" });
  }
  if (context.searchResults && context.searchResults.length > 0) {
    sources.push({ type: "search", title: "Web Search" });
  }
  if (context.sentiment) {
    sources.push({ type: "llm", title: "Sentiment Analysis" });
  }

  return sources;
}

export function transformForMarkdown(response: LLMResponse, context: QueryContext): string {
  const emoji = {
    bullish: "📈",
    bearish: "📉",
    neutral: "➡️",
  };

  const adviceEmoji = {
    Buy: "✅",
    Hold: "⏳",
    Sell: "❌",
    Wait: "⏸️",
  };

  let markdown = `# ${response.summary}\n\n`;
  markdown += `**Trend:** ${emoji[response.trend]} ${response.trend.toUpperCase()} `;
  markdown += `| **Advice:** ${adviceEmoji[response.advice]} ${response.advice} `;
  markdown += `| **Confidence:** ${(response.confidence * 100).toFixed(0)}%\n\n`;
  markdown += `**Data Quality:** ${response.dataQuality === "high" ? "🟢 High" : response.dataQuality === "medium" ? "🟡 Medium" : "🔴 Low"}\n\n`;

  if (response.reasoning.length > 0) {
    markdown += `### Key Reasoning\n`;
    response.reasoning.forEach((r, i) => {
      markdown += `${i + 1}. ${r}\n`;
    });
    markdown += "\n";
  }

  if (response.signalTrace.length > 0) {
    markdown += `### Signal Trace\n`;
    response.signalTrace.forEach((s) => {
      markdown += `- ${s}\n`;
    });
    markdown += "\n";
  }

  if (response.sources.length > 0) {
    markdown += `### Sources\n`;
    response.sources.forEach((s) => {
      markdown += `- ${s.title || s.type}\n`;
    });
  }

  return markdown;
}
