export type Platform = "facebook" | "instagram" | "whatsapp";

export interface ConversationSummary {
  id: string;
  platform: Platform;
  senderName: string;
  preview: string;
  unreadCount: number;
  updatedAt: string;
}

export interface MessageRecord {
  id: string;
  direction: "inbound" | "outbound";
  text: string;
  timestamp: string;
}
