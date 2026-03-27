
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Brain, Zap, Loader2, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatModeIndicator } from "@/components/ChatButton";

type Mode = "normal" | "thinking" | "pro";

interface Message {
  role: "user" | "assistant";
  content: string;
  mode?: Mode;
  sources?: string[];
}

interface Session {
  sessionId: string;
  title: string;
  mode: Mode;
  preview?: string;
  createdAt: string;
}

export default function ChatPageClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("normal");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          mode,
          sessionId,
        }),
      });

      const data = await res.json();

      if (data.response) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          mode: data.mode,
          sources: data.sources,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setSessionId(data.sessionId);
        fetchSessions();
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(
          data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            mode: m.mode,
            sources: m.sources,
          }))
        );
        setSessionId(sessionId);
        setMode(data.mode || "normal");
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  const getModeIcon = (m: Mode) => {
    switch (m) {
      case "pro":
        return Sparkles;
      case "thinking":
        return Brain;
      default:
        return Zap;
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="w-64 shrink-0 hidden md:block">
        <Card className="h-full p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">History</h3>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={clearChat}
              className="text-zinc-400 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-2rem)]">
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-zinc-500 text-sm">No conversations yet</p>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.sessionId}
                    onClick={() => loadSession(s.sessionId)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      sessionId === s.sessionId
                        ? "bg-zinc-800 text-white"
                        : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="text-sm truncate">{s.title}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col bg-zinc-900 border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-white">TradeXpert AI</h2>
                <p className="text-xs text-zinc-400">
                  {mode === "pro"
                    ? "Deep Analysis Mode"
                    : mode === "thinking"
                    ? "Market Reasoning Mode"
                    : "Quick Answers"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ModeButton
                mode="normal"
                currentMode={mode}
                onClick={() => setMode("normal")}
                icon={Zap}
                label="Normal"
              />
              <ModeButton
                mode="thinking"
                currentMode={mode}
                onClick={() => setMode("thinking")}
                icon={Brain}
                label="Think"
              />
              <ModeButton
                mode="pro"
                currentMode={mode}
                onClick={() => setMode("pro")}
                icon={Sparkles}
                label="Pro"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Welcome to TradeXpert AI
                  </h3>
                  <p className="text-zinc-400 max-w-md mx-auto">
                    Ask me about stocks, markets, or investment ideas. Use{" "}
                    <span className="text-blue-400">Think</span> for market
                    analysis or{" "}
                    <span className="text-purple-400">Pro</span> for deep
                    research.
                  </p>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-zinc-800 text-white"
                    }`}
                  >
                    {message.mode && (
                      <div className="mb-2">
                        <ChatModeIndicator mode={message.mode} />
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-zinc-700 text-xs text-zinc-400">
                        Sources: {message.sources.join(", ")}
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-zinc-800">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "pro"
                    ? "Ask for deep analysis..."
                    : mode === "thinking"
                    ? "Ask about a stock..."
                    : "Ask anything..."
                }
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ModeButton({
  mode,
  currentMode,
  onClick,
  icon: Icon,
  label,
}: {
  mode: Mode;
  currentMode: Mode;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  const isActive = currentMode === mode;
  const colors = {
    normal: "bg-green-500/20 text-green-400 border-green-500/50",
    thinking: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    pro: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`gap-1.5 ${
        isActive
          ? colors[mode]
          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs">{label}</span>
    </Button>
  );
}
