"use client";

import { useConversations } from "@/hooks/useConversations";
import { conversationService } from "@/services/conversations";
import { AlertTriangle, Mail, MessageSquareText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { ConversationList } from "./ConversationList";
import { ThreadView } from "./ThreadView";

interface Props {
  selectedConversationId?: string;
}

export function InboxWorkspace({ selectedConversationId }: Props) {
  const router = useRouter();
  const {
    allConversations,
    conversations,
    loading,
    error,
    platformFilter,
    setPlatformFilter,
    statusFilter,
    setStatusFilter,
    refresh,
    applyConversationUpdate,
  } = useConversations(selectedConversationId);

  const activeConversation =
    allConversations.find(
      (conversation) => conversation._id === selectedConversationId,
    ) ?? null;

  const unreadCount = allConversations.filter(
    (conversation) => conversation.unread_count > 0,
  ).length;
  const aiHandledCount = allConversations.filter(
    (conversation) => conversation.ai_enabled,
  ).length;
  const escalatedCount = allConversations.filter(
    (conversation) => conversation.status === "escalated",
  ).length;

  const handleSelectConversation = (conversationId: string) => {
    startTransition(() => {
      router.push(`/conversation/${conversationId}`);
    });
  };

  const handleToggleAI = async (conversationId: string, aiEnabled: boolean) => {
    const updated = await conversationService.toggleAI(conversationId, aiEnabled);
    applyConversationUpdate(updated);
  };

  return (
    <section className="glass-panel soft-ring flex h-full min-h-[72vh] overflow-hidden rounded-[32px] border border-[var(--color-line)]">
      <div
        className={`min-h-0 w-full shrink-0 md:w-[360px] ${
          selectedConversationId ? "hidden md:block" : "block"
        }`}
      >
        <ConversationList
          conversations={conversations}
          allConversations={allConversations}
          loading={loading}
          error={error}
          platformFilter={platformFilter}
          setPlatformFilter={setPlatformFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          activeConversationId={selectedConversationId}
          onSelect={handleSelectConversation}
          onRetry={() => void refresh()}
        />
      </div>

      <div
        className={`min-h-0 min-w-0 flex-1 ${
          selectedConversationId ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedConversationId ? (
          loading && !activeConversation ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div className="rounded-[28px] border border-[var(--color-line)] bg-white/70 px-8 py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Loading
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-foreground)]">
                  Opening conversation
                </p>
              </div>
            </div>
          ) : activeConversation ? (
            <ThreadView
              key={activeConversation._id}
              conversation={activeConversation}
              onToggleAI={handleToggleAI}
              onConversationTouched={applyConversationUpdate}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div className="max-w-md rounded-[28px] border border-[var(--color-line)] bg-white/70 px-8 py-6">
                <p className="text-lg font-semibold text-[var(--color-foreground)]">
                  Conversation not found
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  This thread may have been removed or is not available for the
                  current seller session.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/inbox")}
                  className="mt-4 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Back to inbox
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-10">
            <div className="w-full max-w-xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-[0_16px_40px_rgba(15,118,110,0.28)]">
                <MessageSquareText size={26} />
              </div>
              <p className="mt-5 text-2xl font-semibold text-[var(--color-foreground)]">
                Hi, there 👋
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                Pick a conversation on the left, or see what needs attention
                across your inbox.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
                <div className="rounded-[22px] border border-[var(--color-line)] bg-white/70 p-4">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]">
                    <Mail size={16} />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
                    {unreadCount}
                  </p>
                  <p className="text-xs font-medium text-[var(--color-muted)]">
                    Unread conversations
                  </p>
                </div>

                <div className="rounded-[22px] border border-[var(--color-line)] bg-white/70 p-4">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]">
                    <Sparkles size={16} />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
                    {aiHandledCount}
                  </p>
                  <p className="text-xs font-medium text-[var(--color-muted)]">
                    AI auto-reply is on
                  </p>
                </div>

                <div className="rounded-[22px] border border-[var(--color-line)] bg-white/70 p-4">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(234,88,12,0.12)] text-[var(--color-warning)]">
                    <AlertTriangle size={16} />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
                    {escalatedCount}
                  </p>
                  <p className="text-xs font-medium text-[var(--color-muted)]">
                    Escalated, needs you
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
