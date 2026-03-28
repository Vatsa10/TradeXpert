import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { Advice, LLMResponse, Mode, QueryContext, SignalBundle, Source, Trend } from "./types";
import { assessDataQuality } from "./context-builder";
import { calibrateConfidence, getDataQuality } from "./confidence";
import { setCooldown, withRateLimit } from "./rate-limiter";

const fastLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite-preview",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 1024,
  temperature: 0.25,
}) as any;

const proFlashLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 1400,
  temperature: 0.2,
}) as any;

const proReasoningLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-pro-preview",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 2200,
  temperature: 0.15,
}) as any;

const PRO_DEADLINE_MS = 15000;

const OUTPUT_SCHEMA = `
Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence conclusion",
  "trend": "bullish" | "bearish" | "neutral",
  "reasoning": ["point with numbers", "point with numbers", "point with numbers"],
  "advice": "Buy" | "Hold" | "Sell" | "Wait",
  "recommendation": "explicit winner or no clear winner",
  "confidence": 0.0-1.0,
  "signalTrace": ["signal 1", "signal 2"]
}

Strict rules:
- Use only provided context data
- Do not fabricate events or numbers
- Every reasoning point must include at least one numeric value
- For comparison queries, choose one option if confidence > 0.5, otherwise clearly say no clear winner
- Keep reasoning concrete, avoid generic lines
`;

const llmOutputSchema = z.object({
  summary: z.string().min(1),
  trend: z.enum(["bullish", "bearish", "neutral"]),
  reasoning: z.array(z.string()).min(1),
  advice: z.enum(["Buy", "Hold", "Sell", "Wait"]),
  recommendation: z.string().optional().default(""),
  confidence: z.number().min(0).max(1),
  signalTrace: z.array(z.string()).optional().default([]),
});

const SIGNAL_WEIGHTS: Record<string, number> = {
  fundamental_positive: 1.5,
  bullish_signal: 1,
  bearish_signal: -1,
  geopolitical_risk: -1.2,
  macro_risk: -1.5,
};

function isComparisonQuery(query: string): boolean {
  return /\b(vs|versus|compare|or)\b/i.test(query);
}

function sanitizeText(input: string): string {
  if (!input) return "";
  const blockedPatterns = [
    /rate limited/gi,
    /too many requests/gi,
    /api error/gi,
    /429/gi,
    /retry/gi,
  ];
  let cleaned = input;
  blockedPatterns.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, "");
  });
  return cleaned.replace(/\s{2,}/g, " ").trim();
}

function getSystemPrompt(mode: Mode, currentDate: string, comparison: boolean): string {
  const role = mode === "pro"
    ? "You are TradeXpert AI, a senior investment strategist."
    : mode === "thinking"
      ? "You are TradeXpert AI, an institutional-grade analyst."
      : "You are TradeXpert AI, a practical market assistant.";

  return `${role} Today's date is ${currentDate}. ${comparison ? "This is a comparison query. You must provide a direct decision when confidence is adequate." : ""}\n${OUTPUT_SCHEMA}`;
}

function formatMoney(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
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

function createTextTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, idx) => {
    const maxRow = rows.reduce((acc, row) => Math.max(acc, (row[idx] || "").length), 0);
    return Math.max(header.length, maxRow);
  });

  const drawRow = (cols: string[]) => `| ${cols.map((col, idx) => (col || "").padEnd(widths[idx], " ")).join(" | ")} |`;
  const divider = `+-${widths.map((w) => "-".repeat(w)).join("-+-")}-+`;

  const lines = [divider, drawRow(headers), divider];
  rows.forEach((row) => lines.push(drawRow(row)));
  lines.push(divider);
  return lines.join("\n");
}

function getEdgeLabel(
  symbolA: string,
  valueA?: number | null,
  symbolB?: string,
  valueB?: number | null,
  lowerIsBetter: boolean = false
): string {
  if (!symbolB || typeof valueA !== "number" || typeof valueB !== "number") return "-";
  if (Math.abs(valueA - valueB) < 1e-9) return "Tie";
  const aBetter = lowerIsBetter ? valueA < valueB : valueA > valueB;
  return aBetter ? symbolA : symbolB;
}

function computeDistancePercent(current?: number | null, reference?: number | null): number | null {
  if (
    typeof current !== "number" ||
    typeof reference !== "number" ||
    !Number.isFinite(current) ||
    !Number.isFinite(reference) ||
    reference === 0
  ) return null;

  return ((current - reference) / reference) * 100;
}

function buildContextPrompt(context: QueryContext): string {
  let prompt = "";

  if (context.multiStockData && Object.keys(context.multiStockData).length > 1) {
    prompt += "STOCK COMPARISON DATA\n";
    Object.entries(context.multiStockData).forEach(([symbol, data]) => {
      prompt += `\n${symbol}\n`;
      if (data.price) {
        prompt += `Price: ${data.price.current}; 1D Move: ${data.price.changePercent.toFixed(2)}%\n`;
      }
      if (data.metrics) {
        const bits: string[] = [];
        if (typeof data.metrics.pe_ratio === "number") bits.push(`P/E ${data.metrics.pe_ratio.toFixed(1)}`);
        if (typeof data.metrics.revenue_growth === "number") bits.push(`RevGrowth ${data.metrics.revenue_growth.toFixed(2)}%`);
        if (typeof data.metrics.market_cap === "number") bits.push(`MCap ${data.metrics.market_cap}`);
        if (typeof data.metrics.return_1m === "number") bits.push(`1M ${data.metrics.return_1m.toFixed(2)}%`);
        if (typeof data.metrics.return_3m === "number") bits.push(`3M ${data.metrics.return_3m.toFixed(2)}%`);
        if (typeof data.metrics.return_52w === "number") bits.push(`52W ${data.metrics.return_52w.toFixed(2)}%`);
        if (bits.length > 0) prompt += `${bits.join(" | ")}\n`;
      }
      if (data.news?.length) {
        prompt += `TopNews: ${data.news[0].headline}\n`;
      }
    });
  }

  if (context.priceData) {
    prompt += `\nPRICE\nCurrent ${context.priceData.current}; Change ${context.priceData.changePercent.toFixed(2)}%; High ${context.priceData.high}; Low ${context.priceData.low}\n`;
  }

  if (context.metrics) {
    const bits: string[] = [];
    if (typeof context.metrics.pe_ratio === "number") bits.push(`P/E ${context.metrics.pe_ratio.toFixed(1)}`);
    if (typeof context.metrics.market_cap === "number") bits.push(`MCap ${context.metrics.market_cap}`);
    if (typeof context.metrics.revenue_growth === "number") bits.push(`RevGrowth ${context.metrics.revenue_growth.toFixed(2)}%`);
    if (typeof context.metrics.return_1m === "number") bits.push(`1M ${context.metrics.return_1m.toFixed(2)}%`);
    if (typeof context.metrics.return_3m === "number") bits.push(`3M ${context.metrics.return_3m.toFixed(2)}%`);
    if (bits.length > 0) prompt += `\nMETRICS\n${bits.join(" | ")}\n`;
  }

  if (context.news?.length) {
    prompt += `\nNEWS\n${context.news.slice(0, 3).map((n, i) => `${i + 1}. ${n.headline}`).join("\n")}\n`;
  }

  if (context.sentiment) {
    prompt += `\nSENTIMENT\nOverall ${context.sentiment.overallSentiment}; Confidence ${(context.sentiment.confidence * 100).toFixed(0)}%; Signals ${context.sentiment.macroSignals.join(", ")}\n`;
  }

  return prompt;
}

function parseJSONResponse(raw: string): Partial<LLMResponse> | null {
  const content = typeof raw === "string" ? raw : String(raw || "");
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = llmOutputSchema.safeParse(JSON.parse(match[0]));
    if (!parsed.success) return null;

    return {
      summary: parsed.data.summary,
      trend: parsed.data.trend,
      reasoning: parsed.data.reasoning,
      advice: parsed.data.advice,
      recommendation: parsed.data.recommendation,
      confidence: parsed.data.confidence,
      signalTrace: parsed.data.signalTrace,
    };
  } catch {
    return null;
  }
}

function buildFallbackReasoning(context: QueryContext): string[] {
  const points: string[] = [];

  if (context.multiStockData && Object.keys(context.multiStockData).length >= 2) {
    const [symbolA, symbolB] = Object.keys(context.multiStockData);
    const a = context.multiStockData[symbolA];
    const b = context.multiStockData[symbolB];

    if (typeof a?.metrics?.pe_ratio === "number" && typeof b?.metrics?.pe_ratio === "number") {
      points.push(`${symbolA} P/E is ${a.metrics.pe_ratio.toFixed(1)} versus ${symbolB} at ${b.metrics.pe_ratio.toFixed(1)}.`);
    }
    if (typeof a?.metrics?.revenue_growth === "number" && typeof b?.metrics?.revenue_growth === "number") {
      points.push(`${symbolA} revenue growth is ${a.metrics.revenue_growth.toFixed(2)}% versus ${symbolB} at ${b.metrics.revenue_growth.toFixed(2)}%.`);
    }
    if (typeof a?.price?.changePercent === "number" && typeof b?.price?.changePercent === "number") {
      points.push(`${symbolA} 1-day move is ${a.price.changePercent.toFixed(2)}% versus ${symbolB} at ${b.price.changePercent.toFixed(2)}%.`);
    }
  }

  if (points.length < 3 && context.priceData) {
    points.push(`Latest price is ${context.priceData.current.toFixed(2)} with a 1-day change of ${context.priceData.changePercent.toFixed(2)}%.`);
  }
  if (points.length < 3 && typeof context.metrics?.market_cap === "number") {
    points.push(`Market capitalization is ${formatMoney(context.metrics.market_cap)} based on aggregator metrics.`);
  }
  if (points.length < 3 && context.news?.length) {
    points.push(`Recent catalyst count is ${context.news.length} headlines in the current context window.`);
  }

  while (points.length < 3) {
    points.push("Data coverage is limited for one or more metrics, reducing conviction.");
  }

  return points.slice(0, 4);
}

function getSignalScore(context: QueryContext): number {
  const signals = context.sentiment?.macroSignals || [];
  return signals.reduce((acc, signal) => acc + (SIGNAL_WEIGHTS[signal] || 0), 0);
}

function buildComparisonScores(context: QueryContext): Record<string, number> {
  const result: Record<string, number> = {};
  if (!context.multiStockData) return result;
  const symbols = Object.keys(context.multiStockData);
  if (symbols.length < 2) return result;

  const [aSymbol, bSymbol] = symbols;
  const a = context.multiStockData[aSymbol];
  const b = context.multiStockData[bSymbol];
  result[aSymbol] = 0;
  result[bSymbol] = 0;

  const aPE = a?.metrics?.pe_ratio;
  const bPE = b?.metrics?.pe_ratio;
  if (typeof aPE === "number" && typeof bPE === "number") {
    if (aPE < bPE) result[aSymbol] += 1.2;
    else if (bPE < aPE) result[bSymbol] += 1.2;
  }

  const aGrowth = a?.metrics?.revenue_growth;
  const bGrowth = b?.metrics?.revenue_growth;
  if (typeof aGrowth === "number" && typeof bGrowth === "number") {
    if (aGrowth > bGrowth) result[aSymbol] += 1.5;
    else if (bGrowth > aGrowth) result[bSymbol] += 1.5;
  }

  const a3m = a?.metrics?.return_3m;
  const b3m = b?.metrics?.return_3m;
  if (typeof a3m === "number" && typeof b3m === "number") {
    if (a3m > b3m) result[aSymbol] += 1.0;
    else if (b3m > a3m) result[bSymbol] += 1.0;
  }

  const a1d = a?.price?.changePercent;
  const b1d = b?.price?.changePercent;
  if (typeof a1d === "number" && typeof b1d === "number") {
    if (a1d > b1d) result[aSymbol] += 0.5;
    else if (b1d > a1d) result[bSymbol] += 0.5;
  }

  return result;
}

function enforceDecisionPolicy(
  parsed: Partial<LLMResponse>,
  query: string,
  context: QueryContext,
  calibratedConfidence: number
): { advice: Advice; recommendation: string } {
  const comparison = isComparisonQuery(query) || context.intent === "comparison";
  if (!comparison) {
    return {
      advice: (parsed.advice as Advice) || "Hold",
      recommendation: sanitizeText(parsed.recommendation || ""),
    };
  }

  const scores = buildComparisonScores(context);
  const symbols = Object.keys(scores);
  if (symbols.length < 2) {
    return { advice: "Wait", recommendation: "No clear winner due limited comparative data." };
  }

  const [a, b] = symbols;
  const aScore = scores[a];
  const bScore = scores[b];
  const preferred = aScore === bScore ? "" : aScore > bScore ? a : b;

  if (calibratedConfidence > 0.6 && preferred) {
    return { advice: "Buy", recommendation: `Prefer ${preferred} over ${preferred === a ? b : a} on current comparative metrics.` };
  }

  if (calibratedConfidence >= 0.4 && calibratedConfidence <= 0.6 && preferred) {
    return { advice: "Hold", recommendation: `Slight preference for ${preferred}, but conviction is moderate.` };
  }

  return { advice: "Wait", recommendation: "No clear winner at current confidence; wait for stronger confirmation." };
}

function shouldRunProReviewer(
  parsed: Partial<LLMResponse> | null,
  query: string,
  context: QueryContext,
  startTime: number
): boolean {
  if (Date.now() - startTime > 7000) return false;
  if (isComparisonQuery(query) || context.intent === "comparison") return true;
  if (!parsed) return true;

  const weakReasoning = !parsed.reasoning || parsed.reasoning.some((r) => !/\d/.test(r));
  if (weakReasoning) return true;
  if ((parsed.confidence || 0) < 0.5) return true;

  return false;
}

async function callLLM(
  llm: any,
  systemPrompt: string,
  userPrompt: string,
  rateLimitKey: string
): Promise<string | null> {
  const call = async () => {
    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    return typeof response === "string" ? response : response.content;
  };

  try {
    const result = await withRateLimit(rateLimitKey, call, true);
    return typeof result === "string" ? result : String(result || "");
  } catch {
    return null;
  }
}

function mergeProResponses(draft: Partial<LLMResponse> | null, reviewed: Partial<LLMResponse> | null): Partial<LLMResponse> | null {
  if (!draft && !reviewed) return null;
  if (!draft) return reviewed;
  if (!reviewed) return draft;

  const draftScore = (draft.reasoning || []).filter((r) => /\d/.test(r)).length;
  const reviewedScore = (reviewed.reasoning || []).filter((r) => /\d/.test(r)).length;

  return reviewedScore >= draftScore ? { ...draft, ...reviewed } : draft;
}

function collectSources(context: QueryContext): Source[] {
  const sources: Source[] = [];
  if (context.priceData) sources.push({ type: "finnhub", title: "Aggregator Price Feed" });
  if (context.metrics) sources.push({ type: "finnhub", title: "Aggregator Financial Metrics" });
  if (context.news?.length) sources.push({ type: "news", title: "Aggregator Company News" });
  if (context.searchResults?.length) sources.push({ type: "search", title: "Web Search" });
  if (context.sentiment) sources.push({ type: "llm", title: "Sentiment Analysis" });
  return sources;
}

function createFallbackResponse(context: QueryContext): LLMResponse {
  return {
    summary: "Analysis is temporarily unavailable. Please retry.",
    trend: "neutral",
    reasoning: buildFallbackReasoning(context),
    advice: "Wait",
    recommendation: context.intent === "comparison" ? "No clear winner due current system constraints." : "",
    confidence: 0.2,
    dataQuality: assessDataQuality(context),
    sources: collectSources(context),
    signalTrace: [],
  };
}

function applyTrendAdjustment(initialTrend: Trend, context: QueryContext): Trend {
  const score = getSignalScore(context);
  if (score <= -1.5) return "bearish";
  if (score >= 1.5) return "bullish";
  return initialTrend;
}

function ensureValidResponse(
  parsed: Partial<LLMResponse> | null,
  query: string,
  context: QueryContext,
  signals: SignalBundle | undefined
): LLMResponse {
  if (!parsed) return createFallbackResponse(context);

  const confidence = calibrateConfidence(parsed.confidence ?? 0.35, context, context.intent);
  const policy = enforceDecisionPolicy(parsed, query, context, confidence);
  const trend = applyTrendAdjustment((parsed.trend as Trend) || "neutral", context);
  const reasoning = (parsed.reasoning || []).filter((line) => sanitizeText(line).length > 0);

  return {
    summary: sanitizeText(parsed.summary || "Analysis completed based on available data.") || "Analysis completed based on available data.",
    trend,
    reasoning: reasoning.length >= 3 ? reasoning : buildFallbackReasoning(context),
    advice: policy.advice,
    recommendation: policy.recommendation,
    confidence,
    dataQuality: getDataQuality(context),
    sources: collectSources(context),
    signalTrace: parsed.signalTrace?.length ? parsed.signalTrace : (signals?.signals.map((s) => s.indicator) || []),
  };
}

export async function generateLLMResponse(
  query: string,
  context: QueryContext,
  signals: SignalBundle | undefined,
  mode: Mode
): Promise<LLMResponse> {
  const startTime = Date.now();
  const comparison = isComparisonQuery(query) || context.intent === "comparison";
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const contextPrompt = buildContextPrompt(context);
  const signalPrompt = signals
    ? `\nSIGNALS\n${signals.signals.map((s) => `- ${s.indicator}: ${s.signal} (${s.reasoning})`).join("\n")}\nOverall: ${signals.overallTrend}`
    : "";

  const userPrompt = `
Query: ${query}

${contextPrompt}
${signalPrompt}

Grounding requirements:
- Use exact numbers from context
- Include at least 3 reasoning points with numbers
- For comparison queries, produce a direct recommendation
- Prefer aggregator data over narrative assumptions
`;

  try {
    if (mode !== "pro") {
      const raw = await callLLM(
        fastLLM,
        getSystemPrompt(mode, currentDate, comparison),
        userPrompt,
        "gemini"
      );
      return ensureValidResponse(parseJSONResponse(raw || ""), query, context, signals);
    }

    const draftRaw = await callLLM(
      proFlashLLM,
      getSystemPrompt("pro", currentDate, comparison),
      userPrompt,
      "gemini-pro-flash"
    );
    const draftParsed = parseJSONResponse(draftRaw || "");

    let finalParsed: Partial<LLMResponse> | null = draftParsed;

    const withinDeadline = Date.now() - startTime < PRO_DEADLINE_MS;
    if (withinDeadline && shouldRunProReviewer(draftParsed, query, context, startTime)) {
      const reviewPrompt = `
You are reviewing a draft investment response. Improve reasoning clarity and decision quality without inventing data.

DRAFT JSON:
${draftRaw || "{}"}

DATA CONTEXT:
${contextPrompt}

Return revised JSON using the exact schema.
`;

      const reviewedRaw = await callLLM(
        proReasoningLLM,
        getSystemPrompt("pro", currentDate, comparison),
        reviewPrompt,
        "gemini-pro-review"
      );
      const reviewedParsed = parseJSONResponse(reviewedRaw || "");
      finalParsed = mergeProResponses(draftParsed, reviewedParsed);
    }

    return ensureValidResponse(finalParsed, query, context, signals);
  } catch (error: any) {
    console.error("LLM response error:", error?.message || error);
    if (error?.status === 429) {
      setCooldown("gemini", 60000);
    }
    return createFallbackResponse(context);
  }
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
      Array.isArray(data?.news) && (data.news?.length || 0) > 0,
      typeof data?.metrics?.return_1m === "number" || typeof data?.metrics?.return_3m === "number" || typeof data?.metrics?.return_52w === "number",
    ];
    const available = fields.filter(Boolean).length;
    return `- ${symbol}: ${available}/6 key fields available`;
  });

  return `Data Coverage\n${lines.join("\n")}\n\n`;
}

function buildComparisonTable(context: QueryContext): string {
  if (!context.multiStockData || Object.keys(context.multiStockData).length < 2) return "";

  const [first, second] = Object.keys(context.multiStockData);
  const a = context.multiStockData[first];
  const b = context.multiStockData[second];

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
  const a3m = a?.metrics?.return_3m;
  const b3m = b?.metrics?.return_3m;

  const rows: string[][] = [];
  if (typeof aPrice === "number" || typeof bPrice === "number") rows.push(["Price", formatMoney(aPrice), formatMoney(bPrice), "-"]);
  if (typeof aMove === "number" || typeof bMove === "number") rows.push(["1D Move", formatPercent(aMove), formatPercent(bMove), getEdgeLabel(first, aMove, second, bMove)]);
  if (typeof aPE === "number" || typeof bPE === "number") rows.push(["P/E", formatNumber(aPE), formatNumber(bPE), getEdgeLabel(first, aPE, second, bPE, true)]);
  if (typeof aGrowth === "number" || typeof bGrowth === "number") rows.push(["Revenue Growth (YoY)", formatPercent(aGrowth), formatPercent(bGrowth), getEdgeLabel(first, aGrowth, second, bGrowth)]);
  if (typeof aCap === "number" || typeof bCap === "number") rows.push(["Market Cap", formatMoney(aCap), formatMoney(bCap), getEdgeLabel(first, aCap, second, bCap)]);
  if (typeof a3m === "number" || typeof b3m === "number") rows.push(["3M Return", formatPercent(a3m), formatPercent(b3m), getEdgeLabel(first, a3m, second, b3m)]);

  const aDistHigh = computeDistancePercent(a?.price?.current, a?.metrics?.fifty_two_week_high);
  const bDistHigh = computeDistancePercent(b?.price?.current, b?.metrics?.fifty_two_week_high);
  if (aDistHigh !== null || bDistHigh !== null) rows.push(["Distance to 52W High", formatPercent(aDistHigh), formatPercent(bDistHigh), getEdgeLabel(first, aDistHigh, second, bDistHigh)]);

  if (rows.length === 0) return "";
  return `Comparison Table\n${createTextTable(["Metric", first, second, "Edge"], rows)}\n\n`;
}

function buildActionablePlan(response: LLMResponse): string {
  let week = "";
  let month = "";

  switch (response.advice) {
    case "Buy":
      week = "Use staged entries across 2-3 tranches and avoid a single full allocation.";
      month = "Add exposure only if momentum and revisions remain supportive.";
      break;
    case "Sell":
      week = "Reduce exposure in stages to avoid poor execution in volatile sessions.";
      month = "Re-enter only after valuation and momentum stabilize.";
      break;
    case "Hold":
      week = "Keep allocation unchanged and avoid chasing short-term moves.";
      month = "Re-evaluate after the next major catalyst or earnings update.";
      break;
    default:
      week = "Wait for clearer trend confirmation and cleaner risk/reward.";
      month = "Reassess once data consistency and signal alignment improve.";
      break;
  }

  return `Actionable Plan\n- 1-2 week: ${week}\n- 1-3 month: ${month}\n\n`;
}

export function transformForMarkdown(response: LLMResponse, context: QueryContext): string {
  let output = `Investment Summary\n${response.summary}\n\n`;
  output += "Decision Snapshot\n";
  output += `- Trend: ${response.trend.toUpperCase()}\n`;
  output += `- Advice: ${response.advice}\n`;
  if (response.recommendation) output += `- Recommendation: ${response.recommendation}\n`;
  output += `- Confidence: ${(response.confidence * 100).toFixed(0)}%\n`;
  output += `- Data Quality: ${response.dataQuality === "high" ? "High" : response.dataQuality === "medium" ? "Medium" : "Low"}\n\n`;
  output += "All primary metrics are sourced from aggregator data (Finnhub, Alpha Vantage, NewsAPI).\n\n";

  output += buildDataCoverage(context);
  output += buildComparisonTable(context);

  if (response.reasoning.length > 0) {
    output += "Reasoning\n";
    response.reasoning.forEach((item, idx) => {
      output += `${idx + 1}. ${item}\n`;
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

  if (context.news?.length) {
    output += "Recent Catalysts\n";
    context.news.slice(0, 3).forEach((item, idx) => {
      output += `${idx + 1}. ${item.headline}\n`;
    });
    output += "\n";
  }

  output += buildActionablePlan(response);

  if (response.sources.length > 0) {
    output += "Sources\n";
    response.sources.forEach((source) => {
      output += `- ${source.title || source.type}\n`;
    });
  }

  return output;
}
