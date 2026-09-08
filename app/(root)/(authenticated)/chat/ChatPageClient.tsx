"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";

import { Surface } from "@/components/system";

import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { ChatModeSelector } from "./ChatModeSelector";
import { ChatSessionSidebar } from "./ChatSessionSidebar";
import {
  MODE_COPY,
  type Message,
  type Mode,
  type Notice,
  type Quota,
  type Session,
} from "./chat-types";

export default function ChatPageClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("normal");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsStatus, setSessionsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState<Notice | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };

    // Small timeout so the DOM has updated before we scroll.
    const timeoutId = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
        setSessionsStatus("ready");
      } else {
        setSessionsStatus("error");
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setSessionsStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    const sentInput = input;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setNotice(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: sentInput,
          mode,
          sessionId,
        }),
      });

      if (res.status === 429) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          quota?: Quota;
        };
        const q = body.quota;
        const isPro = mode === "pro" || mode === "thinking";
        const used = q ? (isPro ? q.proCount : q.standardCount) : undefined;
        const limit = q ? (isPro ? q.proLimit : q.standardLimit) : undefined;

        setNotice({
          kind: "quota",
          message:
            used !== undefined && limit !== undefined
              ? `Daily limit reached (${used}/${limit} ${
                  isPro ? "Pro/Think" : "Normal"
                } messages used). Try again tomorrow${
                  isPro ? ", or switch to Normal mode." : "."
                }`
              : body.error || "Daily limit reached. Try again tomorrow.",
        });
        // Roll back the optimistic user bubble so the message isn't shown as sent.
        setMessages((prev) => prev.slice(0, -1));
        setInput(sentInput);
        return;
      }

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        setNotice({
          kind: "network",
          message:
            (data && data.error) ||
            "Something went wrong reaching the AI. Please try sending your message again.",
        });
        setMessages((prev) => prev.slice(0, -1));
        setInput(sentInput);
        return;
      }

      if (data.response) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          mode: data.mode,
          sources: data.sources,
          llmResponse: data.llmResponse,
          signals: data.signals,
          sentiment: data.sentiment,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setSessionId(data.sessionId);
        fetchSessions();
      }
    } catch (error) {
      console.error("Chat error:", error);
      setNotice({
        kind: "network",
        message:
          "Couldn't reach the server. Check your connection and press Retry.",
      });
      setMessages((prev) => prev.slice(0, -1));
      setInput(sentInput);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (nextSessionId: string) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${nextSessionId}`);
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
        setSessionId(nextSessionId);
        setMode(data.mode || "normal");
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const clearChat = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/chat?sessionId=${sessionId}`, { method: "DELETE" });
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    }
    setMessages([]);
    setSessionId(null);
    fetchSessions();
  };

  const deleteSession = async (targetId: string) => {
    try {
      await fetch(`/api/chat?sessionId=${targetId}`, { method: "DELETE" });
      fetchSessions();
      if (sessionId === targetId) {
        setMessages([]);
        setSessionId(null);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const sidebar = (
    <ChatSessionSidebar
      sessions={sessions}
      activeSessionId={sessionId}
      status={sessionsStatus}
      onSelect={loadSession}
      onDelete={deleteSession}
      onClearCurrent={clearChat}
      onRetry={() => {
        setSessionsStatus("loading");
        fetchSessions();
      }}
    />
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-0 gap-6">
      <Surface as="aside" padding="md" className="hidden w-64 shrink-0 md:block">
        {sidebar}
      </Surface>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Surface padding="none" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-brand"
              >
                <Bot className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-ink">TradeXpert AI</h1>
                <p className="truncate text-xs text-ink-secondary">{MODE_COPY[mode].caption}</p>
              </div>
            </div>
            <ChatModeSelector mode={mode} onChange={setMode} disabled={isLoading} />
          </header>

          <details className="border-b border-hairline md:hidden">
            <summary className="app-focus app-press cursor-pointer list-none px-4 py-2 text-xs font-medium text-ink-secondary">
              History ({sessions.length})
            </summary>
            <div className="max-h-64 px-4 pb-4">{sidebar}</div>
          </details>

          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            endRef={messagesEndRef}
          />

          <ChatComposer
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onDismissNotice={() => setNotice(null)}
            mode={mode}
            isLoading={isLoading}
            notice={notice}
            inputRef={inputRef}
          />
        </Surface>
      </div>
    </div>
  );
}
