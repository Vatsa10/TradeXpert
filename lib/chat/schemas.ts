// 3-tier LLM output parsing, ported from india-trade-cli's
// agent/schemas.py + schema_parser.py (Pydantic -> Zod equivalent):
// 1) direct JSON.parse + zod validation
// 2) regex-extract a JSON object embedded in prose, then validate
// 3) safe default (caller-supplied)
// Hardens the existing manual JSON parsing in lib/chat/response.ts against
// LLMs that wrap JSON in markdown fences or explanatory text.

import { z } from "zod";

export interface ParseLLMJsonResult<T> {
  data: T;
  tier: "json" | "extracted" | "fallback";
}

function tryZodParse<T>(schema: z.ZodType<T>, value: unknown): T | null {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}

function extractJSONBlock(raw: string): string | null {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }
  return null;
}

export function parseLLMJson<T>(
  raw: string,
  schema: z.ZodType<T>,
  fallback: T
): ParseLLMJsonResult<T> {
  // Tier 1: direct parse.
  try {
    const parsed = tryZodParse(schema, JSON.parse(raw));
    if (parsed !== null) return { data: parsed, tier: "json" };
  } catch {
    // fall through
  }

  // Tier 2: extract embedded JSON (fenced block or outermost braces).
  const extracted = extractJSONBlock(raw);
  if (extracted) {
    try {
      const parsed = tryZodParse(schema, JSON.parse(extracted));
      if (parsed !== null) return { data: parsed, tier: "extracted" };
    } catch {
      // fall through
    }
  }

  // Tier 3: safe default.
  return { data: fallback, tier: "fallback" };
}
