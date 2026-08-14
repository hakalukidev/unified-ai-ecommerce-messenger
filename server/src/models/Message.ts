import { Model, Schema, model, models } from "mongoose";
import type { Platform } from "./Account";

export type MessageDirection = "inbound" | "outbound";
export type MessageSource = "customer" | "ai_auto" | "manual" | "system";
export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "file"
  | "button"
  | "postback";

export interface MessageDocument {
  conversation_id: string;
  platform: Platform;
  page_id: string;
  sender_id: string;
  sender_name: string;
  message_id: string;
  direction: MessageDirection;
  source: MessageSource;
  message_type: MessageType;
  message_text: string;
  attachments: unknown[];
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<MessageDocument>(
  {
    conversation_id: { type: String, required: true, trim: true },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "whatsapp"],
      required: true,
    },
    page_id: { type: String, required: true, trim: true },
    sender_id: { type: String, required: true, trim: true },
    sender_name: { type: String, default: "Unknown", trim: true },
    message_id: { type: String, required: true, unique: true, trim: true },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    source: {
      type: String,
      enum: ["customer", "ai_auto", "manual", "system"],
      required: true,
    },
    message_type: {
      type: String,
      enum: ["text", "image", "audio", "video", "file", "button", "postback"],
      default: "text",
    },
    message_text: { type: String, default: "" },
    attachments: { type: Array, default: [] },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

messageSchema.index({ conversation_id: 1, timestamp: 1 });

const Message =
  (models.Message as Model<MessageDocument> | undefined) ??
  model<MessageDocument>("Message", messageSchema);

export default Message;
