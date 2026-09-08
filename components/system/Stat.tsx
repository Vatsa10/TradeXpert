import * as React from "react";

import { cn } from "@/lib/utils";

import { Surface } from "./Surface";

export type StatTone = "neutral" | "positive" | "negative" | "warning" | "info" | "accent";

const TONE: Record<StatTone, string> = {
  neutral: "text-ink",
  positive: "text-positive",
  negative: "text-negative",
  warning: "text-warning",
  info: "text-info",
  accent: "text-brand",
};

const SIZE = {
  sm: "text-lg",
  md: "text-[1.375rem] leading-tight sm:text-2xl",
  lg: "text-2xl leading-tight sm:text-[1.75rem]",
} as const;

export interface StatCardProps {
  label: React.ReactNode;
  /** A string, a number, or a <Money>/<Percent>/<Delta> element. */
  value: React.ReactNode;
  /** Secondary line under the value — a delta, a source note, a period. */
  hint?: React.ReactNode;
  tone?: StatTone;
  size?: "sm" | "md" | "lg";
  /** Small leading glyph (lucide icon element). */
  icon?: React.ReactNode;
  /** Stagger index — feeds the `--i` custom property on `.app-enter`. */
  index?: number;
  className?: string;
}

/**
 * One metric tile. Used by dashboard, tools, paper and analysis — this is the
 * only stat implementation in the app.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  size = "md",
  icon,
  index,
  className,
}: StatCardProps) {
  return (
    <Surface
      level="raised-2"
      radius="tile"
      padding="sm"
      className={cn("app-enter sm:p-4", className)}
      style={index === undefined ? undefined : ({ "--i": index } as React.CSSProperties)}
    >
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-ink-faint [&_svg]:size-3.5">{icon}</span>}
        <p className="app-label truncate">{label}</p>
      </div>
      <p className={cn("mt-1.5 font-semibold tracking-tight tnum", SIZE[size], TONE[tone])}>
        {value}
      </p>
      {hint !== undefined && hint !== null && (
        <p className="mt-1 text-xs text-ink-faint">{hint}</p>
      )}
    </Surface>
  );
}

export interface StatGridProps extends React.ComponentPropsWithoutRef<"div"> {
  /** Columns at the widest breakpoint. Steps down responsively. */
  columns?: 2 | 3 | 4 | 5 | 6;
  children?: React.ReactNode;
}

const COLUMNS: Record<NonNullable<StatGridProps["columns"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

/** Responsive tile grid. Tight horizontal gutters, generous vertical rhythm. */
export function StatGrid({ columns = 4, className, ...rest }: StatGridProps) {
  return <div className={cn("grid gap-3", COLUMNS[columns], className)} {...rest} />;
}
