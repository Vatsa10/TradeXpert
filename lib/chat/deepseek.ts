// DeepSeek V4 Flash (DeepSeek-V4-Flash-0731) via its OpenAI-compatible API.
// Two presets:
//  - fallback LLM (thinking disabled): fast answer when Gemini fails/cools down
//  - reasoner LLM (thinking enabled, high effort): deep second-opinion tier
// Thinking mode is on by default upstream and ignores temperature/top_p, so
// the fallback preset explicitly disables it for latency.
// Requires DEEPSEEK_API_KEY; silently disabled without it.

import { ChatOpenAI } from "@langchain/openai";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

let fallbackCached: ChatOpenAI | null = null;
let reasonerCached: ChatOpenAI | null = null;

export function isDeepSeekEnabled(): boolean {
  return !!DEEPSEEK_API_KEY;
}

// Fast non-thinking preset — drop-in fallback when Gemini errors or is rate-limited.
export function getDeepSeekLLM(): ChatOpenAI | null {
  if (!DEEPSEEK_API_KEY) return null;
  if (!fallbackCached) {
    fallbackCached = new ChatOpenAI({
      model: DEEPSEEK_MODEL,
      apiKey: DEEPSEEK_API_KEY,
      configuration: { baseURL: DEEPSEEK_BASE_URL },
      maxTokens: 1400,
      temperature: 0.2,
      modelKwargs: {
        thinking: { type: "disabled" },
      },
    });
  }
  return fallbackCached;
}

// Thinking-mode preset (chain-of-thought, high effort) — for pro-mode review /
// second-opinion passes where accuracy beats latency. temperature is ignored
// by the API in thinking mode, so it is not set here.
export function getDeepSeekReasonerLLM(): ChatOpenAI | null {
  if (!DEEPSEEK_API_KEY) return null;
  if (!reasonerCached) {
    reasonerCached = new ChatOpenAI({
      model: DEEPSEEK_MODEL,
      apiKey: DEEPSEEK_API_KEY,
      configuration: { baseURL: DEEPSEEK_BASE_URL },
      maxTokens: 2200,
      modelKwargs: {
        thinking: { type: "enabled" },
        reasoning_effort: "high",
      },
    });
  }
  return reasonerCached;
}
