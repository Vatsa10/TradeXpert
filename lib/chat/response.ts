import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { Mode, LLMResponse, QueryContext, Trend, Advice, DataQuality, Source, SignalBundle } from "./types";
import { assessDataQuality } from "./context-builder";
import { calibrateConfidence, getDataQuality } from "./confidence";
import { withRateLimit, setCooldown } from "./rate-limiter";

const fastLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite-preview",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 1024,
  temperature: 0.3,
}) as any;

const proLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-preview",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 2048,
  temperature: 0.3,
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
- For comparison queries, explicitly compare both assets using available numeric fields
- Mention data gaps per asset instead of generic "missing data"
- Include at least one past-vs-current comparison (1D move, 52-week range position, or YoY growth)
- confidence must be 0.0-1.0 (float)
- trend must be exactly "bullish", "bearish", or "neutral"
- advice must be exactly "Buy", "Hold", "Sell", or "Wait"
`;

const llmOutputSchema = z.object({
  summary: z.string().min(1),
  trend: z.enum(["bullish", "bearish", "neutral"]),
  reasoning: z.array(z.string()).min(1),
  advice: z.enum(["Buy", "Hold", "Sell", "Wait"]),
  confidence: z.number().min(0).max(1),
  signalTrace: z.array(z.string()).optional().default([]),
});

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

  const multiStockData = context.multiStockData;
  if (multiStockData && Object.keys(multiStockData).length > 1) {
    prompt += `### STOCK COMPARISON\n`;
    for (const [symbol, data] of Object.entries(multiStockData) as [string, any][]) {
      prompt += `\n## ${symbol}\n`;
      if (data.price) {
        prompt += `Price: $${data.price.current} (${data.price.changePercent.toFixed(2)}%)\n`;
      }
      if (data.metrics) {
        const metricsBits: string[] = [];
        if (typeof data.metrics.pe_ratio === "number") metricsBits.push(`P/E: ${data.metrics.pe_ratio.toFixed(1)}`);
        if (typeof data.metrics.market_cap === "number") metricsBits.push(`Market Cap: $${(data.metrics.market_cap / 1e9).toFixed(1)}B`);
        if (typeof data.metrics.revenue_growth === "number") metricsBits.push(`Revenue Growth: ${data.metrics.revenue_growth.toFixed(1)}%`);
        if (typeof data.metrics.return_1m === "number") metricsBits.push(`1M Return: ${data.metrics.return_1m.toFixed(2)}%`);
        if (typeof data.metrics.return_3m === "number") metricsBits.push(`3M Return: ${data.metrics.return_3m.toFixed(2)}%`);
        if (typeof data.metrics.fifty_two_week_high === "number") metricsBits.push(`52W High: $${data.metrics.fifty_two_week_high.toFixed(2)}`);
        if (typeof data.metrics.fifty_two_week_low === "number") metricsBits.push(`52W Low: $${data.metrics.fifty_two_week_low.toFixed(2)}`);
        if (metricsBits.length > 0) {
          prompt += `${metricsBits.join(" | ")}\n`;
        }
      }
      if (data.news && data.news.length > 0) {
        prompt += `Top News: ${data.news[0].headline.substring(0, 80)}...\n`;
      }
    }
  }

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

  if (context.technicalIndicators) {
    prompt += `
### TECHNICAL INDICATORS
${context.technicalIndicators.rsi ? `- RSI: ${context.technicalIndicators.rsi.value?.toFixed(1)} (${context.technicalIndicators.rsi.signal})` : ""}
${context.technicalIndicators.macd ? `- MACD: ${context.technicalIndicators.macd.signal} (histogram: ${context.technicalIndicators.macd.histogram?.toFixed(2)})` : ""}
${context.technicalIndicators.adx ? `- ADX: ${context.technicalIndicators.adx.value?.toFixed(1)} (${context.technicalIndicators.adx.signal})` : ""}
${context.technicalIndicators.sma20 ? `- SMA 20: $${context.technicalIndicators.sma20?.toFixed(2)}` : ""}
`;
  }

  if (context.news && context.news.length > 0) {
    prompt += `
### NEWS
${context.news.slice(0, 3).map((n, i) => `${i + 1}. ${n.headline.substring(0, 100)}`).join("\n")}
`;
  }

  if (context.searchResults && context.searchResults.length > 0) {
    prompt += `
### SEARCH RESULTS
${context.searchResults.slice(0, 2).map((r, i) => `${i + 1}. ${r.title.substring(0, 80)}`).join("\n")}
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

    const parsedJson = JSON.parse(jsonMatch[0]);
    const parsed = llmOutputSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return null;
    }

    return {
      summary: parsed.data.summary,
      trend: parsed.data.trend as Trend,
      reasoning: parsed.data.reasoning,
      advice: parsed.data.advice as Advice,
      confidence: Math.max(0, Math.min(1, parsed.data.confidence)),
      signalTrace: parsed.data.signalTrace,
    };
  } catch {
    return null;
  }
}

function createFallbackResponse(context: QueryContext, customMessage?: string): LLMResponse {
  const hasData = context.priceData || context.news?.length || context.searchResults?.length;

  return {
    summary: customMessage || (hasData
      ? "Analysis completed based on available market data."
      : "Insufficient data available for comprehensive analysis."),
    trend: "neutral" as Trend,
    reasoning: hasData ? ["Based on available market data"] : ["No data available for analysis"],
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

Grounding requirements:
- Use exact numbers from the context when available
- If quoting a move, include the symbol and percentage
- For two-stock comparison, provide at least one point for each stock
- Prefer market data coming from aggregator inputs (price, metrics, and company news)
- Use clear, structured English and avoid vague statements

Provide your analysis as JSON following the schema above.
`;

  try {
    const llmCall = async () => {
      return await llm.invoke([
        { role: "system", content: getSystemPrompt(mode, currentDate) },
        { role: "user", content: userPrompt },
      ]);
    };

    let response;
    try {
      response = await withRateLimit("gemini", llmCall, true);
    } catch (rateLimitError: any) {
      console.warn("[Response] Rate limited, using fallback:", rateLimitError.message);
      const fallback = createFallbackResponse(context, "Rate limited. Please try again in a moment.");
      fallback.confidence = calibrateConfidence(0.2, context, context.intent);
      fallback.dataQuality = getDataQuality(context);
      return fallback;
    }

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
  } catch (error: any) {
    console.error("LLM response error:", error?.message || error);

    if (error?.status === 429) {
      setCooldown("gemini", 60000);
      const fallback = createFallbackResponse(context, "API rate limit reached. Please wait a moment.");
      fallback.confidence = 0.1;
      fallback.dataQuality = "low";
      return fallback;
    }

    return createFallbackResponse(context);
  }
}

function collectSources(context: QueryContext): Source[] {
  const sources: Source[] = [];

  if (context.priceData) {
    sources.push({ type: "finnhub", title: "Aggregator Price Feed" });
  }
  if (context.metrics) {
    sources.push({ type: "finnhub", title: "Aggregator Financial Metrics" });
  }
  if (context.news && context.news.length > 0) {
    sources.push({ type: "news", title: "Aggregator Company News" });
  }
  if (context.searchResults && context.searchResults.length > 0) {
    sources.push({ type: "search", title: "Web Search" });
  }
  if (context.sentiment) {
    sources.push({ type: "llm", title: "Sentiment Analysis" });
  }

  return sources;
}

function formatMoney(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

function formatPercent(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatNumber(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toFixed(1);
}

function getEdgeLabel(
  labelA: string,
  valueA?: number | null,
  labelB?: string,
  valueB?: number | null,
  lowerIsBetter: boolean = false
): string {
  if (!labelB || typeof valueA !== "number" || typeof valueB !== "number") return "-";
  if (Math.abs(valueA - valueB) < 1e-9) return "Tie";
  const aBetter = lowerIsBetter ? valueA < valueB : valueA > valueB;
  return aBetter ? labelA : labelB;
}

function computeDistancePercent(current?: number | null, reference?: number | null): number | null {
  if (
    typeof current !== "number" ||
    typeof reference !== "number" ||
    !Number.isFinite(current) ||
    !Number.isFinite(reference) ||
    reference === 0
  ) {
    return null;
  }
  return ((current - reference) / reference) * 100;
}

function createTextTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, index) => {
    const rowWidth = rows.reduce((max, row) => Math.max(max, (row[index] || "").length), 0);
    return Math.max(header.length, rowWidth);
  });

  const drawRow = (cols: string[]) => {
    return `| ${cols.map((cell, idx) => (cell || "").padEnd(widths[idx], " ")).join(" | ")} |`;
  };

  const divider = `+-${widths.map((w) => "-".repeat(w)).join("-+-")}-+`;

  const lines = [divider, drawRow(headers), divider];
  for (const row of rows) {
    lines.push(drawRow(row));
  }
  lines.push(divider);

  return lines.join("\n");
}

function getComparisonLeader(context: QueryContext): string | null {
  const multiStockData = context.multiStockData;
  if (!multiStockData) return null;

  const symbols = Object.keys(multiStockData);
  if (symbols.length < 2) return null;

  const [aSymbol, bSymbol] = symbols;
  const a = multiStockData[aSymbol];
  const b = multiStockData[bSymbol];
  let aScore = 0;
  let bScore = 0;

  const aGrowth = a?.metrics?.revenue_growth;
  const bGrowth = b?.metrics?.revenue_growth;
  if (typeof aGrowth === "number" && typeof bGrowth === "number") {
    if (aGrowth > bGrowth) aScore += 1;
    if (bGrowth > aGrowth) bScore += 1;
  }

  const aPE = a?.metrics?.pe_ratio;
  const bPE = b?.metrics?.pe_ratio;
  if (typeof aPE === "number" && typeof bPE === "number") {
    if (aPE < bPE) aScore += 1;
    if (bPE < aPE) bScore += 1;
  }

  const aMove = a?.price?.changePercent;
  const bMove = b?.price?.changePercent;
  if (typeof aMove === "number" && typeof bMove === "number") {
    if (aMove > bMove) aScore += 1;
    if (bMove > aMove) bScore += 1;
  }

  if (aScore === bScore) return null;
  return aScore > bScore ? aSymbol : bSymbol;
}

function buildComparisonTable(context: QueryContext): string {
  const multiStockData = context.multiStockData;
  if (!multiStockData) return "";

  const symbols = Object.keys(multiStockData);
  if (symbols.length < 2) return "";

  const first = symbols[0];
  const second = symbols[1];
  const a = multiStockData[first];
  const b = multiStockData[second];

  const aPrice = a?.price?.current;
  const bPrice = b?.price?.current;
  const aMove = a?.price?.changePercent;
  const bMove = b?.price?.changePercent;
  const aPE = a?.metrics?.pe_ratio;
  const bPE = b?.metrics?.pe_ratio;
  const aGrowth = a?.metrics?.revenue_growth;
  const bGrowth = b?.metrics?.revenue_growth;
  const aCap = a?.metrics?.market_cap;
  const bCap = b?.metrics?.market_cap;
  const aHigh52 = a?.metrics?.fifty_two_week_high;
  const bHigh52 = b?.metrics?.fifty_two_week_high;
  const aLow52 = a?.metrics?.fifty_two_week_low;
  const bLow52 = b?.metrics?.fifty_two_week_low;
  const aDistHigh52 = computeDistancePercent(aPrice, aHigh52);
  const bDistHigh52 = computeDistancePercent(bPrice, bHigh52);
  const aDistLow52 = computeDistancePercent(aPrice, aLow52);
  const bDistLow52 = computeDistancePercent(bPrice, bLow52);

  const aReturn1m = a?.metrics?.return_1m;
  const bReturn1m = b?.metrics?.return_1m;
  const aReturn3m = a?.metrics?.return_3m;
  const bReturn3m = b?.metrics?.return_3m;
  const aReturn52w = a?.metrics?.return_52w;
  const bReturn52w = b?.metrics?.return_52w;

  const rows: string[][] = [];
  if (typeof aPrice === "number" || typeof bPrice === "number") {
    rows.push(["Price", formatMoney(aPrice), formatMoney(bPrice), "-"]);
  }
  if (typeof aMove === "number" || typeof bMove === "number") {
    rows.push(["1D Move", formatPercent(aMove), formatPercent(bMove), getEdgeLabel(first, aMove, second, bMove)]);
  }
  if (typeof aPE === "number" || typeof bPE === "number") {
    rows.push(["P/E", formatNumber(aPE), formatNumber(bPE), getEdgeLabel(first, aPE, second, bPE, true)]);
  }
  if (typeof aGrowth === "number" || typeof bGrowth === "number") {
    rows.push(["Revenue Growth (YoY)", formatPercent(aGrowth), formatPercent(bGrowth), getEdgeLabel(first, aGrowth, second, bGrowth)]);
  }
  if (typeof aCap === "number" || typeof bCap === "number") {
    rows.push(["Market Cap", formatMoney(aCap), formatMoney(bCap), getEdgeLabel(first, aCap, second, bCap)]);
  }
  if (typeof aReturn1m === "number" || typeof bReturn1m === "number") {
    rows.push(["1M Return", formatPercent(aReturn1m), formatPercent(bReturn1m), getEdgeLabel(first, aReturn1m, second, bReturn1m)]);
  }
  if (typeof aReturn3m === "number" || typeof bReturn3m === "number") {
    rows.push(["3M Return", formatPercent(aReturn3m), formatPercent(bReturn3m), getEdgeLabel(first, aReturn3m, second, bReturn3m)]);
  }
  if (typeof aReturn52w === "number" || typeof bReturn52w === "number") {
    rows.push(["52W Return", formatPercent(aReturn52w), formatPercent(bReturn52w), getEdgeLabel(first, aReturn52w, second, bReturn52w)]);
  }
  if (aDistHigh52 !== null || bDistHigh52 !== null) {
    rows.push(["Distance to 52W High", formatPercent(aDistHigh52), formatPercent(bDistHigh52), getEdgeLabel(first, aDistHigh52, second, bDistHigh52)]);
  }
  if (aDistLow52 !== null || bDistLow52 !== null) {
    rows.push(["Distance to 52W Low", formatPercent(aDistLow52), formatPercent(bDistLow52), getEdgeLabel(first, aDistLow52, second, bDistLow52)]);
  }

  if (rows.length === 0) return "";

  return `Comparison Table\n${createTextTable(["Metric", first, second, "Edge"], rows)}\n\n`;
}

function buildHistoricalContext(context: QueryContext): string {
  if (context.multiStockData && Object.keys(context.multiStockData).length > 1) {
    const symbols = Object.keys(context.multiStockData).slice(0, 2);
    const lines: string[] = [];

    for (const symbol of symbols) {
      const data = context.multiStockData[symbol];
      const current = data?.price?.current;
      const high52 = data?.metrics?.fifty_two_week_high;
      const low52 = data?.metrics?.fifty_two_week_low;
      const distHigh = computeDistancePercent(current, high52);
      const distLow = computeDistancePercent(current, low52);
      const growth = data?.metrics?.revenue_growth;
      const ret1m = data?.metrics?.return_1m;
      const ret3m = data?.metrics?.return_3m;

      const parts = [`${symbol}:`];
      if (distHigh !== null) parts.push(`${formatPercent(distHigh)} vs 52W high`);
      if (distLow !== null) parts.push(`${formatPercent(distLow)} vs 52W low`);
      if (typeof growth === "number") parts.push(`${formatPercent(growth)} YoY revenue growth`);
      if (typeof ret1m === "number") parts.push(`${formatPercent(ret1m)} over 1 month`);
      if (typeof ret3m === "number") parts.push(`${formatPercent(ret3m)} over 3 months`);

      if (parts.length > 1) {
        lines.push(`- ${parts.join(" ")}`);
      }
    }

    if (lines.length > 0) {
      return `Past vs Current\n${lines.join("\n")}\n\n`;
    }
  }

  if (context.priceData) {
    const distFromPrevClose = context.priceData.prevClose
      ? computeDistancePercent(context.priceData.current, context.priceData.prevClose)
      : null;
    const distFromOpen = context.priceData.open
      ? computeDistancePercent(context.priceData.current, context.priceData.open)
      : null;
    const growth = context.metrics?.revenue_growth;
    const points: string[] = [];

    if (distFromPrevClose !== null) points.push(`- ${formatPercent(distFromPrevClose)} vs previous close`);
    if (distFromOpen !== null) points.push(`- ${formatPercent(distFromOpen)} vs today open`);
    if (typeof growth === "number") points.push(`- ${formatPercent(growth)} YoY revenue growth`);

    if (points.length > 0) {
      return `Past vs Current\n${points.join("\n")}\n\n`;
    }
  }

  return "";
}

function buildActionablePlan(response: LLMResponse, context: QueryContext): string {
  const leader = getComparisonLeader(context);
  const leaderText = leader ? ` Focus watchlist priority on ${leader}.` : "";
  let weekPlan = "";
  let monthPlan = "";

  switch (response.advice) {
    case "Buy":
      weekPlan = `Start with phased entries (2-3 tranches) instead of one order.${leaderText}`;
      monthPlan = "Add only if price action and headline flow remain supportive; rebalance if valuation premium stretches further.";
      break;
    case "Hold":
      weekPlan = "Keep position size steady and avoid chasing intraday moves.";
      monthPlan = "Review earnings/news trend and relative valuation before increasing exposure.";
      break;
    case "Sell":
      weekPlan = "Reduce exposure in staged exits to avoid poor fills during volatility.";
      monthPlan = "Re-enter only if fundamentals and momentum stabilize versus peers.";
      break;
    default:
      weekPlan = `Wait for cleaner confirmation (price stabilization + clearer catalyst direction).${leaderText}`;
      monthPlan = "Reassess after the next major catalyst cycle (earnings, guidance, or regulatory updates).";
      break;
  }

  return `Actionable Plan\n- 1-2 week: ${weekPlan}\n- 1-3 month: ${monthPlan}\n\n`;
}

function buildDataCoverage(context: QueryContext): string {
  if (!context.multiStockData || Object.keys(context.multiStockData).length < 2) return "";

  const symbols = Object.keys(context.multiStockData).slice(0, 2);
  const lines = symbols.map((symbol) => {
    const data = context.multiStockData?.[symbol];
    const fields = [
      typeof data?.price?.current === "number",
      typeof data?.metrics?.pe_ratio === "number",
      typeof data?.metrics?.market_cap === "number",
      typeof data?.metrics?.revenue_growth === "number",
      Array.isArray(data?.news) && (data?.news?.length || 0) > 0,
      typeof data?.metrics?.return_1m === "number" || typeof data?.metrics?.return_3m === "number" || typeof data?.metrics?.return_52w === "number",
    ];
    const available = fields.filter(Boolean).length;
    return `- ${symbol}: ${available}/6 key fields available`;
  });

  return `Data Coverage\n${lines.join("\n")}\n\n`;
}

export function transformForMarkdown(response: LLMResponse, context: QueryContext): string {
  let output = `Investment Summary\n${response.summary}\n\n`;
  output += "Decision Snapshot\n";
  output += `- Trend: ${response.trend.toUpperCase()}\n`;
  output += `- Advice: ${response.advice}\n`;
  output += `- Confidence: ${(response.confidence * 100).toFixed(0)}%\n`;
  output += `- Data Quality: ${response.dataQuality === "high" ? "High" : response.dataQuality === "medium" ? "Medium" : "Low"}\n\n`;
  output += "All primary comparison metrics are sourced from the aggregator pipeline (Finnhub, Alpha Vantage, NewsAPI).\n\n";

  const dataCoverage = buildDataCoverage(context);
  if (dataCoverage) output += dataCoverage;

  const comparisonTable = buildComparisonTable(context);
  if (comparisonTable) output += comparisonTable;

  const historicalContext = buildHistoricalContext(context);
  if (historicalContext) output += historicalContext;

  if (response.reasoning.length > 0) {
    output += "Reasoning\n";
    response.reasoning.forEach((r, i) => {
      output += `${i + 1}. ${r}\n`;
    });
    output += "\n";
  }

  if (context.sentiment) {
    output += "Sentiment\n";
    output += `- Overall: ${context.sentiment.overallSentiment.toUpperCase()}\n`;
    output += `- Confidence: ${(context.sentiment.confidence * 100).toFixed(0)}%\n`;
    if (context.sentiment.macroSignals.length > 0) {
      output += `- Signals: ${context.sentiment.macroSignals.join(", ")}\n`;
    }
    output += "\n";
  }

  if (response.signalTrace.length > 0) {
    output += "Signal Trace\n";
    response.signalTrace.forEach((s) => {
      output += `- ${s}\n`;
    });
    output += "\n";
  }

  if (context.news && context.news.length > 0) {
    output += "Recent Catalysts\n";
    context.news.slice(0, 3).forEach((n, idx) => {
      output += `${idx + 1}. ${n.headline}\n`;
    });
    output += "\n";
  }

  output += buildActionablePlan(response, context);

  if (response.sources.length > 0) {
    output += "Sources\n";
    response.sources.forEach((s) => {
      output += `- ${s.title || s.type}\n`;
    });
  }

  return output;
}
