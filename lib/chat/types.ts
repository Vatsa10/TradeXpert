export type Mode = "normal" | "thinking" | "pro";

export type Intent = "price" | "reason" | "macro" | "info" | "comparison" | "general";

export type Trend = "bullish" | "bearish" | "neutral";

export type Advice = "Buy" | "Hold" | "Sell" | "Wait";

export type DataQuality = "high" | "medium" | "low";

export type SourceType = "finnhub" | "news" | "search" | "alpha" | "llm";

export interface Source {
  type: SourceType;
  title?: string;
  url?: string;
}

export interface PriceData {
  current: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

export interface FinancialMetrics {
  pe_ratio?: number;
  pb_ratio?: number;
  debt_to_equity?: number;
  dividend_yield?: number;
  revenue_growth?: number;
  eps?: number;
  market_cap?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  return_1m?: number;
  return_3m?: number;
  return_52w?: number;
}

export interface CompanyProfile {
  name?: string;
  industry?: string;
  ipo?: string;
  exchange?: string;
}

export interface NewsItem {
  headline: string;
  summary: string;
  datetime: number;
  source: string;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  source: string;
}

export interface SentimentResult {
  overallSentiment: Trend;
  confidence: number;
  macroSignals: string[];
  keyHeadlines: string[];
}

export interface Signal {
  category: "technical" | "fundamental" | "sentiment" | "macro";
  indicator: string;
  value: string | number;
  signal: Trend;
  strength: number;
  reasoning: string;
}

export interface SignalBundle {
  signals: Signal[];
  overallTrend: Trend;
  strength: number;
  summary: string;
}

export interface Entity {
  symbol?: string;
  company?: string;
  type?: "stock" | "crypto" | "forex" | "index";
}

export interface QueryContext {
  query: string;
  intent: Intent;
  entity: Entity | null;
  mode: Mode;
  priceData?: PriceData | null;
  metrics?: FinancialMetrics | null;
  profile?: CompanyProfile | null;
  news?: NewsItem[];
  searchResults?: SearchResult[];
  sentiment?: SentimentResult | null;
  technicalIndicators?: TechnicalIndicatorsData | null;
  portfolio?: WatchlistItem[];
  events?: string[];
  multiStockData?: Record<string, {
    price?: PriceData | null;
    metrics?: FinancialMetrics | null;
    news?: NewsItem[];
  }>;
  timestamp: Date;
}

export interface TechnicalIndicatorsData {
  rsi?: { value: number; signal: string };
  macd?: { histogram: number; signal: string };
  adx?: { value: number; signal: string };
  sma20?: number;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
}

export interface LLMResponse {
  summary: string;
  trend: Trend;
  reasoning: string[];
  advice: Advice;
  confidence: number;
  dataQuality: DataQuality;
  sources: Source[];
  signalTrace: string[];
}

export interface FlowResult {
  content: string;
  response: LLMResponse;
  sources: string[];
  mode: Mode;
  signals?: SignalBundle;
  sentiment?: SentimentResult;
  intent: Intent;
  entity: Entity | null;
  context: QueryContext;
}

export interface ExecutionMetrics {
  latency: number;
  apiCalls: number;
  searchCalls: number;
  mode: Mode;
  intent: Intent;
}
