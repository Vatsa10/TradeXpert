import * as React from "react";
import { MessageSquare, Trash2 } from "lucide-react";

import { EmptyState, ErrorState, Skeleton } from "@/components/system";
import { cn } from "@/lib/utils";

import type { Session } from "./chat-types";

export function ChatSessionSidebar({
  sessions,
  activeSessionId,
  status,
  onSelect,
  onDelete,
  onClearCurrent,
  onRetry,
}: {
  sessions: Session[];
  activeSessionId: string | null;
  status: "loading" | "ready" | "error";
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onClearCurrent: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="app-label">History</h2>
        <button
          type="button"
          onClick={onClearCurrent}
          aria-label="Delete the current conversation"
          title="Delete the current conversation"
          className="app-press app-focus cursor-pointer rounded-md p-1.5 text-ink-faint [@media(hover:hover)]:hover:text-negative"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {status === "loading" ? (
          <div className="space-y-2" aria-busy>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : status === "error" ? (
          <ErrorState message="Couldn't load your conversations." onRetry={onRetry} />
        ) : sessions.length === 0 ? (
          <EmptyState description="No conversations yet." className="py-6" />
        ) : (
          <ul className="space-y-1">
            {sessions.map((s, i) => {
              const active = activeSessionId === s.sessionId;
              return (
                <li
                  key={s.sessionId}
                  className="app-enter group flex items-center gap-1"
                  style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(s.sessionId)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "app-press app-focus flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md p-2 text-left",
                      active
                        ? "bg-brand/10 text-brand"
                        : "text-ink-secondary [@media(hover:hover)]:hover:bg-white/[0.04] [@media(hover:hover)]:hover:text-ink"
                    )}
                  >
                    <MessageSquare className="size-4 shrink-0" aria-hidden />
                    <span className="truncate text-sm">{s.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(s.sessionId);
                    }}
                    aria-label={`Delete conversation ${s.title}`}
                    className="app-press app-focus cursor-pointer rounded-md p-1.5 text-ink-faint opacity-100 motion-safe:transition-opacity motion-safe:duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:hover:text-negative"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
