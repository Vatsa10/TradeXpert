
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PRO_MODE_SYSTEM_PROMPT } from "../prompts";
import { aggregateMarketData, extractSymbolFromQuery, getGeneralNews } from "../aggregator";
import { analyzeSentiment, SentimentResult } from "../sentiment";
import { buildSignals, SignalBundle } from "../signals";
import { webSearch, formatSearchResults } from "../search";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-pro",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 4096,
}) as any;

export interface FlowResult {
  content: string;
  sources: string[];
  mode: "pro";
  signals?: SignalBundle;
  sentiment?: SentimentResult;
}

export async function proFlow(query: string): Promise<FlowResult> {
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
      mode: "pro",
    };
  }

  const sources: string[] = ["Finnhub"];

  const [marketData, generalNews, searchResults] = await Promise.all([
    aggregateMarketData(symbol),
    getGeneralNews(),
    webSearch(query, "pro"),
  ]);

  if (searchResults.length > 0) {
    sources.push("Tavily/Exa");
  }

  if (!marketData.priceData) {
    return {
      content: `I couldn't fetch market data for ${symbol}. The symbol may not be valid or data may be unavailable.`,
      sources: [],
      mode: "pro",
    };
  }

  const headlines = marketData.news.map((n) => n.headline);
  const sentiment = await analyzeSentiment(headlines);

  const metrics = {
    pe_ratio: marketData.metrics?.peNormalizedAnnual,
    pb_ratio: marketData.metrics?.pbAnnual,
    debt_to_equity: marketData.metrics?.totalDebtTotalEquityQuarterly,
    dividend_yield: marketData.metrics?.dividendYieldIndicatedAnnual,
    revenue_growth: marketData.metrics?.revenueGrowthYoy,
    eps: marketData.metrics?.epsExclExtraItemsTTM,
    fifty_two_week_high: marketData.metrics?.["52WeekHigh"],
    fifty_two_week_low: marketData.metrics?.["52WeekLow"],
  };

  const signals = buildSignals(marketData.priceData, metrics, sentiment.overallSentiment);

  const context = `
## DEEP ANALYSIS: ${symbol} (${marketData.profile?.name || "Unknown Company"})

### 📊 QUANTITATIVE ANALYSIS

**Price Action:**
- Current Price: $${marketData.priceData.current}
- Daily Change: $${marketData.priceData.change} (${marketData.priceData.changePercent.toFixed(2)}%)
- Day Range: $${marketData.priceData.low} - $${marketData.priceData.high}
- 52-Week Range: $${metrics.fifty_two_week_low || "N/A"} - $${metrics.fifty_two_week_high || "N/A"}

**Valuation Metrics:**
- P/E Ratio: ${metrics.pe_ratio?.toFixed(1) || "N/A"}
- P/B Ratio: ${metrics.pb_ratio?.toFixed(1) || "N/A"}
- Dividend Yield: ${metrics.dividend_yield ? `${metrics.dividend_yield.toFixed(2)}%` : "N/A"}
- EPS (TTM): $${metrics.eps?.toFixed(2) || "N/A"}

**Financial Health:**
- Debt-to-Equity: ${metrics.debt_to_equity?.toFixed(1) || "N/A"}
- Revenue Growth (YoY): ${metrics.revenue_growth ? `${metrics.revenue_growth.toFixed(1)}%` : "N/A"}
- Market Cap: ${marketData.profile?.marketCapitalization ? `$${(marketData.profile.marketCapitalization / 1e9).toFixed(1)}B` : "N/A"}

### 📰 QUALITATIVE ANALYSIS

**Market Sentiment: ${sentiment.overallSentiment.toUpperCase()} (${(sentiment.confidence * 100).toFixed(0)}% confidence)**

${sentiment.macroSignals.length > 0 ? `**Macro Signals:** ${sentiment.macroSignals.join(", ")}` : ""}

**Recent Company News:**
${headlines.slice(0, 5).map((h, i) => `${i + 1}. ${h}`).join("\n")}

**Market Context:**
${generalNews.slice(0, 3).map((n, i) => `- ${n.headline}`).join("\n")}

### 📈 TECHNICAL SIGNALS

${signals.signals.map((s) => `**${s.indicator}**: ${s.signal.toUpperCase()} - ${s.reasoning}`).join("\n")}

**Overall Trend: ${signals.overallTrend.toUpperCase()}** (${(signals.strength * 100).toFixed(0)}% confidence)

### 🏢 COMPANY PROFILE

- Industry: ${marketData.profile?.finnhubIndustry || "N/A"}
- IPO Date: ${marketData.profile?.ipo || "N/A"}
- Exchange: ${marketData.profile?.exchange || "N/A"}

### 🔍 DEEP SEARCH RESULTS

${searchResults.length > 0 ? formatSearchResults(searchResults) : "No additional search results available"}
`;

  const systemPrompt = PRO_MODE_SYSTEM_PROMPT.replace(
    "{currentDate}",
    currentDate
  );

  const userPrompt = `
Provide a comprehensive investment analysis based on the deep market data above:

${context}

Generate an institutional-grade report with:
1. **Executive Summary** (2-3 sentences)
2. **Quantitative Thesis** (valuation + financials)
3. **Qualitative Thesis** (sentiment + catalysts + risks)
4. **Technical Outlook** (momentum + signals)
5. **Final Recommendation** with confidence level
6. **Risk Factors**

Be specific with data points and explain the "why" behind your recommendation.
`;

  try {
    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const content = typeof response === "string" ? response : response.content;

    return {
      content: content || "Deep analysis unavailable.",
      sources,
      mode: "pro",
      signals,
      sentiment,
    };
  } catch (error) {
    console.error("Pro flow error:", error);
    return {
      content: "I encountered an error during deep analysis. Please try again.",
      sources: [],
      mode: "pro",
    };
  }
}
