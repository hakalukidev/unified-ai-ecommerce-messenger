import { formatListTimestamp } from "@/lib/format";
import { getInitials } from "@/lib/inbox";
import type { ConversationView } from "@/types";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserRound } from "lucide-react";

interface Props {
  conversation: ConversationView;
  isActive: boolean;
  onClick: () => void;
  sellerId?: string;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
  sellerId,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={`animate-fade-in-up w-full rounded-[24px] border px-3 py-3 text-left transition hover:-translate-y-0.5 ${
        isActive
          ? "border-[rgba(15,118,110,0.3)] bg-[rgba(15,118,110,0.08)] shadow-sm"
          : "border-transparent bg-white/70 hover:border-[var(--color-line)] hover:bg-white hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(16,35,58,0.08)] text-sm font-semibold text-[var(--color-foreground)]">
            {getInitials(conversation.sender_name)}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white">
            <PlatformBadge platform={conversation.platform} size="xs" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                {conversation.sender_name || "Unknown customer"}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                {conversation.page_name}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-[var(--color-muted)]">
              {formatListTimestamp(conversation.last_message_at)}
            </span>
          </div>

          <p
            className={`mt-3 text-sm leading-6 ${
              conversation.unread_count > 0
                ? "font-medium text-[var(--color-foreground)]"
                : "text-[var(--color-muted)]"
            }`}
          >
            {conversation.last_message_preview || "No messages yet."}
          </p>

          {sellerId ? (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
              <UserRound size={11} />
              Handled by <span className="font-medium">{sellerId}</span>
            </p>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={conversation.status} />
              {conversation.ai_enabled ? (
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-strong)]">
                  AI on
                </span>
              ) : null}
            </div>

            {conversation.unread_count > 0 ? (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--color-accent)] px-2 py-1 text-[11px] font-semibold text-white">
                {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
