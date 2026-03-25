
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
  maxOutputTokens: 2048,
}) as any;

/**
 * Creates an agent that analyzes stock price data.
 */
export async function runQuantitativeAnalyst(stockData: string) {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert quantitative financial analyst. Your task is to analyze the provided stock price data and provide a structured analysis of key metrics and trends.
    Focus on extracting specific numerical data and providing objective analysis.`],
    ["human", `Here is the stock price data for the company:
    {stock_data}
    
    Please provide a quantitative analysis covering current price, changes, 52W range, volume, market cap, P/E ratio, trend analysis, and a metrics summary.`],
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
    ["system", `You are an expert qualitative financial analyst. Your task is to analyze the provided news articles about a company and provide a structured analysis of sentiment, risks, and opportunities.
    Focus on extracting key insights and providing objective qualitative analysis.`],
    ["human", `Here are the recent news articles for the company:
    {news_data}
    
    Please provide a qualitative analysis covering sentiment, sentiment score (-1 to 1), key risks, opportunities, news summary, and market perception.`],
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
    ["system", `You are an expert financial report writer. Your task is to synthesize the quantitative and qualitative analyses into a single, comprehensive, and well-structured investment report.
    Use professional tone and clear recommendations.`],
    ["human", `Please compile a final investment report based on the following structured analyses:

Quantitative Analysis:
- Current Price: {current_price}
- Trend Analysis: {trend_analysis}
- Key Metrics Summary: {key_metrics_summary}

Qualitative Analysis:
- Overall Sentiment: {overall_sentiment}
- Sentiment Score: {sentiment_score}
- Key Risks: {key_risks}
- Key Opportunities: {key_opportunities}
- News Summary: {news_summary}
- Market Perception: {market_perception}

Based on all this information, create a comprehensive investment report for {company_name} ({symbol}) including executive summary, quantitative findings, qualitative findings, recommendation (Strong Buy/Buy/Hold/Sell/Strong Sell), rationale, risk assessment, and confidence level.`],
  ]);

  const structuredLlm = llm.withStructuredOutput(InvestmentReportSchema);
  const chain = prompt.pipe(structuredLlm);

  return chain.invoke({
    company_name: companyName,
    symbol: symbol,
    current_price: quantAnalysis.current_price,
    trend_analysis: quantAnalysis.trend_analysis,
    key_metrics_summary: quantAnalysis.key_metrics_summary,
    overall_sentiment: qualAnalysis.overall_sentiment,
    sentiment_score: qualAnalysis.sentiment_score,
    key_risks: JSON.stringify(qualAnalysis.key_risks),
    key_opportunities: JSON.stringify(qualAnalysis.key_opportunities),
    news_summary: qualAnalysis.news_summary,
    market_perception: qualAnalysis.market_perception,
  });
}
