import * as React from "react";
import { Bot } from "lucide-react";

import { EmptyState, Surface } from "@/components/system";

import { ChatAvatar, ChatMessageBubble } from "./ChatMessageBubble";
import type { Message } from "./chat-types";

function ThinkingBubble() {
  return (
    <li className="app-enter flex gap-3" aria-live="polite">
      <ChatAvatar role="assistant" />
      <Surface level="raised" radius="tile" padding="sm">
        <span className="sr-only">TradeXpert AI is thinking</span>
        <span className="flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-ink-faint motion-safe:animate-pulse"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </span>
      </Surface>
    </li>
  );
}

export function ChatMessageList({
  messages,
  isLoading,
  endRef,
}: {
  messages: Message[];
  isLoading: boolean;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto scroll-smooth p-4">
      {messages.length === 0 && !isLoading ? (
        <EmptyState
          className="my-8"
          icon={<Bot />}
          title="Welcome to TradeXpert AI"
          description="Ask about NSE/BSE stocks, market moves or an investment thesis. Use Think for reasoned market analysis, or Pro for deep research."
        />
      ) : (
        <ul className="space-y-4">
          {messages.map((message, index) => (
            <ChatMessageBubble key={index} message={message} index={index} />
          ))}
          {isLoading && <ThinkingBubble />}
        </ul>
      )}
      <div ref={endRef} className="h-4" />
    </div>
  );
}
