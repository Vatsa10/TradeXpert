import { QueryContext, Intent } from "./types";

export function calibrateConfidence(
  rawConfidence: number,
  context: Partial<QueryContext>,
  intent: Intent
): number {
  let score = rawConfidence;

  const hasPrice = !!context.priceData;
  const hasNews = !!(context.news && context.news.length > 0);
  const hasSearch = !!(context.searchResults && context.searchResults.length > 0);
  const hasMetrics = !!context.metrics;
  const hasSentiment = !!context.sentiment;

  if (!hasPrice) {
    score *= 0.7;
  }

  if (!hasNews) {
    score *= 0.85;
  }

  if (!hasMetrics) {
    score *= 0.9;
  }

  if (!hasSentiment && intent === "reason") {
    score *= 0.8;
  }

  if (!hasSearch && intent === "macro") {
    score *= 0.6;
  }

  if (hasPrice && hasNews && hasMetrics) {
    score = Math.min(score * 1.1, 1);
  }

  return Math.min(Math.max(score, 0), 1);
}

export function getDataQuality(context: Partial<QueryContext>): "high" | "medium" | "low" {
  let score = 0;

  if (context.priceData) score += 3;
  if (context.metrics) score += 2;
  if (context.news && context.news.length > 0) score += 2;
  if (context.searchResults && context.searchResults.length > 0) score += 1;
  if (context.sentiment) score += 1;
  if (context.profile) score += 1;

  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

export function getQualityLabel(quality: "high" | "medium" | "low"): string {
  switch (quality) {
    case "high":
      return "🟢 High";
    case "medium":
      return "🟡 Medium";
    case "low":
      return "🔴 Low";
    default:
      return "Unknown";
  }
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "Very High";
  if (confidence >= 0.6) return "High";
  if (confidence >= 0.4) return "Medium";
  if (confidence >= 0.2) return "Low";
  return "Very Low";
}
