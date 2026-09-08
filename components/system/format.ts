/**
 * Number / currency formatting for the whole app.
 *
 * Rules, enforced here so no page has to re-derive them:
 *  - a missing, null or non-finite value renders as `EM_DASH` ("—").
 *    Never "NaN", never a silent "0".
 *  - Indian currency uses the en-IN grouping (1,00,000); everything else
 *    falls back to en-US.
 *  - Callers that need JSX (sign colouring) use <Money>/<Percent>/<Delta>.
 */

export const EM_DASH = "—";

/** ISO code -> symbol. Anything unknown falls through to the code itself. */
const SYMBOLS: Record<string, string> = {
  INR: "\u20B9",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  JPY: "\u00A5",
};

export type CurrencyCode = string;

export function currencySymbol(currency: CurrencyCode = "USD"): string {
  return SYMBOLS[currency.toUpperCase()] ?? `${currency.toUpperCase()} `;
}

/** en-IN grouping for INR, en-US for everything else. */
function localeFor(currency: CurrencyCode): string {
  return currency.toUpperCase() === "INR" ? "en-IN" : "en-US";
}

export function isNum(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Plain number. `formatNum(1.23456)` -> "1.23" */
export function formatNum(value: unknown, digits = 2): string {
  return isNum(value) ? value.toFixed(digits) : EM_DASH;
}

/**
 * Ratio -> percent string. Input is a RATIO (0.0421 -> "4.21%").
 * For values that are already percentages use `formatPercentPoints`.
 */
export function formatPct(value: unknown, digits = 2): string {
  return isNum(value) ? `${(value * 100).toFixed(digits)}%` : EM_DASH;
}

/** Value already expressed in percentage points (4.21 -> "4.21%"). */
export function formatPercentPoints(value: unknown, digits = 2): string {
  return isNum(value) ? `${value.toFixed(digits)}%` : EM_DASH;
}

/**
 * Currency with grouping. Defaults to USD so the legacy
 * `components/tools/shared` signature keeps working unchanged.
 */
export function formatMoney(
  value: unknown,
  currency: CurrencyCode = "USD",
  digits?: number
): string {
  if (!isNum(value)) return EM_DASH;
  const fraction = digits ?? (Math.abs(value) >= 1000 ? 0 : 2);
  return `${currencySymbol(currency)}${value.toLocaleString(localeFor(currency), {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  })}`;
}

/**
 * Compact currency. INR uses the Indian ladder (K / L / Cr) because
 * "₹1.2M" is not how an Indian market figure is ever quoted.
 */
export function formatCompactMoney(
  value: unknown,
  currency: CurrencyCode = "USD"
): string {
  if (!isNum(value)) return EM_DASH;
  const symbol = currencySymbol(currency);
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (currency.toUpperCase() === "INR") {
    if (abs >= 1e7) return `${sign}${symbol}${(abs / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `${sign}${symbol}${(abs / 1e5).toFixed(2)} L`;
    if (abs >= 1e3) return `${sign}${symbol}${(abs / 1e3).toFixed(2)}K`;
    return `${sign}${symbol}${abs.toFixed(2)}`;
  }

  return `${sign}${symbol}${abs.toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  })}`;
}

/** Compact plain number: 1_240_000 -> "1.2M". */
export function formatCompactNum(value: unknown, digits = 1): string {
  return isNum(value)
    ? value.toLocaleString("en-US", {
        notation: "compact",
        maximumFractionDigits: digits,
      })
    : EM_DASH;
}

/** Signed prefix used by delta displays. Zero is unsigned. */
export function signPrefix(value: number): string {
  return value > 0 ? "+" : "";
}

/** Direction of a market figure. `null` when there is nothing to colour. */
export type Direction = "up" | "down" | "flat" | null;

export function directionOf(value: unknown): Direction {
  if (!isNum(value)) return null;
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}
