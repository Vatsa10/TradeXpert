/**
 * Shared chat types. Mirrors the /api/chat response contract exactly —
 * see app/api/chat/route.ts and lib/chat/types.ts. Presentation only:
 * nothing here changes what is sent or received.
 */

export type Mode = "normal" | "thinking" | "pro";

export type Trend = "bullish" | "bearish" | "neutral";

export type Advice = "Buy" | "Hold" | "Sell" | "Wait";

export type DataQuality = "high" | "medium" | "low";

export interface GroundingSource {
  type: "finnhub" | "news" | "search" | "alpha" | "llm";
  title?: string;
  url?: string;
}

/** `llmResponse` on the POST /api/chat payload. Absent for older sessions. */
export interface LLMResponse {
  summary: string;
  trend: Trend;
  reasoning: string[];
  advice: Advice;
  recommendation?: string;
  confidence: number; // 0..1
  dataQuality: DataQuality;
  sources: GroundingSource[];
  signalTrace: string[];
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

export interface SentimentResult {
  overallSentiment: Trend;
  confidence: number;
  macroSignals: string[];
  keyHeadlines: string[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  mode?: Mode;
  sources?: string[];
  /** Structured grounding, present only on live responses. */
  llmResponse?: LLMResponse;
  signals?: SignalBundle;
  sentiment?: SentimentResult;
}

export interface Session {
  sessionId: string;
  title: string;
  mode: Mode;
  preview?: string;
  createdAt: string;
}

export interface Quota {
  standardCount: number;
  proCount: number;
  standardLimit: number;
  proLimit: number;
}

export interface Notice {
  kind: "quota" | "network";
  message: string;
}

export const MODE_COPY: Record<Mode, { label: string; caption: string; placeholder: string }> = {
  normal: {
    label: "Normal",
    caption: "Quick Answers",
    placeholder: "Ask anything...",
  },
  thinking: {
    label: "Think",
    caption: "Market Reasoning Mode",
    placeholder: "Ask about a stock...",
  },
  pro: {
    label: "Pro",
    caption: "Deep Analysis Mode",
    placeholder: "Ask for deep analysis...",
  },
};

export function isMode(value: unknown): value is Mode {
  return value === "normal" || value === "thinking" || value === "pro";
}
