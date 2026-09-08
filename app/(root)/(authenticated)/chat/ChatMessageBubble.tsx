import * as React from "react";
import { Bot, User } from "lucide-react";

import { Surface } from "@/components/system";
import { cn } from "@/lib/utils";

import { ChatModeIndicator } from "@/components/ChatButton";
import { GroundingPanel, PlainSources } from "./GroundingPanel";
import type { Message } from "./chat-types";

export function ChatAvatar({ role }: { role: Message["role"] }) {
  const isUser = role === "user";
  return (
    <div
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border",
        isUser
          ? "border-hairline-strong bg-surface-raised-2 text-ink-secondary"
          : "border-brand/30 bg-brand/10 text-brand"
      )}
    >
      {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
    </div>
  );
}

export function ChatMessageBubble({
  message,
  index,
}: {
  message: Message;
  index: number;
}) {
  const isUser = message.role === "user";
  const grounding = message.llmResponse;
  const body = grounding?.summary?.trim() ? grounding.summary : message.content;

  return (
    <li
      className={cn("app-enter flex gap-3", isUser ? "justify-end" : "justify-start")}
      style={{ "--i": Math.min(index, 6) } as React.CSSProperties}
    >
      {!isUser && <ChatAvatar role="assistant" />}

      <Surface
        level={isUser ? "raised-2" : "raised"}
        radius="tile"
        padding="sm"
        className={cn(
          "max-w-[85%] min-w-0 sm:max-w-[75%]",
          isUser && "border-brand/25 bg-brand/10"
        )}
      >
        {message.mode && (
          <div className="mb-2">
            <ChatModeIndicator mode={message.mode} />
          </div>
        )}

        <div className="text-sm leading-relaxed whitespace-pre-wrap text-ink">
          {body}
        </div>

        {grounding ? (
          <>
            <GroundingPanel response={grounding} />
            {message.content.trim() !== body.trim() && (
              <details className="mt-2 group">
                <summary className="app-focus app-press w-fit cursor-pointer list-none text-xs text-ink-faint [@media(hover:hover)]:hover:text-ink-secondary">
                  Full response
                </summary>
                <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-ink-secondary">
                  {message.content}
                </div>
              </details>
            )}
          </>
        ) : (
          message.sources && <PlainSources sources={message.sources} />
        )}
      </Surface>

      {isUser && <ChatAvatar role="user" />}
    </li>
  );
}
