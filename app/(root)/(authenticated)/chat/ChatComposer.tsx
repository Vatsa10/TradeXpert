import * as React from "react";
import { Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InlineNotice, TextInput } from "@/components/system";

import { MODE_COPY, type Mode, type Notice } from "./chat-types";

export function ChatComposer({
  input,
  onInputChange,
  onSubmit,
  onDismissNotice,
  mode,
  isLoading,
  notice,
  inputRef,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent | React.MouseEvent) => void;
  onDismissNotice: () => void;
  mode: Mode;
  isLoading: boolean;
  notice: Notice | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const canSend = !isLoading && input.trim().length > 0;

  return (
    <div className="border-t border-hairline p-4">
      {notice && (
        <InlineNotice
          tone={notice.kind === "quota" ? "warn" : "error"}
          className="mb-3"
          action={
            <div className="flex items-center gap-2">
              {notice.kind === "network" && (
                <button
                  type="button"
                  onClick={(e) => onSubmit(e)}
                  disabled={!canSend}
                  className="app-press app-focus cursor-pointer rounded-md underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={onDismissNotice}
                aria-label="Dismiss notice"
                className="app-press app-focus cursor-pointer rounded-md text-ink-faint [@media(hover:hover)]:hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          }
        >
          {notice.message}
        </InlineNotice>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <label htmlFor="chat-composer-input" className="sr-only">
          Message TradeXpert AI
        </label>
        <TextInput
          id="chat-composer-input"
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={MODE_COPY[mode].placeholder}
          disabled={isLoading}
          autoComplete="off"
          className="flex-1"
        />
        <Button type="submit" disabled={!canSend} className="app-press shrink-0">
          <Send className="size-4" aria-hidden />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
