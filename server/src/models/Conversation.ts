import { Model, Schema, model, models } from "mongoose";
import type { Platform } from "./Account";

export type ConversationStatus = "active" | "escalated" | "resolved";

export interface ConversationDocument {
  account_id: string;
  platform: Platform;
  page_id: string;
  sender_id: string;
  sender_name: string;
  status: ConversationStatus;
  ai_enabled: boolean;
  unread_count: number;
  last_message_at: Date;
  last_message_preview: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<ConversationDocument>(
  {
    account_id: { type: String, required: true, trim: true },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "whatsapp"],
      required: true,
    },
    page_id: { type: String, required: true, trim: true },
    sender_id: { type: String, required: true, trim: true },
    sender_name: { type: String, default: "Unknown", trim: true },
    status: {
      type: String,
      enum: ["active", "escalated", "resolved"],
      default: "active",
    },
    ai_enabled: { type: Boolean, default: true },
    unread_count: { type: Number, default: 0 },
    last_message_at: { type: Date, default: Date.now },
    last_message_preview: { type: String, default: "" },
  },
  { timestamps: true },
);

conversationSchema.index(
  { account_id: 1, page_id: 1, sender_id: 1 },
  { unique: true },
);
conversationSchema.index({ account_id: 1, last_message_at: -1 });

const Conversation =
  (models.Conversation as Model<ConversationDocument> | undefined) ??
  model<ConversationDocument>("Conversation", conversationSchema);

export default Conversation;
