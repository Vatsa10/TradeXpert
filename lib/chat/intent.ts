import { Intent, Entity } from "./types";

const STOCK_PATTERN = /\b([A-Z]{1,5})\b/;

const INTENT_PATTERNS: Record<Intent, string[]> = {
  price: [
    "price",
    "current price",
    "trading at",
    "worth",
    "value",
    "cost",
    "quote",
  ],
  reason: [
    "why",
    "reason",
    "because",
    "分析",
    "explain",
    "what caused",
    "driving",
    "due to",
  ],
  macro: [
    "market",
    "economy",
    "fed",
    "interest rate",
    "inflation",
    "recession",
    "war",
    "geopolitical",
    "global",
    "impact of",
    "effect on",
    "outlook",
  ],
  info: [
    "about",
    "who is",
    "what is",
    "company",
    "business",
    "industry",
    "history",
  ],
  comparison: [
    "compare",
    "vs",
    "versus",
    "better than",
    "difference between",
    "or",
    "should i buy",
    "should i sell",
  ],
  general: [],
};

export function classifyIntent(query: string): Intent {
  const lowerQuery = query.toLowerCase();
  
  const scores: Record<Intent, number> = {
    price: 0,
    reason: 0,
    macro: 0,
    info: 0,
    comparison: 0,
    general: 0,
  };

  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        scores[intent as Intent] += 1;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  
  if (maxScore === 0) {
    return "general";
  }

  const detectedIntent = Object.entries(scores).find(
    ([, score]) => score === maxScore
  )?.[0] as Intent;

  return detectedIntent || "general";
}

export function extractEntity(query: string): Entity | null {
  const symbols = extractAllSymbols(query);
  
  if (symbols.length > 0) {
    return {
      symbol: symbols[0],
      type: "stock",
    };
  }

  const companyPatterns: Record<string, string> = {
    apple: "AAPL",
    microsoft: "MSFT",
    google: "GOOGL",
    alphabet: "GOOGL",
    amazon: "AMZN",
    tesla: "TSLA",
    meta: "META",
    facebook: "META",
    nvidia: "NVDA",
    netflix: "NFLX",
    jpmorgan: "JPM",
    "jp": "JPM",
    berkshire: "BRK",
    reliance: "RELIANCE",
    tcs: "TCS",
    infosys: "INFY",
    wipro: "WIPRO",
    hdfc: "HDFCBANK",
    icici: "ICICIBANK",
    "state bank": "SBIN",
    baba: "BABA",
    alibaba: "BABA",
    tencent: "TCEHY",
    tata: "TCS",
    "state bank of india": "SBIN",
    tech: "QQQ",
    nasdaq: "QQQ",
    sp500: "SPY",
    "s&p": "SPY",
    dow: "DIA",
    bitcoin: "BTC",
    btc: "BTC",
    ethereum: "ETH",
    eth: "ETH",
  };

  for (const [company, symbol] of Object.entries(companyPatterns)) {
    if (mentionsCompany(query, company)) {
      return {
        symbol,
        company,
        type: "stock",
      };
    }
  }

  return null;
}

// Tickers that collide with ordinary English words (or common abbreviations).
// These are only accepted when the user gave an explicit signal: the token is
// UPPERCASE in the original query, or it is $-prefixed.
const AMBIGUOUS_TICKERS = new Set([
  "NOW", "NET", "IQ", "V", "ALL", "IT", "ON", "ANY", "KEY", "SO", "ARE",
  "FOR", "A", "AN", "AT", "BE", "BY", "GO", "HE", "IF", "IN", "IS", "ME",
  "NO", "OR", "SEE", "TEAM", "PENN", "ZEN", "COIN", "SNAP", "SHOP", "PINS",
  "DISH", "DOT", "SOL", "ADA", "LI", "JD", "YY", "ZM", "SQ", "TME", "WELL",
]);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A ticker mention counts when it is $-prefixed, or written in uppercase with
// word boundaries. Unambiguous tickers may also be written in any case.
function mentionsTicker(query: string, symbol: string): boolean {
  const escaped = escapeRegex(symbol);

  if (new RegExp(`\\$${escaped}\\b`, "i").test(query)) {
    return true;
  }

  if (new RegExp(`(?<![A-Za-z0-9$.])${escaped}(?![A-Za-z0-9.])`).test(query)) {
    return true;
  }

  if (AMBIGUOUS_TICKERS.has(symbol)) {
    return false;
  }

  return new RegExp(`(?<![A-Za-z0-9$.])${escaped}(?![A-Za-z0-9.])`, "i").test(query);
}

// Company names are matched on word boundaries so "fintech" is not "tech"
// and "jpeg" is not "jp".
function mentionsCompany(query: string, company: string): boolean {
  return new RegExp(`\\b${escapeRegex(company)}\\b`, "i").test(query);
}

export function extractAllSymbols(query: string): string[] {
  const symbols: string[] = [];

  const tickerSymbols = [
    "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "TSLA", "META", "NVDA", "NFLX",
    "JPM", "V", "WMT", "DIS", "PYPL", "INTC", "AMD", "CRM", "ORCL", "ADBE",
    "UBER", "LYFT", "SNAP", "PINS", "SQ", "SHOP", "ROKU", "DOCU", "ZM", "PLTR",
    "COIN", "RBLX", "SNOW", "DDOG", "CRWD", "NET", "OKTA", "TWLO", "PENN",
    "DISCA", "DISCK", "DISH", "CHWY", "COUP", "ZEN", "SPLK", "NOW", "TTD",
    "IQ", "YY", "HUBS", "MDB", "TEAM", "NET", "OKTA", "ZEN", "COUP", "ZS",
    "BRK", "BRK.A", "BRK.B", "RELIANCE", "TCS", "INFY", "WIPRO", "HDFCBANK",
    "ICICIBANK", "SBIN", "BABA", "JD", "PDD", "TME", "BILI", "NIO", "XPEV", "LI",
    "SPY", "QQQ", "DIA", "IWM", "BTC", "ETH", "SOL", "ADA", "DOT", "AVAX",
  ];

  const companyToSymbol: Record<string, string> = {
    apple: "AAPL",
    microsoft: "MSFT",
    google: "GOOGL",
    alphabet: "GOOGL",
    amazon: "AMZN",
    tesla: "TSLA",
    meta: "META",
    facebook: "META",
    nvidia: "NVDA",
    netflix: "NFLX",
    jpmorgan: "JPM",
    "jp": "JPM",
    berkshire: "BRK",
    reliance: "RELIANCE",
    tcs: "TCS",
    infosys: "INFY",
    wipro: "WIPRO",
    hdfc: "HDFCBANK",
    icici: "ICICIBANK",
    "state bank": "SBIN",
    baba: "BABA",
    alibaba: "BABA",
    tencent: "TCEHY",
    tata: "TCS",
    "state bank of india": "SBIN",
    tech: "QQQ",
    nasdaq: "QQQ",
    sp500: "SPY",
    "s&p": "SPY",
    dow: "DIA",
    bitcoin: "BTC",
    btc: "BTC",
    ethereum: "ETH",
    eth: "ETH",
  };

  for (const symbol of tickerSymbols) {
    if (mentionsTicker(query, symbol)) {
      if (!symbols.includes(symbol)) {
        symbols.push(symbol);
      }
    }
  }

  for (const [company, symbol] of Object.entries(companyToSymbol)) {
    if (mentionsCompany(query, company)) {
      if (!symbols.includes(symbol)) {
        symbols.push(symbol);
      }
    }
  }

  return symbols;
}

export function isStockRelated(query: string): boolean {
  const hasSymbol = STOCK_PATTERN.test(query);
  
  const stockKeywords = [
    "stock",
    "share",
    "shares",
    "invest",
    "investment",
    "trading",
    "trade",
    "buy",
    "sell",
    "hold",
    "portfolio",
    "equity",
    "dividend",
    "earnings",
    "profit",
    "revenue",
    "bullish",
    "bearish",
    "market cap",
    "pe ratio",
    "eps",
  ];

  const lowerQuery = query.toLowerCase();
  const hasKeyword = stockKeywords.some((kw) => lowerQuery.includes(kw));

  return hasSymbol || hasKeyword;
}
