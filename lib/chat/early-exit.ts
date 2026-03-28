import { QueryContext, Intent } from "./types";

export interface EarlyExitResult {
  shouldExit: boolean;
  skipSteps: string[];
  reason?: string;
}

const CACHE_FRESHNESS_THRESHOLD = 30 * 1000;

export function isDataFresh(context: Partial<QueryContext>): boolean {
  if (!context.timestamp) return false;

  const age = Date.now() - context.timestamp.getTime();
  return age < CACHE_FRESHNESS_THRESHOLD;
}

export function shouldEarlyExit(
  query: string,
  context: Partial<QueryContext>,
  intent: Intent
): EarlyExitResult {
  if (intent === "price" && context.priceData) {
    return {
      shouldExit: false,
      skipSteps: ["search", "indicators"],
      reason: "Price query - skip expensive steps",
    };
  }

  if (isDataFresh(context) && isDataSufficientForIntent(context, intent)) {
    return {
      shouldExit: false,
      skipSteps: [],
      reason: "Data is fresh and sufficient",
    };
  }

  return {
    shouldExit: false,
    skipSteps: [],
  };
}

function isDataSufficientForIntent(
  context: Partial<QueryContext>,
  intent: Intent
): boolean {
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

export function getStepsToSkip(
  context: Partial<QueryContext>,
  intent: Intent,
  mode: string
): string[] {
  const stepsToSkip: string[] = [];

  if (intent === "price") {
    stepsToSkip.push("search", "indicators", "sentiment");
  }

  if (mode === "normal") {
    stepsToSkip.push("indicators");
  }

  if (!context.news || context.news.length === 0) {
    stepsToSkip.push("sentiment");
  }

  if (!context.searchResults || context.searchResults.length === 0) {
    if (intent === "general" || intent === "info") {
      // These intents might not need search
    }
  }

  return stepsToSkip;
}

export const EXECUTION_BUDGET_MS = 2500;

export function isWithinBudget(startTime: number): boolean {
  return Date.now() - startTime < EXECUTION_BUDGET_MS;
}

export function getRemainingBudget(startTime: number): number {
  return Math.max(0, EXECUTION_BUDGET_MS - (Date.now() - startTime));
}
