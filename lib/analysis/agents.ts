
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  QuantitativeAnalysisSchema,
  QualitativeAnalysisSchema,
  InvestmentReportSchema
} from "./types";

const model = "gemini-2.5-pro"; // Using 1.5 Pro for thorough analysis
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const llm = new ChatGoogleGenerativeAI({
  model: model,
  apiKey: apiKey,
  maxOutputTokens: 4096,
}) as any;

/**
 * Creates an agent that analyzes stock price data.
 */
export async function runQuantitativeAnalyst(stockData: string) {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an institutional-grade quantitative equity researcher. Your task is to analyze the provided comprehensive stock context (Financials, Price trends, and Key Ratios).
    Focus on:
    1. Financial Health: Assess Debt-to-Equity, Net Profits, and Revenue Growth.
    2. Valuation: Compare current P/E and P/B ratios against the implied sector average.
    3. Technical Momentum: Analyze Day High/Low relative to the price context.
    
    Structure your response with clear numerical benchmarks.`],
    ["human", `Here is the comprehensive TradingView-grade context for the symbol:
    {stock_data}
    
    Provide a quantitative breakdown of Valuation, Profitability, and Momentum.`],
  ]);

  const structuredLlm = llm.withStructuredOutput(QuantitativeAnalysisSchema);
  const chain = prompt.pipe(structuredLlm);

  return chain.invoke({ stock_data: stockData });
}

/**
 * Creates an agent that analyzes news articles.
 */
export async function runQualitativeAnalyst(newsData: string) {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert qualitative financial analyst. Your task is to analyze the provided news articles and market sentiment.
    Detect:
    1. Regulatory/Geopolitical Risks.
    2. Secular Trends and Catalyst Opportunities.
    3. Sentiment Score (-1 to 1).`],
    ["human", `Analyze the latest sentiment for this equity:
    {news_data}
    
    Provide a sentiment score and summarize key qualitative catalysts and risks.`],
  ]);

  const structuredLlm = llm.withStructuredOutput(QualitativeAnalysisSchema);
  const chain = prompt.pipe(structuredLlm);

  return chain.invoke({ news_data: newsData });
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
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a Senior Investment Strategist. Synthesize the deep Quantitative data (Financials + Technicals) and Qualitative news sentiment into a final institutional report.
    Provide a specific recommendation (Buy/Hold/Sell) supported by the data points.`],
    ["human", `Compile the final strategy for {company_name} ({symbol}) using these synthesized findings:

    Quantitative Thesis (Financial Metrics & Price Analysis):
    {quant_thesis}

    Qualitative Context (Sentiment & News Catalysts):
    - Sentiment: {overall_sentiment}
    - Perception: {market_perception}
    - Headlines: {news_summary}

    Ensure the final executive summary is high-impact and the rationale explains precisely WHY the recommendation was given based on the TradingView-grade financials and sentiment.`],
  ]);

  const structuredLlm = llm.withStructuredOutput(InvestmentReportSchema);
  const chain = prompt.pipe(structuredLlm);

  return chain.invoke({
    company_name: companyName,
    symbol: symbol,
    quant_thesis: `Valuation Metrics: ${quantAnalysis.metrics_summary}. Trend: ${quantAnalysis.trend_analysis}. Core Price: ${quantAnalysis.current_price}`,
    overall_sentiment: qualAnalysis.overall_sentiment,
    market_perception: qualAnalysis.market_perception,
    news_summary: qualAnalysis.news_summary,
  });
}
