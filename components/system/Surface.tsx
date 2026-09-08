import * as React from "react";

import { cn } from "@/lib/utils";

export type SurfaceLevel = "sunken" | "raised" | "raised-2" | "overlay";
export type SurfacePadding = "none" | "sm" | "md" | "lg";

const LEVEL: Record<SurfaceLevel, string> = {
  sunken: "bg-surface-sunken",
  raised: "bg-surface-raised",
  "raised-2": "bg-surface-raised-2",
  overlay: "bg-surface-overlay app-shadow-2",
};

const PADDING: Record<SurfacePadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export interface SurfaceProps extends React.ComponentPropsWithoutRef<"div"> {
  /** Elevation step. Panels sit on `raised`, tiles inside them on `raised-2`. */
  level?: SurfaceLevel;
  padding?: SurfacePadding;
  /** Hairline border. Set false for a flush, borderless block. */
  bordered?: boolean;
  radius?: "tile" | "panel" | "none";
  /** Lift + border highlight on hover (hover-capable pointers only). */
  interactive?: boolean;
  as?: "div" | "section" | "article" | "aside" | "li";
}

/**
 * The one box in the app. Every card, panel and tile is this component with
 * different props — there is deliberately no second implementation.
 */
export function Surface({
  level = "raised",
  padding = "md",
  bordered = true,
  radius = "panel",
  interactive = false,
  as = "div",
  className,
  ...rest
}: SurfaceProps) {
  // Polymorphic tag. Props are typed against a div; the intrinsic elements we
  // allow accept the same attribute surface, so the cast is safe here.
  const Tag = as as React.ElementType;

  return (
    <Tag
      className={cn(
        LEVEL[level],
        PADDING[padding],
        radius === "panel" && "rounded-xl",
        radius === "tile" && "rounded-lg",
        bordered && "border border-hairline",
        interactive &&
          "app-press cursor-pointer [@media(hover:hover)]:hover:border-hairline-strong",
        className
      )}
      {...rest}
    />
  );
}

export interface PanelProps extends Omit<SurfaceProps, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned controls in the panel header. */
  action?: React.ReactNode;
  /** Renders the header without the body gap — use for tight tables. */
  flush?: boolean;
  children?: React.ReactNode;
}

/**
 * Surface plus a titled header. Signature is a superset of the legacy
 * `components/tools/shared` Panel, so existing call sites are unchanged.
 */
export function Panel({
  title,
  description,
  action,
  flush = false,
  children,
  className,
  as = "section",
  ...rest
}: PanelProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <Surface as={as} className={className} {...rest}>
      {hasHeader && (
        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
            flush ? "mb-3" : "mb-5"
          )}
        >
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-ink-secondary">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Surface>
  );
}

/** Alias kept so "Card" reads naturally at grid call sites. Same component. */
export const Card = Surface;
