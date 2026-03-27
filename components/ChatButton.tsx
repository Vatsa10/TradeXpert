
"use client";

import Link from "next/link";
import { MessageCircle, Zap, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <Link href="/chat">
        <Button
          size="icon-lg"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}

export function ChatModeIndicator({ mode }: { mode: string }) {
  const getModeConfig = () => {
    switch (mode) {
      case "pro":
        return {
          icon: Sparkles,
          label: "Pro",
          color: "bg-purple-500",
        };
      case "thinking":
        return {
          icon: Brain,
          label: "Thinking",
          color: "bg-blue-500",
        };
      default:
        return {
          icon: Zap,
          label: "Normal",
          color: "bg-green-500",
        };
    }
  };

  const config = getModeConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} text-white`}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}

export default ChatButton;
