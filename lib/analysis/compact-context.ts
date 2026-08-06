// Compact-for-LLM trimming, ported from
// intraday-stock-targets/trading_engine.py:555-563 (compact_tool_output).
// Strips large array/series fields and truncates long strings before data
// is fed into an LLM prompt, so a rich context object (candles, correlation
// matrices, full news dumps) doesn't blow up token usage or cost.

const LARGE_ARRAY_KEYS = new Set([
  "prices", "priceSeries", "price_series", "candles", "history",
  "correlationMatrix", "correlation_matrix", "series", "ohlcv",
]);

const MAX_ARRAY_PREVIEW = 5;
const MAX_STRING_CHARS = 2500;

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_CHARS) return value;
  return `${value.slice(0, MAX_STRING_CHARS)}... [truncated ${value.length - MAX_STRING_CHARS} chars]`;
}

function compactValue(value: any, key?: string): any {
  if (typeof value === "string") return truncateString(value);
  if (typeof value !== "object" || value === null) return value;

  if (Array.isArray(value)) {
    if (key && LARGE_ARRAY_KEYS.has(key) && value.length > MAX_ARRAY_PREVIEW) {
      return {
        _truncated: true,
        length: value.length,
        preview: value.slice(0, MAX_ARRAY_PREVIEW).map((v) => compactValue(v)),
      };
    }
    if (value.length > 50) {
      return {
        _truncated: true,
        length: value.length,
        preview: value.slice(0, MAX_ARRAY_PREVIEW).map((v) => compactValue(v)),
      };
    }
    return value.map((v) => compactValue(v));
  }

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = compactValue(v, k);
  }
  return out;
}

// Trims an arbitrary object (tool output, aggregated context) down to
// something safe to interpolate into an LLM prompt.
export function compactForLLM(input: any): any {
  return compactValue(input);
}

// Convenience for string-shaped context blobs (already-formatted prompt text).
export function compactText(input: string): string {
  return truncateString(input);
}
