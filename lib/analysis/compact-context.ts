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

function truncateString(value: string, maxChars: number = MAX_STRING_CHARS): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}... [truncated ${value.length - maxChars} chars]`;
}

const MAX_DEPTH = 12;

function compactValue(value: any, key?: string, seen?: WeakSet<object>, depth = 0): any {
  if (typeof value === "string") return truncateString(value);
  if (typeof value !== "object" || value === null) return value;

  // Dates/RegExps have no own enumerable properties, so the generic
  // Object.entries branch below silently flattened every Date in the context
  // to `{}`. Serialize them instead.
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (value instanceof RegExp) return value.toString();
  if (value instanceof Map) return compactValue(Object.fromEntries(value), key, seen, depth);
  if (value instanceof Set) return compactValue([...value], key, seen, depth);

  if (depth >= MAX_DEPTH) return "[max depth]";

  // Aggregated context objects (Mongoose docs, provider payloads holding
  // back-references) can contain cycles; without this guard compactForLLM
  // recurses until the stack overflows and takes the whole request down.
  const visited = seen ?? new WeakSet<object>();
  if (visited.has(value)) return "[circular]";
  visited.add(value);

  try {
    if (Array.isArray(value)) {
      const isLarge = (key && LARGE_ARRAY_KEYS.has(key)) || value.length > 50;
      if (isLarge && value.length > MAX_ARRAY_PREVIEW) {
        return {
          _truncated: true,
          length: value.length,
          preview: value.slice(0, MAX_ARRAY_PREVIEW).map((v) => compactValue(v, undefined, visited, depth + 1)),
        };
      }
      return value.map((v) => compactValue(v, undefined, visited, depth + 1));
    }

    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = compactValue(v, k, visited, depth + 1);
    }
    return out;
  } finally {
    // Release on the way out so a value legitimately referenced twice in
    // sibling branches (a shared quote object, say) is not falsely reported
    // as circular — only true ancestor cycles are.
    visited.delete(value);
  }
}

// Trims an arbitrary object (tool output, aggregated context) down to
// something safe to interpolate into an LLM prompt.
export function compactForLLM(input: any): any {
  return compactValue(input);
}

// Convenience for string-shaped context blobs (already-formatted prompt text).
// `maxChars` lets a caller raise the budget for a primary payload (e.g. the
// full quantitative stock context) rather than sharing the incidental-field default.
export function compactText(input: string, maxChars: number = MAX_STRING_CHARS): string {
  return truncateString(input, maxChars);
}
