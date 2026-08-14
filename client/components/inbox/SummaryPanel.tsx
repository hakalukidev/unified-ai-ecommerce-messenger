"use client";

import { buildConversationSummary } from "@/lib/inbox";
import type { ConversationView, MessageRecord } from "@/types";
import { Check, Copy, X } from "lucide-react";
import { useState } from "react";

interface Props {
  conversation: ConversationView;
  messages: MessageRecord[];
  onClose: () => void;
}

export function SummaryPanel({ conversation, messages, onClose }: Props) {
  const summary = buildConversationSummary(conversation, messages);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const summaryText = [
      `Intent: ${summary.intent}`,
      `Questions: ${summary.questions}`,
      `Products: ${summary.products}`,
      `Status: ${summary.status}`,
    ].join("\n");

    await navigator.clipboard.writeText(summaryText);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  return (
    <div className="flex h-full flex-col border-l border-[var(--color-line)] bg-[rgba(255,253,248,0.96)]">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Quick summary
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
            Thread snapshot
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-white text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {[
          ["Customer intent", summary.intent],
          ["Key questions", summary.questions],
          ["Products discussed", summary.products],
          ["Current status", summary.status],
        ].map(([label, value]) => (
          <section key={label}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
              {label}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-foreground)]">
              {value}
            </p>
          </section>
        ))}
      </div>

      <div className="border-t border-[var(--color-line)] p-4">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent-strong)]"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied summary" : "Copy summary"}
        </button>
      </div>
    </div>
  );
}
