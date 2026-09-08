import * as React from "react";
import { AlertTriangle, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/** Loading placeholder. Opacity-only pulse; still under reduced motion. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("app-skeleton rounded-md bg-white/[0.06]", className)}
    />
  );
}

export interface EmptyStateProps {
  /** Legacy shorthand: pass the message as children. */
  children?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Primary call to action. */
  action?: React.ReactNode;
  className?: string;
}

/** "Nothing here yet" — dashed hairline well, quiet by design. */
export function EmptyState({
  children,
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-hairline-strong px-4 py-10 text-center",
        className
      )}
    >
      {icon && <div className="text-ink-faint [&_svg]:size-6">{icon}</div>}
      {title && <p className="text-sm font-medium text-ink">{title}</p>}
      {description && (
        <p className="max-w-md text-sm text-ink-secondary">{description}</p>
      )}
      {children && <div className="text-sm text-ink-secondary">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  message: string;
  /** Shown as a retry affordance when provided. */
  onRetry?: () => void;
  title?: React.ReactNode;
  className?: string;
}

/** Recoverable failure. Inline, never a full-page takeover. */
export function ErrorState({ message, onRetry, title, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative",
        className
      )}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        <span>{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="app-press app-focus ml-3 cursor-pointer font-medium underline underline-offset-2 [@media(hover:hover)]:hover:text-ink"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export type NoticeTone = "info" | "warn" | "error";

const NOTICE: Record<NoticeTone, { cls: string; icon: React.ReactNode }> = {
  info: {
    cls: "border-info/30 bg-info/10 text-info",
    icon: <Info className="mt-0.5 size-4 shrink-0" aria-hidden />,
  },
  warn: {
    cls: "border-warning/30 bg-warning/10 text-warning",
    icon: <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />,
  },
  error: {
    cls: "border-negative/30 bg-negative/10 text-negative",
    icon: <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />,
  },
};

export interface InlineNoticeProps {
  tone?: NoticeTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Right-aligned control, e.g. a dismiss or "reconnect" button. */
  action?: React.ReactNode;
  className?: string;
}

/** Contextual banner: degraded pricing, stale data, missing broker link. */
export function InlineNotice({
  tone = "info",
  title,
  children,
  action,
  className,
}: InlineNoticeProps) {
  const { cls, icon } = NOTICE[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm",
        cls,
        className
      )}
    >
      {icon}
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
