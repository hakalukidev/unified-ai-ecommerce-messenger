import type { ConversationStatus, Platform } from "@/types";
import { format, formatDistanceToNow } from "date-fns";

const platformLabels: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
};

const statusLabels: Record<ConversationStatus, string> = {
  active: "Active",
  escalated: "Escalated",
  resolved: "Resolved",
};

const safeDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export const getPlatformLabel = (platform: Platform) => platformLabels[platform];

export const getConversationStatusLabel = (status: ConversationStatus) =>
  statusLabels[status];

export const formatRelativeTimestamp = (value: string) =>
  formatDistanceToNow(safeDate(value), { addSuffix: false });

/** Compact date + time for conversation list rows, e.g. "Aug 15, 11:43 AM". */
export const formatListTimestamp = (value: string) =>
  format(safeDate(value), "MMM d, h:mm a");

export const formatMessageTime = (value: string) =>
  format(safeDate(value), "h:mm a");

export const formatLongDate = (value: string) =>
  format(safeDate(value), "MMM d, yyyy");
