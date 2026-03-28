import { Mode, Intent, QueryContext, PriceData, FinancialMetrics, CompanyProfile, NewsItem, SearchResult, SentimentResult } from "./types";
import { extractEntity } from "./intent";
import { getFinnhubQuote, getStockProfile, getStockMetrics, getCompanyNews, getGeneralNews } from "./aggregator";
import { webSearch } from "./search";
import { analyzeSentiment } from "./sentiment";
import { getTechnicalIndicators } from "./indicators";

const TIMEOUT_MS = 800;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), ms)
      ),
    ]);
  } catch {
    return null;
  }
}

export function isDataSufficient(context: Partial<QueryContext>, intent: Intent): boolean {
  if (!context) return false;

  switch (intent) {
    case "price":
      return !!context.priceData;
    
    case "reason":
      return !!context.priceData && !!context.news?.length;
    
    case "macro":
      return (!!context.news && context.news.length > 0) || 
             (!!context.searchResults && context.searchResults.length > 0);
    
    case "info":
      return !!context.profile || !!context.news?.length;
    
    case "comparison":
      return !!context.priceData && !!context.news?.length;
    
    case "general":
      return !!context.priceData || !!context.news?.length;
    
    default:
      return false;
  }
}

export function shouldUseWebSearch(
  intent: Intent,
  mode: Mode,
  hasEntity: boolean
): boolean {
  if (mode === "pro") return true;
  
  if (intent === "macro") return true;
  if (intent === "reason" && !hasEntity) return true;
  if (intent === "comparison") return true;
  
  return false;
}

async function fetchPriceData(symbol: string): Promise<PriceData | null> {
  try {
    const data = await withTimeout(
      getFinnhubQuote(symbol),
      TIMEOUT_MS
    );
    return data;
  } catch {
    return null;
  }
}

async function fetchProfile(symbol: string): Promise<CompanyProfile | null> {
  try {
    const data = await withTimeout(
      getStockProfile(symbol),
      TIMEOUT_MS
    );
    return data;
  } catch {
    return null;
  }
}

async function fetchMetrics(symbol: string): Promise<FinancialMetrics | null> {
  try {
    const data = await withTimeout(
      getStockMetrics(symbol),
      TIMEOUT_MS
    );
    return data;
  } catch {
    return null;
  }
}

async function fetchCompanyNews(symbol: string): Promise<NewsItem[]> {
  try {
    const data = await withTimeout(
      getCompanyNews(symbol, 7),
      TIMEOUT_MS
    );
    return data || [];
  } catch {
    return [];
  }
}

async function fetchGeneralNews(): Promise<NewsItem[]> {
  try {
    const data = await withTimeout(
      getGeneralNews(),
      TIMEOUT_MS
    );
    return data || [];
  } catch {
    return [];
  }
}

export async function buildContext(
  query: string,
  intent: Intent,
  entity: { symbol?: string } | null,
  mode: Mode
): Promise<Partial<QueryContext>> {
  const context: Partial<QueryContext> = {
    query,
    intent,
    entity: entity || null,
    mode,
    timestamp: new Date(),
  };

  if (!entity?.symbol) {
    if (intent === "macro" || mode === "pro") {
      const [news, searchResults] = await Promise.all([
        fetchGeneralNews(),
        webSearch(query, mode),
      ]);
      context.news = news;
      context.searchResults = searchResults;
    }
    return context;
  }

  const tasks: Promise<any>[] = [
    fetchPriceData(entity.symbol),
    fetchProfile(entity.symbol),
    fetchMetrics(entity.symbol),
    fetchCompanyNews(entity.symbol),
  ];

  if (shouldUseWebSearch(intent, mode, !!entity.symbol)) {
    tasks.push(webSearch(query, mode));
  }

  const needsIndicators = mode === "pro" && entity?.symbol && intent !== "price";
  
  if (needsIndicators) {
    tasks.push(getTechnicalIndicators(entity.symbol));
  }

  const results = await Promise.allSettled(tasks);

  context.priceData = results[0].status === "fulfilled" ? results[0].value as PriceData : null;
  context.profile = results[1].status === "fulfilled" ? results[1].value as CompanyProfile : null;
  context.metrics = results[2].status === "fulfilled" ? results[2].value as FinancialMetrics : null;
  context.news = results[3].status === "fulfilled" ? results[3].value as NewsItem[] : [];

  const baseTaskCount = 4;
  const hasSearch = shouldUseWebSearch(intent, mode, !!entity.symbol);
  
  if (hasSearch) {
    context.searchResults = results[4].status === "fulfilled" ? results[4].value as SearchResult[] : [];
  }

  const indicatorIndex = baseTaskCount + (hasSearch ? 1 : 0);
  if (needsIndicators && indicatorIndex < results.length) {
    const indicatorsResult = results[indicatorIndex];
    if (indicatorsResult.status === "fulfilled") {
      const indicators = indicatorsResult.value;
      if (indicators) {
        context.technicalIndicators = {
          rsi: indicators.rsi ? { value: indicators.rsi.value || null, signal: indicators.rsi.signal } : undefined,
          macd: indicators.macd ? { histogram: (indicators.macd.value as number) || 0, signal: indicators.macd.signal } : undefined,
          adx: indicators.adx ? { value: indicators.adx.value || null, signal: indicators.adx.signal } : undefined,
          sma20: indicators.sma20?.value as number || undefined,
        };
      }
    }
  }

  if (context.news && context.news.length > 0) {
    const headlines = context.news.map((n) => n.headline);
    context.sentiment = await analyzeSentiment(headlines);
  }

  return context;
}

export function mergeSearchResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  
  for (const result of results) {
    const key = result.title.substring(0, 50);
    if (!seen.has(key)) {
      seen.set(key, result);
    }
  }
  
  return Array.from(seen.values()).slice(0, 3);
}

export function assessDataQuality(context: Partial<QueryContext>): "high" | "medium" | "low" {
  let score = 0;

  if (context.priceData) score += 2;
  if (context.metrics) score += 2;
  if (context.profile) score += 1;
  if (context.news && context.news.length > 0) score += 2;
  if (context.searchResults && context.searchResults.length > 0) score += 1;
  if (context.sentiment) score += 1;

  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

export async function buildMultiStockContext(
  query: string,
  intent: Intent,
  symbols: string[],
  mode: Mode
): Promise<Partial<QueryContext>> {
  const context: Partial<QueryContext> = {
    query,
    intent,
    entity: { symbol: symbols[0], type: "stock" },
    mode,
    timestamp: new Date(),
    priceData: null,
    metrics: null,
    news: [],
  };

  const pricePromises = symbols.map(s => getFinnhubQuote(s));
  const newsPromises = symbols.map(s => getCompanyNews(s, 7));
  const metricsPromises = symbols.map(s => getStockMetrics(s));
  
  const [prices, newsResults, metricsResults] = await Promise.all([
    Promise.allSettled(pricePromises),
    Promise.allSettled(newsPromises),
    Promise.allSettled(metricsPromises)
  ]);

  const stockData: Record<string, { price?: any; metrics?: any; news?: any[] }> = {};
  const allNews: any[] = [];
  
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    stockData[symbol] = {};
    
    const priceResult = prices[i];
    const newsResult = newsResults[i];
    const metricsResult = metricsResults[i];
    
    if (priceResult.status === "fulfilled" && priceResult.value) {
      stockData[symbol].price = priceResult.value;
      if (i === 0) context.priceData = priceResult.value;
    }
    
    if (metricsResult.status === "fulfilled" && metricsResult.value) {
      stockData[symbol].metrics = metricsResult.value;
      if (i === 0) context.metrics = metricsResult.value;
    }
    
    if (newsResult.status === "fulfilled" && newsResult.value) {
      stockData[symbol].news = newsResult.value;
      allNews.push(...newsResult.value);
    }
  }

  (context as any).multiStockData = stockData;
  context.news = allNews.slice(0, 10);

  if (mode === "pro" || intent === "macro") {
    const searchResults = await webSearch(query, mode);
    context.searchResults = searchResults;
  }

  if (allNews.length > 0) {
    const headlines = allNews.map((n: any) => n.headline);
    context.sentiment = await analyzeSentiment(headlines);
  }

  return context;
}
