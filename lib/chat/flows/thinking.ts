
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { THINKING_MODE_SYSTEM_PROMPT } from "../prompts";
import { aggregateMarketData, extractSymbolFromQuery } from "../aggregator";
import { analyzeSentiment } from "../sentiment";
import { buildSignals, SignalBundle } from "../signals";
import { webSearch, formatSearchResults, needsMoreContext } from "../search";
import { shouldUseSearch } from "../router";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite-preview",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 2048,
}) as any;

export interface FlowResult {
  content: string;
  sources: string[];
  mode: "thinking";
  signals?: SignalBundle;
}

export async function thinkingFlow(query: string): Promise<FlowResult> {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const symbol = extractSymbolFromQuery(query);

  if (!symbol) {
    return {
      content: "I couldn't detect a stock symbol in your query. Please include a valid stock ticker (e.g., AAPL, MSFT, TSLA).",
      sources: [],
      mode: "thinking",
    };
  }

  const sources: string[] = ["Finnhub"];

  const marketData = await aggregateMarketData(symbol);

  let searchResults = "";
  if (needsMoreContext(query)) {
    const searchData = await webSearch(query, "thinking");
    if (searchData.length > 0) {
      searchResults = formatSearchResults(searchData);
      sources.push("Web Search");
    }
  }

  if (!marketData.priceData) {
    return {
      content: `I couldn't fetch market data for ${symbol}. The symbol may not be valid or data may be unavailable.`,
      sources: [],
      mode: "thinking",
    };
  }

  const headlines = marketData.news.map((n) => n.headline);
  const sentiment = await analyzeSentiment(headlines);

  const metrics = {
    pe_ratio: marketData.metrics?.peNormalizedAnnual,
    debt_to_equity: marketData.metrics?.totalDebtTotalEquityQuarterly,
  };

  const signals = buildSignals(marketData.priceData, metrics, sentiment.overallSentiment);

  const context = `
## Stock: ${symbol} (${marketData.profile?.name || "Unknown Company"})

### Price Data:
- Current Price: $${marketData.priceData.current}
- Change: $${marketData.priceData.change} (${marketData.priceData.changePercent.toFixed(2)}%)
- Day High: $${marketData.priceData.high}
- Day Low: $${marketData.priceData.low}
- 52-Week High: $${marketData.metrics?.["52WeekHigh"] || "N/A"}
- 52-Week Low: $${marketData.metrics?.["52WeekLow"] || "N/A"}

### Key Metrics:
- P/E Ratio: ${metrics.pe_ratio?.toFixed(1) || "N/A"}
- Market Cap: ${marketData.profile?.marketCapitalization ? `$${(marketData.profile.marketCapitalization / 1e9).toFixed(1)}B` : "N/A"}

### Market Sentiment: ${sentiment.overallSentiment.toUpperCase()}
${sentiment.keyHeadlines.length > 0 ? `### Recent Headlines:\n${sentiment.keyHeadlines.map((h) => `- ${h}`).join("\n")}` : ""}

### Technical Signals:
${signals.signals.map((s) => `- ${s.indicator}: ${s.signal} (${s.reasoning})`).join("\n")}
${searchResults}
`;

  const systemPrompt = THINKING_MODE_SYSTEM_PROMPT.replace(
    "{currentDate}",
    currentDate
  );

  const userPrompt = `
Based on the following market data, provide a concise investment analysis:

${context}

Provide:
1. A clear recommendation (Buy/Hold/Sell)
2. Key reasoning points (2-3)
3. Primary risk factors (1-2)
`;

  try {
    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const content = typeof response === "string" ? response : response.content;

    return {
      content: content || "Analysis unavailable.",
      sources,
      mode: "thinking",
      signals,
    };
  } catch (error) {
    console.error("Thinking flow error:", error);
    return {
      content: "I encountered an error during analysis. Please try again.",
      sources: [],
      mode: "thinking",
    };
  }
}
