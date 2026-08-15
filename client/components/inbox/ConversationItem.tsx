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
      className={`animate-fade-in-up w-full min-w-0 max-w-full overflow-hidden rounded-[20px] border px-2.5 py-2.5 text-left transition hover:-translate-y-0.5 ${
        isActive
          ? "border-[rgba(15,118,110,0.3)] bg-[rgba(15,118,110,0.08)] shadow-sm"
          : "border-transparent bg-white/70 hover:border-[var(--color-line)] hover:bg-white hover:shadow-md"
      }`}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(16,35,58,0.08)] text-xs font-semibold text-[var(--color-foreground)]">
            {getInitials(conversation.sender_name)}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white">
            <PlatformBadge platform={conversation.platform} size="xs" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[var(--color-foreground)]">
                {conversation.sender_name || "Unknown customer"}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--color-muted)]">
                {conversation.page_name}
              </p>
            </div>
            <span className="shrink-0 text-[10px] text-[var(--color-muted)]">
              {formatListTimestamp(conversation.last_message_at)}
            </span>
          </div>

          <p
            className={`mt-2 truncate text-xs leading-5 ${
              conversation.unread_count > 0
                ? "font-medium text-[var(--color-foreground)]"
                : "text-[var(--color-muted)]"
            }`}
          >
            {conversation.last_message_preview || "No messages yet."}
          </p>

          {sellerId ? (
            <p className="mt-1.5 flex min-w-0 items-center gap-1 text-[10px] text-[var(--color-muted)]">
              <UserRound size={10} className="shrink-0" />
              <span className="truncate">
                Handled by <span className="font-medium">{sellerId}</span>
              </span>
            </p>
          ) : null}

          <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <StatusBadge status={conversation.status} />
              {conversation.ai_enabled ? (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent-strong)]">
                  AI on
                </span>
              ) : null}
            </div>

            {conversation.unread_count > 0 ? (
              <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
