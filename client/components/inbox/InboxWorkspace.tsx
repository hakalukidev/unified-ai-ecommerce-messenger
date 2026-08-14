"use client";

import { useConversations } from "@/hooks/useConversations";
import { conversationService } from "@/services/conversations";
import { MessageSquareText } from "lucide-react";
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
    filter,
    setFilter,
    refresh,
    applyConversationUpdate,
  } = useConversations(selectedConversationId);

  const activeConversation =
    allConversations.find(
      (conversation) => conversation._id === selectedConversationId,
    ) ?? null;

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
          filter={filter}
          setFilter={setFilter}
          activeConversationId={selectedConversationId}
          onSelect={handleSelectConversation}
          onRetry={() => void refresh()}
        />
      </div>

      <div
        className={`min-h-0 flex-1 ${
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
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div className="max-w-lg">
              <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[28px] bg-[var(--color-surface-soft)] text-[var(--color-muted)]">
                <MessageSquareText size={30} />
              </div>
              <p className="mt-5 text-2xl font-semibold text-[var(--color-foreground)]">
                Choose a conversation
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                Pick a customer thread from the left to open the full message
                history, reply, toggle AI support, and review the summary panel.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
