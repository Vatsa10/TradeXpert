"use client";

import Link from "next/link";
import { Brain, MessageCircle, Sparkles, Zap } from "lucide-react";

import { Badge } from "@/components/system";

/** Floating entry point to /chat. One accent: amber. */
export function ChatButton() {
  return (
    <div className="fixed right-6 bottom-6 z-50">
      <Link
        href="/chat"
        aria-label="Open TradeXpert AI chat"
        className="app-press app-focus app-shadow-2 flex size-14 items-center justify-center rounded-full bg-brand text-brand-ink motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out-strong [@media(hover:hover)]:hover:bg-brand-hover"
      >
        <MessageCircle className="size-6" aria-hidden />
      </Link>
    </div>
  );
}

const MODE_CONFIG = {
  pro: { icon: Sparkles, label: "Pro" },
  thinking: { icon: Brain, label: "Thinking" },
  normal: { icon: Zap, label: "Normal" },
} as const;

/** Which mode produced a message. Neutral chip — mode is not a judgement. */
export function ChatModeIndicator({ mode }: { mode: string }) {
  const config =
    mode === "pro" || mode === "thinking"
      ? MODE_CONFIG[mode]
      : MODE_CONFIG.normal;
  const Icon = config.icon;

  return (
    <Badge tone="neutral" pill>
      <Icon className="size-3" aria-hidden />
      <span>{config.label}</span>
    </Badge>
  );
}

export default ChatButton;
