import * as React from "react";
import { Check, LoaderCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type SemanticTone =
  | "neutral"
  | "positive"
  | "negative"
  | "warning"
  | "info"
  | "accent"
  | "up"
  | "down";

const TONE: Record<SemanticTone, string> = {
  neutral: "border-hairline-strong bg-white/5 text-ink-secondary",
  positive: "border-positive/30 bg-positive/10 text-positive",
  negative: "border-negative/30 bg-negative/10 text-negative",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-info/30 bg-info/10 text-info",
  accent: "border-brand/30 bg-brand/10 text-brand",
  up: "border-up/30 bg-up/10 text-up",
  down: "border-down/30 bg-down/10 text-down",
};

export interface BadgeProps extends React.ComponentPropsWithoutRef<"span"> {
  tone?: SemanticTone;
  size?: "sm" | "md";
  /** Fully rounded rather than the default squared-off chip. */
  pill?: boolean;
  /** UPPERCASE + letter-spacing, for regime / status labels. */
  uppercase?: boolean;
}

/** Small semantic label. Squared by default; `pill` for the rounded variant. */
export function Badge({
  tone = "neutral",
  size = "sm",
  pill = false,
  uppercase = false,
  className,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[0.6875rem]" : "px-2.5 py-1 text-xs",
        pill ? "rounded-full" : "rounded-md",
        uppercase && "uppercase tracking-widest",
        TONE[tone],
        className
      )}
      {...rest}
    />
  );
}

/** Rounded Badge. Same props, `pill` forced on. */
export function Pill(props: BadgeProps) {
  return <Badge {...props} pill />;
}

export type StatusKind = "idle" | "pending" | "done" | "error";

const STATUS: Record<StatusKind, { tone: SemanticTone; icon: React.ReactNode }> = {
  idle: { tone: "neutral", icon: <span className="size-1.5 rounded-full bg-current" /> },
  pending: {
    tone: "info",
    icon: <LoaderCircle className="size-3 motion-safe:animate-spin" aria-hidden />,
  },
  done: { tone: "positive", icon: <Check className="size-3" aria-hidden /> },
  error: { tone: "negative", icon: <X className="size-3" aria-hidden /> },
};

export interface StatusChipProps {
  status: StatusKind;
  label: React.ReactNode;
  className?: string;
}

/** Pipeline / job status: spinner while pending, tick on done, cross on error. */
export function StatusChip({ status, label, className }: StatusChipProps) {
  const { tone, icon } = STATUS[status];
  return (
    <Badge tone={tone} pill className={className} role="status">
      {icon}
      {label}
    </Badge>
  );
}
