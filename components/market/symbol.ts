import type { CurrencyCode } from "@/components/system";

/**
 * Indian listings (`.NS` = NSE, `.BO` = BSE) quote in rupees; everything else
 * on the Finnhub feed quotes in US dollars. This is the single place that
 * mapping lives — never hardcode a currency at a call site.
 */
export function currencyForSymbol(symbol?: string | null): CurrencyCode {
  const s = (symbol ?? "").trim().toUpperCase();
  return s.endsWith(".NS") || s.endsWith(".BO") ? "INR" : "USD";
}

/** Human exchange label for a symbol, or null when it is not an Indian listing. */
export function exchangeForSymbol(symbol?: string | null): string | null {
  const s = (symbol ?? "").trim().toUpperCase();
  if (s.endsWith(".NS")) return "NSE";
  if (s.endsWith(".BO")) return "BSE";
  return null;
}

/**
 * Upstream actions hand back pre-formatted strings (`peRatio: "24.3" | "—"`).
 * Coerce to a number so the system `NumberValue` can own the em-dash fallback,
 * without changing what the action returns.
 */
export function toNum(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9.+-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
