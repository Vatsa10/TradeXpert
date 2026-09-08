import * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned controls. */
  action?: React.ReactNode;
  /** h2 by default; drop to h3 for nested sections. */
  as?: "h2" | "h3";
  className?: string;
}

/** Titled divider between blocks inside a page. */
export function SectionHeader({
  title,
  description,
  action,
  as: Tag = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <Tag
          className={cn(
            "font-semibold tracking-tight text-ink",
            Tag === "h2" ? "text-base" : "text-sm"
          )}
        >
          {title}
        </Tag>
        {description && (
          <p className="mt-1 text-sm text-ink-secondary">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export interface PageShellProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Header-right controls (refresh, connect, mode switch). */
  actions?: React.ReactNode;
  /** Breadcrumb / back link rendered above the title. */
  eyebrow?: React.ReactNode;
  /** Full-bleed row directly under the header, e.g. an InlineNotice. */
  notice?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Widest content measure. "wide" for chart-heavy pages. */
  width?: "default" | "wide" | "narrow";
}

const WIDTH = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-screen-2xl",
} as const;

/**
 * Page frame: title block, optional actions, then a vertically rhythmic
 * content column. Every authenticated page starts with this.
 */
export function PageShell({
  title,
  description,
  actions,
  eyebrow,
  notice,
  children,
  className,
  width = "default",
}: PageShellProps) {
  return (
    <div className={cn("mx-auto w-full space-y-6", WIDTH[width], className)}>
      <header className="app-enter flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="app-label mb-1.5">{eyebrow}</div>}
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-ink-secondary">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </header>
      {notice}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
