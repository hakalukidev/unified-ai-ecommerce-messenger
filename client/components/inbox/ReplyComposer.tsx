"use client";

import type { Platform } from "@/types";
import { Loader2, Mic, Paperclip, Send } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

interface Props {
  suggestions: string[];
  sending: boolean;
  platform: Platform;
  onSend: (text: string) => Promise<void>;
}

const MAX_TEXTAREA_HEIGHT = 144;

export function ReplyComposer({
  suggestions,
  sending,
  platform,
  onSend,
}: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const maxLength = platform === "whatsapp" ? 4096 : undefined;
  const nearLimit = maxLength ? text.length >= maxLength * 0.9 : false;

  useLayoutEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [text]);

  const handleSend = async () => {
    if (!text.trim() || sending) {
      return;
    }

    await onSend(text);
    setText("");
  };

  return (
    <div className="border-t border-[var(--color-line)] bg-[rgba(255,255,255,0.74)] p-3">
      {suggestions.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setText(suggestion)}
              className="rounded-full border border-[rgba(15,118,110,0.18)] bg-[var(--color-accent-soft)] px-3 py-1.5 text-left text-xs font-medium text-[var(--color-accent-strong)] transition hover:border-[rgba(15,118,110,0.26)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2 rounded-[26px] border border-[var(--color-line)] bg-white px-2.5 py-2 shadow-[0_16px_40px_rgba(16,35,58,0.08)] transition focus-within:border-[var(--color-accent)] focus-within:ring-4 focus-within:ring-[rgba(15,118,110,0.12)]">
        <textarea
          ref={textareaRef}
          value={text}
          maxLength={maxLength}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          rows={1}
          placeholder="Write your reply..."
          aria-label="Reply message"
          className="min-h-9 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-sm leading-6 text-[var(--color-foreground)] outline-none"
        />

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled
            aria-label="Attach a file (not available yet)"
            title="Attachment sending is not available in the current backend yet."
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)] opacity-60"
          >
            <Paperclip size={16} />
          </button>

          <button
            type="button"
            disabled
            aria-label="Record a voice reply (not available yet)"
            title="Recording and sending a voice reply from the dashboard is not available yet."
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)] opacity-60"
          >
            <Mic size={16} />
          </button>

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!text.trim() || sending}
            aria-label="Send reply"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-muted)]">
        <span>
          <kbd className="rounded border border-[var(--color-line)] bg-white px-1.5 py-0.5 font-sans text-[10px]">
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd className="rounded border border-[var(--color-line)] bg-white px-1.5 py-0.5 font-sans text-[10px]">
            Shift+Enter
          </kbd>{" "}
          for a new line
        </span>
        {maxLength ? (
          <span className={nearLimit ? "font-semibold text-orange-600" : undefined}>
            {text.length}/{maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
}
