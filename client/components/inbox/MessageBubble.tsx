import { formatMessageTime } from "@/lib/format";
import type { MessageRecord } from "@/types";

export function MessageBubble({ message }: { message: MessageRecord }) {
  const isOutbound = message.direction === "outbound";
  const isAI = message.source === "ai_auto";
  const imageAttachment = message.attachments.find(
    (attachment) =>
      attachment.url &&
      (attachment.type === "image" ||
        attachment.mime_type?.startsWith("image/")),
  );

  if (message.source === "system") {
    return (
      <div className="mb-4 flex justify-center">
        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700">
          {message.message_text || "System update"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`animate-fade-in-up mb-4 flex ${isOutbound ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex max-w-[78%] flex-col gap-1 ${isOutbound ? "items-end" : "items-start"}`}>
        {isOutbound ? (
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
              isAI
                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {isAI ? "AI reply" : "Manual reply"}
          </span>
        ) : null}

        <div
          className={`rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm ${
            isOutbound
              ? "rounded-br-md bg-[var(--color-accent)] text-white"
              : "rounded-bl-md border border-[var(--color-line)] bg-white text-[var(--color-foreground)]"
          }`}
        >
          {imageAttachment?.url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageAttachment.url}
                alt={imageAttachment.file_name ?? "Attachment"}
                className="mb-3 max-h-56 w-full rounded-2xl object-cover"
              />
            </>
          ) : null}

          {message.message_text ? <p>{message.message_text}</p> : null}
        </div>

        <span className="px-1 text-[11px] text-[var(--color-muted)]">
          {formatMessageTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
