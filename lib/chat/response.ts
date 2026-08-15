import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { Advice, LLMResponse, Mode, QueryContext, SignalBundle, Source, Trend } from "./types";
import { assessDataQuality } from "./context-builder";
import { calibrateConfidence, getDataQuality } from "./confidence";
import { setCooldown, withRateLimit } from "./rate-limiter";
import { parseLLMJson } from "./schemas";
import { detectPersona } from "./personas";
import { getDeepSeekLLM } from "./deepseek";
import { isLikelyIndianTicker } from "@/lib/data/providers/nse-india";

// NOTE on maxOutputTokens: these Gemini 3 models are *thinking* models — their
// internal reasoning tokens are drawn from the same output budget as the visible
// answer. The previous 1024/1400/2200 budgets were being consumed almost
// entirely by thinking, so the JSON came back cut off mid-string (observed:
// rawLen=294 for a pro-mode macro query) and every such request fell through to
// "Analysis is temporarily unavailable". Budget for thinking + payload.
const fastLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite-preview",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 4096,
  temperature: 0.25,
}) as any;

const proFlashLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 8192,
  temperature: 0.2,
}) as any;

const proReasoningLLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-pro-preview",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 8192,
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

function getSystemPrompt(mode: Mode, currentDate: string, comparison: boolean, personaPrompt: string = ""): string {
  const role = mode === "pro"
    ? "You are TradeXpert AI, a senior investment strategist."
    : mode === "thinking"
      ? "You are TradeXpert AI, an institutional-grade analyst."
      : "You are TradeXpert AI, a practical market assistant.";

  const personaBlock = personaPrompt
    ? `\n\nPERSONA MODE\n${personaPrompt}\nAnswer in this investor's voice and apply their checklist, but still return the exact JSON schema below.`
    : "";

  return `${role} Today's date is ${currentDate}. ${comparison ? "This is a comparison query. You must provide a direct decision when confidence is adequate." : ""}${personaBlock}\n${OUTPUT_SCHEMA}`;
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
        if (typeof data.metrics.market_cap === "number") bits.push(`MCap ${formatMoney(data.metrics.market_cap)} (USD)`);
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
    if (typeof context.metrics.market_cap === "number") bits.push(`MCap ${formatMoney(context.metrics.market_cap)} (USD)`);
    if (typeof context.metrics.revenue_growth === "number") bits.push(`RevGrowth ${context.metrics.revenue_growth.toFixed(2)}%`);
    if (typeof context.metrics.return_1m === "number") bits.push(`1M ${context.metrics.return_1m.toFixed(2)}%`);
    if (typeof context.metrics.return_3m === "number") bits.push(`3M ${context.metrics.return_3m.toFixed(2)}%`);
    if (bits.length > 0) prompt += `\nMETRICS\n${bits.join(" | ")}\n`;
  }

  if (context.news?.length) {
    prompt += `\nNEWS\n${context.news.slice(0, 3).map((n, i) => `${i + 1}. ${n.headline}`).join("\n")}\n`;
  }

  if (context.marketPulse?.quotes?.length) {
    const rows = context.marketPulse.quotes
      .slice(0, 8)
      .map((q) => `${q.symbol} ${q.price} (${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)`)
      .join(", ");
    prompt += `\nMARKET PULSE (${context.marketPulse.screen})\n${rows}\n`;
  }

  if (context.sentiment) {
    prompt += `\nSENTIMENT\nOverall ${context.sentiment.overallSentiment}; Confidence ${(context.sentiment.confidence * 100).toFixed(0)}%; Signals ${context.sentiment.macroSignals.join(", ")}\n`;
  }

  if (context.events?.length) {
    prompt += `\nDETECTED EVENTS\n${context.events.join(", ")}\n`;
  }

  const indianGaps = indianSymbolsWithoutData(context);
  if (indianGaps.length > 0) {
    prompt += `\nDATA AVAILABILITY\nIndian market data currently unavailable for ${indianGaps.join(", ")}. No price, metrics or quote could be retrieved. Do NOT state or estimate a price, level or valuation for these symbols — say the data is unavailable and keep confidence low.\n`;
  }

  return prompt;
}

// The NSE/BSE upstream is frequently unreachable and Finnhub/Alpha Vantage have
// no .NS/.BO coverage on the free tier, so an Indian symbol routinely reaches the
// model with no price at all. Without an explicit marker the model answered
// confidently from its training data; naming the gap keeps it honest.
export function indianSymbolsWithoutData(context: QueryContext): string[] {
  const missing: string[] = [];

  const consider = (symbol: string | undefined, hasPrice: boolean) => {
    if (!symbol || hasPrice) return;
    if (!isLikelyIndianTicker(symbol)) return;
    if (!missing.includes(symbol)) missing.push(symbol);
  };

  if (context.multiStockData) {
    for (const [symbol, data] of Object.entries(context.multiStockData)) {
      consider(symbol, !!data?.price);
    }
  }

  consider(context.entity?.symbol, !!context.priceData);

  return missing;
}

function parseJSONResponse(raw: string): Partial<LLMResponse> | null {
  const content = typeof raw === "string" ? raw : String(raw || "");

  // 3-tier parse (direct JSON -> extracted JSON block -> fallback), ported
  // from india-trade-cli's agent/schema_parser.py.
  const { data, tier } = parseLLMJson(content, llmOutputSchema, null as any);
  if (tier === "fallback" || !data) return null;

  return {
    summary: data.summary,
    trend: data.trend,
    reasoning: data.reasoning,
    advice: data.advice,
    recommendation: data.recommendation,
    confidence: data.confidence,
    signalTrace: data.signalTrace,
  };
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

  const indianGaps = indianSymbolsWithoutData(context);
  if (indianGaps.length > 0) {
    points.unshift(
      `Indian market data currently unavailable for ${indianGaps.join(", ")} — 0 quotes retrieved from the NSE/BSE source, so no price-based conclusion can be drawn.`
    );
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

// Single-line, greppable log line for the LLM path. User content is capped at
// 60 chars and newline-flattened so prompts never leak into logs wholesale.
function logLLMFailure(
  stage: "gemini-call" | "deepseek-call" | "json-parse",
  provider: string,
  mode: Mode,
  detail: string,
  extra = ""
): void {
  console.error(
    `[LLM] stage=${stage} provider=${provider} mode=${mode} error=${detail.replace(/\s+/g, " ").slice(0, 200)}${extra}`
  );
}

function snippet(value: string, max: number): string {
  return value.replace(/\s+/g, " ").slice(0, max);
}

// Parsing used to fail into createFallbackResponse with nothing logged; keep
// the same return contract and just record what the model actually sent back.
function parseWithLogging(
  raw: string,
  provider: string,
  mode: Mode
): Partial<LLMResponse> | null {
  const parsed = parseJSONResponse(raw);
  if (!parsed) {
    // rawLen + the tail are what distinguish "model ignored the schema" from
    // "output hit maxOutputTokens and got cut mid-JSON" — the 200-char head
    // alone looked identical in both cases.
    logLLMFailure(
      "json-parse",
      provider,
      mode,
      "unparseable LLM output",
      ` rawLen=${raw.length} head="${snippet(raw, 120)}" tail="${snippet(raw.slice(-120), 120)}"`
    );
  }
  return parsed;
}

async function callLLM(
  llm: any,
  systemPrompt: string,
  userPrompt: string,
  rateLimitKey: string,
  mode: Mode
): Promise<string | null> {
  const invoke = async (model: any) => {
    const response = await model.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    const content = typeof response === "string" ? response : response.content;
    return typeof content === "string" ? content : String(content || "");
  };

  try {
    const result = await withRateLimit(rateLimitKey, () => invoke(llm), true);
    if (result) return result;
    logLLMFailure("gemini-call", rateLimitKey, mode, "empty result (no content or rate-limit cooldown)", ` prompt="${snippet(userPrompt, 60)}"`);
  } catch (error: any) {
    // fall through to DeepSeek
    logLLMFailure("gemini-call", rateLimitKey, mode, String(error?.message || error), ` prompt="${snippet(userPrompt, 60)}"`);
  }

  // Gemini failed or is cooling down — try DeepSeek before giving up.
  const deepseek = getDeepSeekLLM();
  if (deepseek) {
    try {
      return await withRateLimit("deepseek", () => invoke(deepseek), true);
    } catch (error: any) {
      logLLMFailure("deepseek-call", "deepseek", mode, String(error?.message || error), ` prompt="${snippet(userPrompt, 60)}"`);
      return null;
    }
  }

  logLLMFailure("deepseek-call", "deepseek", mode, "no DeepSeek client configured; no fallback available");
  return null;
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

const BEARISH_REASON_PATTERNS = [
  /\bdecline?[ds]?\b/i, /\bdeclining\b/i, /\bdrop(?:ped|ping|s)?\b/i, /\bfell\b/i, /\bfalling\b/i,
  /\bdown\b/i, /\blower\b/i, /\bweak(?:er|ness)?\b/i, /\bloss(?:es)?\b/i, /\bnegative\b/i,
  /\bbearish\b/i, /\bcontract(?:ed|ing|ion)\b/i, /\bmiss(?:ed|es)?\b/i, /\bcut\b/i,
  /\bdecrease[ds]?\b/i, /\bdecreasing\b/i, /\bshrank\b/i, /\bshrink(?:ing)?\b/i, /\bworsen\w*\b/i,
  /\bdowngrade[ds]?\b/i, /\bunderperform\w*\b/i, /\bslow(?:ed|ing|down)\b/i, /\bsell-?off\b/i,
  /\bheadwind\w*\b/i, /\bpressure[ds]?\b/i, /\bovervalued\b/i, /-\d+(?:\.\d+)?%/,
];

const BULLISH_REASON_PATTERNS = [
  /\brise[ns]?\b/i, /\brising\b/i, /\brose\b/i, /\bgain(?:ed|ing|s)?\b/i, /\bup\b/i,
  /\bhigher\b/i, /\bstrong(?:er|th)?\b/i, /\bpositive\b/i, /\bbullish\b/i, /\bgrow(?:th|ing|s)?\b/i,
  /\bbeat\b/i, /\bupgrade[ds]?\b/i, /\boutperform\w*\b/i, /\brall(?:y|ies|ied|ying)\b/i,
  /\bgrew\b/i, /\bincrease[ds]?\b/i, /\bincreasing\b/i, /\bimprove[ds]?\b/i, /\bimproving\b/i,
  /\bsurge[ds]?\b/i, /\bexpand(?:ed|ing|sion)?\b/i, /\btailwind\w*\b/i, /\bundervalued\b/i,
  /\+\d+(?:\.\d+)?%/,
];

function scoreReasonLine(line: string): -1 | 0 | 1 {
  const bearish = BEARISH_REASON_PATTERNS.filter((p) => p.test(line)).length;
  const bullish = BULLISH_REASON_PATTERNS.filter((p) => p.test(line)).length;
  if (bearish > bullish) return -1;
  if (bullish > bearish) return 1;
  return 0;
}

// A model that lists three bearish reasons and then labels the trend BULLISH is
// contradicting its own evidence. When every leaning reasoning line points one
// way and the stated trend points the other, and no strong macro/sentiment
// signal justifies the override, trust the reasoning. Deterministic and logged.
export function reconcileTrendWithReasoning(
  trend: Trend,
  reasoning: string[],
  signalScore: number
): Trend {
  if (trend === "neutral") return trend;
  if (Math.abs(signalScore) >= 1.5) return trend;

  const scores = (reasoning || []).map(scoreReasonLine).filter((s) => s !== 0);
  if (scores.length < 2) return trend;

  const allBearish = scores.every((s) => s === -1);
  const allBullish = scores.every((s) => s === 1);

  if (trend === "bullish" && allBearish) {
    console.warn(
      `[Response] Trend/reasoning contradiction: trend=bullish with ${scores.length} bearish reasoning lines -> bearish`
    );
    return "bearish";
  }
  if (trend === "bearish" && allBullish) {
    console.warn(
      `[Response] Trend/reasoning contradiction: trend=bearish with ${scores.length} bullish reasoning lines -> bullish`
    );
    return "bullish";
  }

  return trend;
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
  const adjustedTrend = applyTrendAdjustment((parsed.trend as Trend) || "neutral", context);
  const reasoning = (parsed.reasoning || []).filter((line) => sanitizeText(line).length > 0);
  const finalReasoning = reasoning.length >= 3 ? reasoning : buildFallbackReasoning(context);
  const trend = reconcileTrendWithReasoning(adjustedTrend, finalReasoning, getSignalScore(context));

  return {
    summary: sanitizeText(parsed.summary || "Analysis completed based on available data.") || "Analysis completed based on available data.",
    trend,
    reasoning: finalReasoning,
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
  mode: Mode,
  history: import("./context-history").ChatTurn[] = []
): Promise<LLMResponse> {
  const startTime = Date.now();
  const comparison = isComparisonQuery(query) || context.intent === "comparison";
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const persona = detectPersona(query);
  const personaPrompt = persona?.systemPrompt || "";

  const contextPrompt = buildContextPrompt(context);
  const signalPrompt = signals
    ? `\nSIGNALS\n${signals.signals.map((s) => `- ${s.indicator}: ${s.signal} (${s.reasoning})`).join("\n")}\nOverall: ${signals.overallTrend}`
    : "";
  const historyPrompt = history.length > 0
    ? `\nCONVERSATION HISTORY (most relevant + recent turns, may include an [Earlier conversation...] summary line)\n${history.map((h) => `${h.role}: ${h.content}`).join("\n")}\n`
    : "";

  const userPrompt = `
${historyPrompt}
Query: ${query}

${contextPrompt}
${signalPrompt}

Grounding requirements:
- Use exact numbers from context
- Market cap ("MCap") is already in USD and pre-formatted with its magnitude suffix (K/M/B/T). Quote it exactly as given and never rescale it or restate it in millions
- Include at least 3 reasoning points with numbers
- For comparison queries, produce a direct recommendation
- Prefer aggregator data over narrative assumptions
`;

  try {
    if (mode !== "pro") {
      const raw = await callLLM(
        fastLLM,
        getSystemPrompt(mode, currentDate, comparison, personaPrompt),
        userPrompt,
        "gemini",
        mode
      );
      return ensureValidResponse(parseWithLogging(raw || "", "gemini", mode), query, context, signals);
    }

    const draftRaw = await callLLM(
      proFlashLLM,
      getSystemPrompt("pro", currentDate, comparison, personaPrompt),
      userPrompt,
      "gemini-pro-flash",
      mode
    );
    const draftParsed = parseWithLogging(draftRaw || "", "gemini-pro-flash", mode);

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
        getSystemPrompt("pro", currentDate, comparison, personaPrompt),
        reviewPrompt,
        "gemini-pro-review",
        mode
      );
      const reviewedParsed = parseWithLogging(reviewedRaw || "", "gemini-pro-review", mode);
      finalParsed = mergeProResponses(draftParsed, reviewedParsed);
    }

    return ensureValidResponse(finalParsed, query, context, signals);
  } catch (error: any) {
    logLLMFailure(
      "gemini-call",
      mode === "pro" ? "gemini-pro-flash" : "gemini",
      mode,
      `unhandled: ${String(error?.message || error)}`,
      ` status=${error?.status ?? "none"} query="${snippet(query, 60)}"`
    );
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
