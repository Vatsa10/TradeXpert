
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  QuantitativeAnalysisSchema,
  QualitativeAnalysisSchema,
  InvestmentReportSchema
} from "./types";
import { compactForLLM, compactText } from "./compact-context";

const model = "gemini-3.1-flash-lite-preview";
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const llm = new ChatGoogleGenerativeAI({
  model: model,
  apiKey: apiKey,
  maxOutputTokens: 4096,
}) as any;

// Character budgets for the agent payloads (roughly 4 chars/token).
const QUANT_CONTEXT_MAX_CHARS = 24000;
const NEWS_CONTEXT_MAX_CHARS = 12000;

/**
 * Creates an agent that analyzes stock price data.
 */
export async function runQuantitativeAnalyst(stockData: string) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an institutional-grade quantitative equity researcher. Today's date is ${currentDate}.
    Your task is to analyze the provided comprehensive stock context (Financials, Price trends, and Key Ratios).
    Focus on:
    1. Financial Health: Assess Debt-to-Equity, Net Profits, and Revenue Growth.
    2. Valuation: Compare current P/E and P/B ratios against the implied sector average.
    3. Technical Momentum: Analyze Day High/Low relative to the price context.
    
    Structure your response with clear numerical benchmarks based on the most recent data available up to ${currentDate}.`],
    ["human", `Here is the comprehensive TradingView-grade context for the symbol:
    {stock_data}
    
    Provide a quantitative breakdown of Valuation, Profitability, and Momentum.`],
  ]);

  const structuredLlm = llm.withStructuredOutput(QuantitativeAnalysisSchema);
  const chain = prompt.pipe(structuredLlm);

  // The rich stock context is this agent's ENTIRE payload, so it gets a much
  // larger budget than compactText's incidental-field default (2500 chars),
  // which was silently discarding almost all of the Finnhub context.
  return chain.invoke({ stock_data: compactText(String(stockData ?? ""), QUANT_CONTEXT_MAX_CHARS) });
}

/**
 * Creates an agent that analyzes news articles.
 */
export async function runQualitativeAnalyst(newsData: string) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert qualitative financial analyst. Today's date is ${currentDate}.
    Your task is to analyze the provided news articles and market sentiment.
    Detect:
    1. Regulatory/Geopolitical Risks.
    2. Secular Trends and Catalyst Opportunities.
    3. Sentiment Score (-1 to 1).
    
    Ensure your analysis reflects the context of ${currentDate}.`],
    ["human", `Analyze the latest sentiment for this equity:
    {news_data}
    
    Provide a sentiment score and summarize key qualitative catalysts and risks.`],
  ]);

  const structuredLlm = llm.withStructuredOutput(QualitativeAnalysisSchema);
  const chain = prompt.pipe(structuredLlm);

  const compactNews =
    typeof newsData === "string"
      ? compactText(newsData, NEWS_CONTEXT_MAX_CHARS)
      : compactText(JSON.stringify(compactForLLM(newsData)), NEWS_CONTEXT_MAX_CHARS);
  return chain.invoke({ news_data: compactNews });
}

/**
 * Creates an agent that compiles the final investment report.
 */
export async function runReportWriter(
  companyName: string,
  symbol: string,
  quantAnalysis: any,
  qualAnalysis: any
) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a Senior Investment Strategist. Today's date is ${currentDate}.
    Synthesize the deep Quantitative data (Financials + Technicals) and Qualitative news sentiment into a final institutional report.
    Provide a specific recommendation (Buy/Hold/Sell) supported by the data points.
    
    CRITICAL: 
    - The 'report_date' MUST be ${currentDate}.
    - The 'analysis_period' (Horizon) should be relative to today (${currentDate}). If providing a quarterly horizon, it should be the upcoming quarters of the current/next year (e.g. Q2 2026, H2 2026).`],
    ["human", `Compile the final strategy for {company_name} ({symbol}) using these synthesized findings:

    Quantitative Thesis (Financial Metrics & Price Analysis):
    {quant_thesis}

    Qualitative Context (Sentiment & News Catalysts):
    - Sentiment: {overall_sentiment}
    - Perception: {market_perception}
    - Headlines: {news_summary}
    - Key risks: {key_risks}
    - Key opportunities: {key_opportunities}

    Ensure the final executive summary is high-impact and the rationale explains precisely WHY the recommendation was given based on the TradingView-grade financials and sentiment.`],
  ]);

  const structuredLlm = llm.withStructuredOutput(InvestmentReportSchema);
  const chain = prompt.pipe(structuredLlm);

  // QuantitativeAnalysisSchema calls this field `key_metrics_summary`; reading
  // `metrics_summary` interpolated the literal string "undefined" into the
  // report writer's prompt, so the final report was built without any of the
  // quantitative agent's metrics summary.
  const quant = quantAnalysis ?? {};
  const qual = qualAnalysis ?? {};

  return chain.invoke({
    company_name: companyName,
    symbol: symbol,
    quant_thesis: `Valuation Metrics: ${quant.key_metrics_summary ?? "n/a"}. Trend: ${quant.trend_analysis ?? "n/a"}. Core Price: ${quant.current_price ?? "n/a"}`,
    overall_sentiment: qual.overall_sentiment ?? "neutral",
    market_perception: qual.market_perception ?? "n/a",
    news_summary: qual.news_summary ?? "n/a",
    // key_risks / key_opportunities were produced by the qualitative agent but
    // never reached the report writer, which is asked to emit a risk_assessment.
    key_risks: Array.isArray(qual.key_risks) && qual.key_risks.length ? qual.key_risks.join("; ") : "none identified",
    key_opportunities:
      Array.isArray(qual.key_opportunities) && qual.key_opportunities.length
        ? qual.key_opportunities.join("; ")
        : "none identified",
  });
}
