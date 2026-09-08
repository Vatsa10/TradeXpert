import * as React from "react";

import { cn } from "@/lib/utils";

import {
  EM_DASH,
  type CurrencyCode,
  type Direction,
  directionOf,
  formatCompactMoney,
  formatMoney,
  formatNum,
  formatPercentPoints,
  isNum,
  signPrefix,
} from "./format";

/** Market direction -> colour. The single place green=up / red=down lives. */
export const DIRECTION_CLASS: Record<"up" | "down" | "flat", string> = {
  up: "text-up",
  down: "text-down",
  flat: "text-ink",
};

export function directionClass(direction: Direction): string {
  return direction ? DIRECTION_CLASS[direction] : "text-ink-faint";
}

interface BaseValueProps {
  className?: string;
  /** Text shown when the value is missing. Defaults to an em dash. */
  fallback?: string;
  title?: string;
}

export interface MoneyProps extends BaseValueProps {
  value: number | null | undefined;
  /** ISO code — "INR" renders ₹ with Indian grouping, "USD" renders $. */
  currency?: CurrencyCode;
  /** Fixed decimals. Omit for the automatic 0/2 rule. */
  digits?: number;
  /** K / L / Cr for INR, K / M / B otherwise. */
  compact?: boolean;
  /** Colour by sign using the market up/down tokens. */
  colored?: boolean;
  /** Force a leading "+" on positive values. */
  signed?: boolean;
}

/** Currency figure. Null-safe, tabular, never prints "NaN". */
export function Money({
  value,
  currency = "INR",
  digits,
  compact = false,
  colored = false,
  signed = false,
  fallback = EM_DASH,
  className,
  title,
}: MoneyProps) {
  if (!isNum(value)) {
    return <span className={cn("tnum text-ink-faint", className)}>{fallback}</span>;
  }
  const body = compact
    ? formatCompactMoney(value, currency)
    : formatMoney(value, currency, digits);

  return (
    <span
      className={cn("tnum", colored ? directionClass(directionOf(value)) : undefined, className)}
      title={title}
    >
      {signed ? signPrefix(value) : ""}
      {body}
    </span>
  );
}

export interface PercentProps extends BaseValueProps {
  value: number | null | undefined;
  /**
   * How `value` is expressed. "points" (default) means 4.21 -> "4.21%";
   * "ratio" means 0.0421 -> "4.21%".
   */
  as?: "points" | "ratio";
  digits?: number;
  colored?: boolean;
  signed?: boolean;
}

/** Percentage figure. */
export function Percent({
  value,
  as = "points",
  digits = 2,
  colored = false,
  signed = false,
  fallback = EM_DASH,
  className,
  title,
}: PercentProps) {
  if (!isNum(value)) {
    return <span className={cn("tnum text-ink-faint", className)}>{fallback}</span>;
  }
  const points = as === "ratio" ? value * 100 : value;

  return (
    <span
      className={cn("tnum", colored ? directionClass(directionOf(points)) : undefined, className)}
      title={title}
    >
      {signed ? signPrefix(points) : ""}
      {formatPercentPoints(points, digits)}
    </span>
  );
}

export interface DeltaProps extends BaseValueProps {
  /** Absolute change. Omit to show the percentage alone. */
  value?: number | null;
  /** Percentage-point change, e.g. -1.24 for -1.24%. */
  percent?: number | null;
  currency?: CurrencyCode;
  digits?: number;
  /** Render the absolute change as currency rather than a bare number. */
  money?: boolean;
  /** Small ▲/▼ glyph before the figure. */
  arrow?: boolean;
  size?: "sm" | "md" | "lg";
}

const DELTA_SIZE = { sm: "text-xs", md: "text-sm", lg: "text-base" } as const;

/**
 * Signed change display — the canonical "+12.40 (+1.24%)" cell.
 * Colours from the market up/down tokens; renders "—" when both inputs
 * are missing rather than a misleading zero.
 */
export function Delta({
  value,
  percent,
  currency = "INR",
  digits = 2,
  money = false,
  arrow = false,
  size = "md",
  fallback = EM_DASH,
  className,
  title,
}: DeltaProps) {
  const basis = isNum(value) ? value : isNum(percent) ? percent : null;

  if (basis === null) {
    return (
      <span className={cn("tnum text-ink-faint", DELTA_SIZE[size], className)}>{fallback}</span>
    );
  }

  const direction = directionOf(basis) ?? "flat";
  const parts: string[] = [];

  if (isNum(value)) {
    parts.push(
      signPrefix(value) +
        (money ? formatMoney(value, currency, digits) : formatNum(value, digits))
    );
  }
  if (isNum(percent)) {
    const p = `${signPrefix(percent)}${formatPercentPoints(percent, digits)}`;
    parts.push(parts.length ? `(${p})` : p);
  }

  return (
    <span
      className={cn(
        "tnum font-medium",
        DELTA_SIZE[size],
        DIRECTION_CLASS[direction],
        className
      )}
      title={title}
    >
      {arrow && direction !== "flat" && (
        <span aria-hidden className="mr-1 text-[0.7em]">
          {direction === "up" ? "\u25B2" : "\u25BC"}
        </span>
      )}
      {parts.join(" ")}
    </span>
  );
}

export interface NumberValueProps extends BaseValueProps {
  value: number | null | undefined;
  digits?: number;
  /** Appended after a thin space, e.g. "x", "days". */
  unit?: string;
}

/** Plain tabular number with an optional unit. */
export function NumberValue({
  value,
  digits = 2,
  unit,
  fallback = EM_DASH,
  className,
  title,
}: NumberValueProps) {
  const ok = isNum(value);
  return (
    <span className={cn("tnum", ok ? "text-ink" : "text-ink-faint", className)} title={title}>
      {ok ? formatNum(value, digits) : fallback}
      {ok && unit ? <span className="ml-0.5 text-ink-faint">{unit}</span> : null}
    </span>
  );
}
