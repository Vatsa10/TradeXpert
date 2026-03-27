
import { normalFlow, FlowResult as NormalResult } from "./flows/normal";
import { thinkingFlow, FlowResult as ThinkingResult } from "./flows/thinking";
import { proFlow, FlowResult as ProResult } from "./flows/pro";
import { extractSymbolFromQuery } from "./aggregator";

export type Mode = "normal" | "thinking" | "pro";

export type FlowResult = NormalResult | ThinkingResult | ProResult;

const SEARCH_TRIGGERS = [
  "why",
  "reason",
  "impact",
  "news",
  "current",
  "latest",
  "happening",
  "effect",
  "because",
  "analysis",
  "2025",
  "2026",
];

export function shouldUseSearch(query: string, mode: Mode): boolean {
  if (mode === "pro") return true;

  if (mode === "thinking") {
    const lowerQuery = query.toLowerCase();
    return SEARCH_TRIGGERS.some((trigger) => lowerQuery.includes(trigger));
  }

  return false;
}

const STOCK_KEYWORDS = [
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
  "price",
  "market",
  "portfolio",
  "equity",
  "dividend",
  "earnings",
  "profit",
  "revenue",
  "growth",
  "valuation",
  "bullish",
  "bearish",
];

const STOCK_PATTERN = /\b([A-Z]{1,5})\b/;

function isStockQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  const hasStockKeyword = STOCK_KEYWORDS.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  const hasStockTicker = STOCK_PATTERN.test(query);

  return hasStockKeyword || hasStockTicker;
}

export function resolveMode(
  query: string,
  userMode?: Mode
): Mode {
  if (userMode === "pro") return "pro";
  if (userMode === "thinking") return "thinking";

  if (isStockQuery(query)) {
    return "thinking";
  }

  return "normal";
}

export async function executeQuery(
  query: string,
  mode?: Mode
): Promise<FlowResult> {
  const resolvedMode = resolveMode(query, mode);

  console.log(`[Chat] Query: "${query.substring(0, 50)}..." | Mode: ${resolvedMode}`);

  switch (resolvedMode) {
    case "pro":
      return proFlow(query);
    case "thinking":
      return thinkingFlow(query);
    default:
      return normalFlow(query);
  }
}

export function isModeValid(mode: string | undefined): mode is Mode {
  return mode === "normal" || mode === "thinking" || mode === "pro";
}
