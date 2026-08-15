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
  const audioAttachment = message.attachments.find(
    (attachment) =>
      attachment.url &&
      (attachment.type === "audio" || attachment.mime_type?.startsWith("audio/")),
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
      <div
        className={`flex flex-col gap-0.5 ${audioAttachment?.url ? "max-w-[88%]" : "max-w-[78%]"} ${isOutbound ? "items-end" : "items-start"}`}
      >
        {isOutbound ? (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
              isAI
                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {isAI ? "AI reply" : "Manual reply"}
          </span>
        ) : null}

        <div
          className={`rounded-[14px] px-2.5 py-1.5 text-xs leading-5 shadow-sm ${
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
                className="mb-1.5 max-h-28 w-full rounded-xl object-cover"
              />
            </>
          ) : null}

          {audioAttachment?.url ? (
            <audio
              controls
              preload="metadata"
              src={audioAttachment.url}
              className="mb-0.5 h-8 w-64 max-w-full"
            />
          ) : null}

          {message.message_text ? (
            <p className="break-words">{message.message_text}</p>
          ) : null}
        </div>

        <span className="px-1 text-[10px] text-[var(--color-muted)]">
          {formatMessageTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
