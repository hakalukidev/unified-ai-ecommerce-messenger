"use client";

import { AIToggle } from "@/components/ui/AIToggle";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useMessages } from "@/hooks/useMessages";
import { getInitials } from "@/lib/inbox";
import { conversationService } from "@/services/conversations";
import type {
  ConversationRecord,
  ConversationStatus,
  ConversationView,
} from "@/types";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bot,
  BookOpenText,
  Check,
  ChevronDown,
  MessageSquareDashed,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { ReplyComposer } from "./ReplyComposer";
import { SummaryPanel } from "./SummaryPanel";

interface Props {
  conversation: ConversationView;
  backHref?: string;
  onToggleAI: (conversationId: string, aiEnabled: boolean) => Promise<void>;
  onConversationTouched: (
    update: Partial<ConversationRecord> & { _id: string },
  ) => void;
}

export function ThreadView({
  conversation,
  backHref = "/inbox",
  onToggleAI,
  onConversationTouched,
}: Props) {
  const { messages, loading, sending, error, suggestions, sendReply, sendAudioReply } =
    useMessages(conversation._id, conversation.platform);
  // Persistent 3rd column on desktop, but never auto-opened on mobile — there
  // it's a full-screen overlay, which was covering the thread the moment any
  // conversation opened and made everything look overlapped/broken.
  const [showSummary, setShowSummary] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches,
  );
  const [togglingAI, setTogglingAI] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Only auto-scroll when the last message actually changes (a new message
  // arrived or was sent) — not on every background poll, which re-creates
  // the messages array even when nothing new came in and was yanking the
  // scroll position back to the bottom while someone was reading up.
  const lastMessageId = messages.at(-1)?._id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId]);

  useEffect(() => {
    if (!showSummary) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSummary(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSummary]);

  const handleSend = async (text: string) => {
    const message = await sendReply(text);

    if (!message) {
      return;
    }

    onConversationTouched({
      _id: conversation._id,
      last_message_at: message.timestamp,
      last_message_preview: message.message_text,
      unread_count: 0,
    });
  };

  const handleSendAudio = async (blob: Blob) => {
    const message = await sendAudioReply(blob);

    if (!message) {
      return;
    }

    onConversationTouched({
      _id: conversation._id,
      last_message_at: message.timestamp,
      last_message_preview: "Voice message",
      unread_count: 0,
    });
  };

  const handleToggleAI = async () => {
    setTogglingAI(true);

    try {
      await onToggleAI(conversation._id, !conversation.ai_enabled);
    } finally {
      setTogglingAI(false);
    }
  };

  const handleUpdateStatus = async (status: ConversationStatus) => {
    setStatusMenuOpen(false);
    if (status === conversation.status) return;

    setUpdatingStatus(true);
    try {
      const updated = await conversationService.updateStatus(
        conversation._id,
        status,
      );
      onConversationTouched(updated);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-b border-[var(--color-line)] bg-[rgba(255,255,255,0.78)] px-3 py-2.5 md:px-4 md:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
            <div className="flex min-w-0 items-center gap-2 md:gap-3">
              <Link
                href={backHref}
                aria-label="Back to inbox"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-white text-[var(--color-muted)] md:hidden"
              >
                <ArrowLeft size={16} />
              </Link>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(16,35,58,0.08)] text-xs font-semibold text-[var(--color-foreground)] md:h-11 md:w-11 md:text-sm">
                {getInitials(conversation.sender_name)}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                  <p className="truncate text-sm font-semibold text-[var(--color-foreground)] md:text-lg">
                    {conversation.sender_name || "Unknown customer"}
                  </p>
                  <StatusBadge status={conversation.status} />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--color-muted)] md:mt-1 md:gap-2 md:text-xs">
                  <PlatformBadge platform={conversation.platform} />
                  <span className="truncate">{conversation.page_name}</span>
                  {conversation.page_username ? (
                    <span className="hidden sm:inline">
                      @{conversation.page_username}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-2 py-1.5 md:gap-2 md:px-3 md:py-2">
                <Bot
                  size={13}
                  className={
                    conversation.ai_enabled
                      ? "text-[var(--color-accent-strong)]"
                      : "text-[var(--color-muted)]"
                  }
                />
                <span className="hidden text-xs font-semibold text-[var(--color-muted)] sm:inline">
                  AI
                </span>
                <AIToggle
                  enabled={conversation.ai_enabled}
                  onToggle={() => void handleToggleAI()}
                  size="sm"
                  disabled={togglingAI}
                  label={
                    conversation.ai_enabled
                      ? "Disable AI auto-reply for this conversation"
                      : "Enable AI auto-reply for this conversation"
                  }
                />
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStatusMenuOpen((current) => !current)}
                  disabled={updatingStatus}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 md:gap-1.5 md:px-3.5 md:py-2 md:text-xs ${
                    conversation.status === "resolved"
                      ? "bg-[var(--color-success)]"
                      : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)]"
                  }`}
                >
                  {conversation.status === "resolved" ? (
                    <Check size={13} />
                  ) : (
                    <RotateCcw size={13} />
                  )}
                  <span className="hidden sm:inline">
                    {conversation.status === "resolved" ? "Resolved" : "Resolve"}
                  </span>
                  <ChevronDown size={13} />
                </button>

                {statusMenuOpen ? (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setStatusMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white py-1 shadow-[0_20px_50px_rgba(16,35,58,0.16)]">
                      {(["active", "escalated", "resolved"] as ConversationStatus[]).map(
                        (status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => void handleUpdateStatus(status)}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm capitalize transition hover:bg-[var(--color-surface-soft)] ${
                              conversation.status === status
                                ? "font-semibold text-[var(--color-foreground)]"
                                : "text-[var(--color-muted)]"
                            }`}
                          >
                            {status}
                            {conversation.status === status ? (
                              <Check size={14} />
                            ) : null}
                          </button>
                        ),
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setShowSummary((current) => !current)}
                aria-label="Toggle details panel"
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition md:gap-2 md:px-3 md:py-2 md:text-xs ${
                  showSummary
                    ? "border-[rgba(15,118,110,0.2)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
                    : "border-[var(--color-line)] bg-white text-[var(--color-muted)]"
                }`}
              >
                <BookOpenText size={13} />
                <span className="hidden sm:inline">Summary</span>
              </button>
            </div>
          </div>
        </div>

        {conversation.status === "escalated" ? (
          <div className="flex items-start gap-2 border-b border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              This thread is escalated, so the customer is waiting for a
              manual response from your team.
            </span>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`h-20 animate-pulse rounded-[24px] ${
                      index % 2 === 0
                        ? "w-56 bg-white"
                        : "w-44 bg-[var(--color-surface-soft)]"
                    }`}
                  />
                </div>
              ))}
            </div>
          ) : messages.length > 0 ? (
            <>
              {messages.map((message) => (
                <MessageBubble key={message._id} message={message} />
              ))}
              <div ref={bottomRef} />
            </>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--color-surface-soft)] text-[var(--color-muted)]">
                <MessageSquareDashed size={28} />
              </div>
              <p className="mt-4 text-lg font-semibold text-[var(--color-foreground)]">
                No messages in this thread yet
              </p>
              <p className="mt-2 max-w-md text-sm leading-7 text-[var(--color-muted)]">
                Once a customer sends a message or you reply here, the thread
                history will appear in this workspace.
              </p>
            </div>
          )}
        </div>

        <ReplyComposer
          suggestions={suggestions}
          sending={sending}
          platform={conversation.platform}
          onSend={handleSend}
          onSendAudio={handleSendAudio}
        />
      </div>

      {showSummary ? (
        <div
          className="absolute inset-0 z-10 flex bg-[rgba(16,35,58,0.16)] md:static md:bg-transparent"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowSummary(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Conversation summary"
            className="ml-auto h-full w-full max-w-sm shadow-[-24px_0_50px_rgba(16,35,58,0.12)] md:shadow-none"
          >
            <SummaryPanel
              conversation={conversation}
              messages={messages}
              onClose={() => setShowSummary(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
