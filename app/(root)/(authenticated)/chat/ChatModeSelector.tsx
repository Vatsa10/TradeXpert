import * as React from "react";
import { Brain, Sparkles, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import { MODE_COPY, type Mode } from "./chat-types";

const MODE_ICON: Record<Mode, React.ElementType> = {
  normal: Zap,
  thinking: Brain,
  pro: Sparkles,
};

const MODES: Mode[] = ["normal", "thinking", "pro"];

/**
 * Segmented mode control. One accent (amber) marks the active mode —
 * the old per-mode green/blue/purple palette is retired.
 */
export function ChatModeSelector({
  mode,
  onChange,
  disabled,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Response mode"
      className="flex items-center gap-1 rounded-lg border border-hairline bg-surface-sunken p-1"
    >
      {MODES.map((m) => {
        const Icon = MODE_ICON[m];
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(m)}
            title={MODE_COPY[m].caption}
            className={cn(
              "app-press app-focus flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "bg-brand/15 text-brand"
                : "text-ink-secondary [@media(hover:hover)]:hover:text-ink"
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span>{MODE_COPY[m].label}</span>
          </button>
        );
      })}
    </div>
  );
}
