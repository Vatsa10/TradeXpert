"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type ActionVariant = "brand" | "secondary" | "ghost" | "danger";
export type ActionSize = "sm" | "md";

const VARIANT: Record<ActionVariant, string> = {
  brand: "bg-brand text-brand-ink [@media(hover:hover)]:hover:bg-brand-hover",
  secondary:
    "border border-hairline-strong bg-surface-raised-2 text-ink-secondary [@media(hover:hover)]:hover:text-ink",
  ghost: "text-ink-secondary [@media(hover:hover)]:hover:text-ink",
  danger:
    "border border-negative/30 bg-negative/10 text-negative [@media(hover:hover)]:hover:bg-negative/20",
};

const SIZE: Record<ActionSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-9 gap-2 px-4 text-sm",
};

export interface ActionButtonProps
  extends React.ComponentPropsWithoutRef<"button"> {
  variant?: ActionVariant;
  size?: ActionSize;
  /** Shows a spinner and disables the control. */
  loading?: boolean;
}

/**
 * The one pressable in the signed-in app. Built from design-system tokens
 * (`app-press`, `app-focus`, brand/negative colours) so no page has to invent
 * its own button styling.
 */
export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  function ActionButton(
    { variant = "secondary", size = "md", loading = false, className, children, disabled, type, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        disabled={disabled || loading}
        className={cn(
          "app-press app-focus inline-flex cursor-pointer items-center justify-center rounded-md font-medium whitespace-nowrap",
          "disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
          VARIANT[variant],
          SIZE[size],
          className
        )}
        {...rest}
      >
        {loading && <LoaderCircle className="motion-safe:animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
