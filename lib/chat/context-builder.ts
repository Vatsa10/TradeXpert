import { Mode, Intent, QueryContext, PriceData, FinancialMetrics, CompanyProfile, NewsItem, SearchResult } from "./types";
import { getFinnhubQuote, getStockProfile, getStockMetrics, getCompanyNews, getGeneralNews } from "./aggregator";
import { webSearch } from "./search";
import { analyzeSentiment } from "./sentiment";
import { getTechnicalIndicators } from "./indicators";
import { runPriorityQueue, QueuedTask } from "./queue";
import { detectPulseScreen, getMarketPulse } from "@/lib/data/providers/market-pulse";

const TIMEOUT_MS = 3500;
// The screener's own fetch aborts at 4000ms, so a 3500ms race here killed
// otherwise-successful pulse calls before they could answer.
const PULSE_TIMEOUT_MS = 5000;

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizePercent(value: unknown): number | undefined {
  const parsed = toNumber(value);
  if (parsed === undefined) return undefined;
  if (Math.abs(parsed) <= 1.5) {
    return parsed * 100;
  }
  return parsed;
}

export function normalizeMetrics(raw: any): FinancialMetrics | null {
  if (!raw) return null;
  const metric = raw.metric ?? raw;
  if (!metric || typeof metric !== "object") return null;

  const pe = toNumber(metric.peTTM ?? metric.peNormalizedAnnual ?? metric.peBasicExclExtraTTM ?? metric.PERatio);
  const pb = toNumber(metric.pbAnnual ?? metric.pbQuarterly ?? metric.PriceToBookRatio);
  // Market cap is normalized to raw USD here, at ingestion, so every consumer
  // (prompt, comparison table, fallback reasoning) can format one unit.
  // Finnhub /stock/metric reports `marketCapitalization` in MILLIONS of USD
  // (AAPL comes back as ~3,650,000), while Alpha Vantage OVERVIEW reports
  // `MarketCapitalization` already in raw USD. Treating the Finnhub value as
  // raw dollars is what rendered a $3.65T company as "$3.65M".
  const marketCapRawFinnhub = toNumber(metric.marketCapitalization);
  const marketCapRawAlpha = toNumber(metric.MarketCapitalization);
  let marketCap: number | undefined = undefined;

  if (typeof marketCapRawAlpha === "number") {
    marketCap = marketCapRawAlpha;
  } else if (typeof marketCapRawFinnhub === "number") {
    marketCap = marketCapRawFinnhub * 1e6;
  }
  const revenueGrowth = normalizePercent(
    metric.revenueGrowthTTMYoy ?? metric.revenueGrowth3Y ?? metric.revenueGrowth5Y ?? metric.QuarterlyRevenueGrowthYOY
  );
  const debtToEquity = toNumber(metric.totalDebtToEquityQuarterly ?? metric.totalDebtToEquityAnnual ?? metric.DebtToEquity);
  const dividendYield = toNumber(metric.dividendYieldIndicatedAnnual ?? metric.currentDividendYieldTTM ?? metric.DividendYield);
  const eps = toNumber(metric.epsTTM ?? metric.epsBasicExclExtraItemsAnnual ?? metric.DilutedEPSTTM ?? metric.EPS);
  const high52 = toNumber(metric["52WeekHigh"] ?? metric.WeekHigh52);
  const low52 = toNumber(metric["52WeekLow"] ?? metric.WeekLow52);
  const return1m = normalizePercent(metric["1MonthPriceReturnDaily"] ?? metric["monthToDatePriceReturnDaily"]);
  const return3m = normalizePercent(metric["3MonthPriceReturnDaily"]);
  const return52w = normalizePercent(metric["52WeekPriceReturnDaily"]);

  const normalized: FinancialMetrics = {
    pe_ratio: pe,
    pb_ratio: pb,
    debt_to_equity: debtToEquity,
    dividend_yield: dividendYield,
    revenue_growth: revenueGrowth,
    eps,
    market_cap: marketCap,
    fifty_two_week_high: high52,
    fifty_two_week_low: low52,
    return_1m: return1m,
    return_3m: return3m,
    return_52w: return52w,
  };

  const hasAnyValue = Object.values(normalized).some((v) => v !== undefined && v !== null);
  return hasAnyValue ? normalized : null;
}

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
             (!!context.searchResults && context.searchResults.length > 0) ||
             (!!context.marketPulse && context.marketPulse.quotes.length > 0);
    
    case "info":
      return !!context.profile || !!context.news?.length;
    
    case "comparison":
      return !!context.priceData && !!context.news?.length;
    
    case "general":
      return !!context.priceData || !!context.news?.length ||
             (!!context.marketPulse && context.marketPulse.quotes.length > 0);
    
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

// userEmail (when present) lets the Indian-ticker branch of getFinnhubQuote
// try the user's own Kite/Zerodha feed first; undefined simply skips it.
async function fetchPriceData(symbol: string, userEmail?: string): Promise<PriceData | null> {
  try {
    const data = await withTimeout(
      getFinnhubQuote(symbol, userEmail),
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
    return normalizeMetrics(data);
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
  mode: Mode,
  userEmail?: string
): Promise<Partial<QueryContext>> {
  const context: Partial<QueryContext> = {
    query,
    intent,
    entity: entity || null,
    mode,
    timestamp: new Date(),
  };

  if (!entity?.symbol) {
    // "How is the market today / top gainers" is a macro question with no
    // ticker to hang a quote on. News and search answer the narrative; the
    // screener answers the actual tape. The screener trigger is the query
    // wording, not the intent label: "top gainers today" classifies as
    // `general`, and gating the branch on `macro` dropped the pulse data for
    // every phrasing the classifier did not happen to call macro.
    const pulseScreen = detectPulseScreen(query);

    if (intent === "macro" || mode === "pro" || pulseScreen) {
      const [news, searchResults, pulse] = await Promise.all([
        fetchGeneralNews(),
        webSearch(query, mode),
        pulseScreen ? withTimeout(getMarketPulse(pulseScreen, 15), PULSE_TIMEOUT_MS) : Promise.resolve(null),
      ]);
      context.news = news;
      context.searchResults = searchResults;
      context.marketPulse =
        pulseScreen && pulse && pulse.length > 0 ? { screen: pulseScreen, quotes: pulse } : null;
      if (news.length > 0) {
        context.sentiment = await analyzeSentiment(news.map((n) => n.headline));
      }
    }
    return context;
  }

  const needsSearch = shouldUseWebSearch(intent, mode, !!entity.symbol);
  const needsIndicators = mode === "pro" && intent !== "price";

  const tasks: QueuedTask<unknown>[] = [
    {
      id: "price",
      priority: 1,
      timeoutMs: 1300,
      task: () => fetchPriceData(entity.symbol!, userEmail),
    },
    {
      id: "profile",
      priority: 2,
      timeoutMs: 1500,
      task: () => fetchProfile(entity.symbol!),
    },
    {
      id: "metrics",
      priority: 2,
      timeoutMs: 3200,
      task: () => fetchMetrics(entity.symbol!),
    },
    {
      id: "news",
      priority: 2,
      timeoutMs: 3200,
      task: () => fetchCompanyNews(entity.symbol!),
    },
  ];

  if (needsSearch) {
    tasks.push({
      id: "search",
      priority: 3,
      timeoutMs: 4000,
      task: () => webSearch(query, mode),
    });
  }

  if (needsIndicators) {
    tasks.push({
      id: "indicators",
      priority: 3,
      timeoutMs: 3200,
      task: () => getTechnicalIndicators(entity.symbol!),
    });
  }

  const { results } = await runPriorityQueue(tasks, {
    concurrency: 4,
    stageTimeoutMs: { 1: 3000, 2: 8000, 3: 8000 },
  });

  context.priceData = (results.price as PriceData | null) || null;
  context.profile = (results.profile as CompanyProfile | null) || null;
  context.metrics = (results.metrics as FinancialMetrics | null) || null;
  context.news = (results.news as NewsItem[] | undefined) || [];
  context.searchResults = (results.search as SearchResult[] | undefined) || [];

  const indicators = results.indicators as any;
  if (indicators) {
    context.technicalIndicators = {
      rsi: indicators.rsi ? { value: indicators.rsi.value || null, signal: indicators.rsi.signal } : undefined,
      macd: indicators.macd ? { histogram: (indicators.macd.value as number) || 0, signal: indicators.macd.signal } : undefined,
      adx: indicators.adx ? { value: indicators.adx.value || null, signal: indicators.adx.signal } : undefined,
      sma20: (indicators.sma20?.value as number) || undefined,
    };
  }

  const headlines = context.news.map((n) => n.headline).slice(0, 10);
  if (headlines.length > 0) {
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
  mode: Mode,
  userEmail?: string
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

  const stockData: Record<string, { price?: PriceData | null; metrics?: FinancialMetrics | null; news?: NewsItem[] }> = {};
  const tasks: QueuedTask<unknown>[] = [];

  for (const symbol of symbols) {
    stockData[symbol] = {};
    tasks.push({
      id: `price:${symbol}`,
      priority: 1,
      timeoutMs: 1300,
      task: () => fetchPriceData(symbol, userEmail),
    });
    tasks.push({
      id: `metrics:${symbol}`,
      priority: 2,
      timeoutMs: 3200,
      task: () => fetchMetrics(symbol),
    });
    tasks.push({
      id: `news:${symbol}`,
      priority: 2,
      timeoutMs: 3200,
      task: () => fetchCompanyNews(symbol),
    });
  }

  tasks.push({
    id: "search",
    priority: 3,
    timeoutMs: 4500,
    task: () => (mode === "pro" || intent === "macro" || intent === "comparison" ? webSearch(query, mode) : Promise.resolve([])),
  });

  const { results, errors } = await runPriorityQueue(tasks, {
    concurrency: 5,
    stageTimeoutMs: { 1: 3500, 2: 9000, 3: 7000 },
  });

  const allNews: NewsItem[] = [];

  symbols.forEach((symbol, index) => {
    const price = (results[`price:${symbol}`] as PriceData | null) || null;
    const metrics = (results[`metrics:${symbol}`] as FinancialMetrics | null) || null;
    const news = (results[`news:${symbol}`] as NewsItem[] | undefined) || [];

    stockData[symbol] = { price, metrics, news };

    if (index === 0) {
      context.priceData = price;
      context.metrics = metrics;
    }

    allNews.push(...news);
  });

  context.news = allNews.slice(0, 14);
  context.searchResults = (results.search as SearchResult[] | undefined) || [];
  context.multiStockData = stockData;

  const headlines = allNews.map((n) => n.headline).slice(0, 10);
  context.sentiment = await analyzeSentiment(headlines);

  if (Object.keys(errors).length > 0) {
    console.warn("[ContextBuilder] Queue task errors:", errors);
  }

  return context;
}
