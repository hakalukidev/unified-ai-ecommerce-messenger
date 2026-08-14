import type { Platform } from "../models/Account";
import type { MessageType } from "../models/Message";

export interface NormalizedMessage {
  platform: Platform;
  page_id: string;
  sender_id: string;
  sender_name: string;
  message_id: string;
  message_type: MessageType;
  message_text: string;
  attachments: unknown[];
  timestamp: Date;
}

const mapWhatsAppMessageType = (value?: string): MessageType => {
  switch (value) {
    case "image":
      return "image";
    case "audio":
      return "audio";
    case "video":
      return "video";
    case "document":
      return "file";
    case "button":
    case "interactive":
      return "button";
    default:
      return "text";
  }
};

const getWhatsappAttachments = (
  raw: Record<string, any>,
): unknown[] => {
  const mediaKeys = ["image", "audio", "video", "document"];

  return mediaKeys
    .filter((key) => raw[key])
    .map((key) => ({
      type: key,
      ...raw[key],
    }));
};

const mapFacebookMessageType = (raw: Record<string, any>): MessageType => {
  if (raw.postback) {
    return "postback";
  }

  const attachmentType = raw.message?.attachments?.[0]?.type;

  switch (attachmentType) {
    case "image":
    case "audio":
    case "video":
      return attachmentType;
    case "file":
      return "file";
    default:
      return "text";
  }
};

const getFacebookMessageText = (raw: Record<string, any>) => {
  if (raw.message?.text) {
    return raw.message.text;
  }

  if (raw.postback?.title) {
    return raw.postback.title;
  }

  if (raw.postback?.payload) {
    return raw.postback.payload;
  }

  const attachmentType = raw.message?.attachments?.[0]?.type;
  return attachmentType ? `[${attachmentType}]` : "";
};

const getFacebookMessageId = (raw: Record<string, any>) => {
  if (raw.message?.mid) {
    return raw.message.mid;
  }

  if (raw.message?.id) {
    return raw.message.id;
  }

  if (raw.postback) {
    return [
      "postback",
      raw.sender?.id,
      raw.timestamp ?? Date.now(),
      raw.postback.mid ?? raw.postback.payload ?? raw.postback.title,
    ]
      .filter(Boolean)
      .join("-");
  }

  return undefined;
};

export function normalizeMessage(
  platform: Platform,
  raw: Record<string, any>,
  pageId: string,
): NormalizedMessage | null {
  if (platform === "facebook") {
    const messageId = getFacebookMessageId(raw);

    if ((!raw.message && !raw.postback) || !raw.sender?.id || !messageId) {
      return null;
    }

    return {
      platform,
      page_id: pageId,
      sender_id: raw.sender.id,
      sender_name: raw.sender.name ?? "Unknown",
      message_id: messageId,
      message_type: mapFacebookMessageType(raw),
      message_text: getFacebookMessageText(raw),
      attachments: raw.message?.attachments ?? [],
      timestamp: new Date(raw.timestamp ?? Date.now()),
    };
  }

  if (platform === "instagram") {
    const message = raw.message ?? raw.messages?.[0];

    if (!message || !raw.sender?.id) {
      return null;
    }

    return {
      platform,
      page_id: pageId,
      sender_id: raw.sender.id,
      sender_name: raw.sender.name ?? "Unknown",
      message_id: message.mid ?? message.id,
      message_type: message.attachments?.[0]?.type ?? "text",
      message_text: message.text ?? "",
      attachments: message.attachments ?? [],
      timestamp: new Date(raw.timestamp ?? raw.time ?? Date.now()),
    };
  }

  if (platform === "whatsapp") {
    if (!raw.from || !raw.id) {
      return null;
    }

    return {
      platform,
      page_id: pageId,
      sender_id: raw.from,
      sender_name: raw.contacts?.[0]?.profile?.name ?? "Unknown",
      message_id: raw.id,
      message_type: mapWhatsAppMessageType(raw.type),
      message_text: raw.text?.body ?? "",
      attachments: getWhatsappAttachments(raw),
      timestamp: new Date(Number(raw.timestamp ?? Date.now()) * 1000),
    };
  }

  return null;
}
