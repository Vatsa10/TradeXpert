
import { z } from "zod";

export const SentimentSchema = z.enum(["positive", "negative", "neutral"]);
export type Sentiment = z.infer<typeof SentimentSchema>;

export const RecommendationSchema = z.enum([
  "Strong Buy",
  "Buy",
  "Hold",
  "Sell",
  "Strong Sell",
]);
export type InvestmentRecommendation = z.infer<typeof RecommendationSchema>;

export const QuantitativeAnalysisSchema = z.object({
  current_price: z.number().describe("Current stock price"),
  price_change_24h: z.number().optional().describe("Price change in the last 24 hours"),
  price_change_percentage_24h: z.number().optional().describe("Price change percentage in the last 24 hours"),
  week_high_52: z.number().optional().describe("52-week high price"),
  week_low_52: z.number().optional().describe("52-week low price"),
  volume: z.number().optional().describe("Trading volume"),
  market_cap: z.number().optional().describe("Market capitalization"),
  pe_ratio: z.number().optional().describe("Price-to-earnings ratio"),
  trend_analysis: z.string().describe("Analysis of recent price trends"),
  key_metrics_summary: z.string().describe("Summary of key financial metrics"),
});

export type QuantitativeAnalysis = z.infer<typeof QuantitativeAnalysisSchema>;

export const QualitativeAnalysisSchema = z.object({
  overall_sentiment: SentimentSchema.describe("Overall sentiment from news analysis"),
  sentiment_score: z.number().min(-1).max(1).describe("Sentiment score between -1 and 1"),
  key_risks: z.array(z.string()).describe("List of key risk factors identified"),
  key_opportunities: z.array(z.string()).describe("List of key opportunities identified"),
  news_summary: z.string().describe("Summary of recent news articles"),
  market_perception: z.string().describe("Overall market perception and narrative"),
});

export type QualitativeAnalysis = z.infer<typeof QualitativeAnalysisSchema>;

export const InvestmentReportSchema = z.object({
  company_name: z.string().describe("Name of the company"),
  stock_symbol: z.string().describe("Stock symbol"),
  executive_summary: z.string().describe("Executive summary of the analysis"),
  quantitative_summary: z.string().describe("Summary of quantitative findings"),
  qualitative_summary: z.string().describe("Summary of qualitative findings"),
  investment_recommendation: RecommendationSchema.describe("Final investment recommendation"),
  recommendation_rationale: z.string().describe("Detailed rationale for the recommendation"),
  risk_assessment: z.string().describe("Overall risk assessment"),
  confidence_level: z.number().min(0).max(100).describe("Confidence level in the recommendation (0-100)"),
  report_date: z.string().describe("Date when the report was generated"),
  analysis_period: z.string().describe("Time period covered by the analysis"),
});

export type InvestmentReport = z.infer<typeof InvestmentReportSchema>;

export interface AnalysisState {
  company_name: string;
  symbol: string;
  stock_data?: string;
  news_data?: string;
  quant_analysis?: QuantitativeAnalysis;
  qual_analysis?: QualitativeAnalysis;
  final_report?: InvestmentReport;
}
