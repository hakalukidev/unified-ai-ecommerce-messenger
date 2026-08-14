import { getConversationStatusLabel, getPlatformLabel } from "@/lib/format";
import type {
  AccountRecord,
  ConversationRecord,
  ConversationView,
  LocalSummary,
  MessageRecord,
  Platform,
} from "@/types";

const pageFallbacks: Record<Platform, string> = {
  facebook: "Facebook Inbox",
  instagram: "Instagram DM",
  whatsapp: "WhatsApp Chat",
};

const stopWords = new Set([
  "about",
  "after",
  "again",
  "also",
  "arrive",
  "because",
  "before",
  "could",
  "delivery",
  "hello",
  "please",
  "order",
  "their",
  "there",
  "these",
  "those",
  "thanks",
  "thank",
  "today",
  "would",
  "which",
  "where",
  "when",
  "your",
  "have",
  "just",
  "from",
  "with",
  "that",
  "this",
  "they",
  "them",
  "need",
  "want",
  "into",
  "been",
  "more",
  "will",
  "were",
  "here",
  "them",
  "what",
  "does",
  "shipping",
  "stock",
]);

export const sortConversations = <T extends { last_message_at: string }>(
  conversations: T[],
) =>
  [...conversations].sort(
    (left, right) =>
      new Date(right.last_message_at).getTime() -
      new Date(left.last_message_at).getTime(),
  );

export const enrichConversation = (
  conversation: ConversationRecord,
  accounts: AccountRecord[],
): ConversationView => {
  const matchingAccount = accounts.find(
    (account) => account._id === conversation.account_id,
  );

  return {
    ...conversation,
    page_name:
      matchingAccount?.page_name ?? pageFallbacks[conversation.platform],
    page_username: matchingAccount?.page_username,
    account_status: matchingAccount?.status,
  };
};

export const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return "?";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

const collectKeywords = (messages: MessageRecord[]) => {
  const counts = new Map<string, number>();

  for (const message of messages) {
    const words =
      message.message_text
        .toLowerCase()
        .match(/[a-z0-9]+/g)
        ?.filter((word) => word.length > 3 && !stopWords.has(word)) ?? [];

    for (const word of words) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([word]) => word[0].toUpperCase() + word.slice(1));
};

export const buildReplySuggestions = (
  messages: MessageRecord[],
  platform: Platform | null,
) => {
  const lastInbound = [...messages]
    .reverse()
    .find(
      (message) => message.direction === "inbound" && message.message_text.trim(),
    )
    ?.message_text.toLowerCase();

  const suggestions: string[] = [];

  if (lastInbound?.match(/order|delivery|shipping|arrive|eta/)) {
    suggestions.push(
      "Thanks for checking in. I am reviewing the order status and will confirm the latest update for you shortly.",
      "Could you share your order number so I can verify the delivery timeline from our side?",
    );
  }

  if (lastInbound?.match(/price|cost|discount|offer/)) {
    suggestions.push(
      "I can help with pricing. Let me confirm the latest rate and any available offer for you.",
    );
  }

  if (lastInbound?.match(/size|color|stock|available|variant/)) {
    suggestions.push(
      "I am checking the available size and color options now so I can give you an exact answer.",
    );
  }

  if (lastInbound?.match(/refund|return|cancel|exchange/)) {
    suggestions.push(
      "I can help with that. Please share the order details and I will walk you through the next step.",
    );
  }

  suggestions.push(
    "Thanks for reaching out. I am reviewing this conversation and will help you right away.",
    platform === "whatsapp"
      ? "I am on it now. Give me a moment and I will send you a clear update here."
      : `I am checking the latest details on ${getPlatformLabel(platform ?? "facebook")} and will reply with the best next step.`,
    "If you want, I can also confirm any order, product, or delivery details for you here.",
  );

  return [...new Set(suggestions)].slice(0, 3);
};

export const buildConversationSummary = (
  conversation: ConversationView,
  messages: MessageRecord[],
): LocalSummary => {
  const inboundMessages = messages.filter(
    (message) => message.direction === "inbound" && message.message_text.trim(),
  );
  const latestInbound = inboundMessages.at(-1)?.message_text.trim();
  const directQuestions = inboundMessages
    .map((message) => message.message_text.trim())
    .filter((text) => text.includes("?"))
    .slice(-3);
  const keywords = collectKeywords(messages);

  const statusText =
    conversation.status === "escalated"
      ? "Escalated and waiting for manual follow-up."
      : conversation.status === "resolved"
        ? "Resolved in the current thread."
        : `Open and currently ${conversation.ai_enabled ? "AI-assisted" : "manual-only"}.`;

  return {
    intent:
      latestInbound ??
      "No customer message has been captured in this thread yet.",
    questions:
      directQuestions.length > 0
        ? directQuestions.join(" ")
        : "No direct question marks were detected in the latest customer messages.",
    products:
      keywords.length > 0
        ? keywords.join(", ")
        : "No obvious product names were inferred from the local message history.",
    status: `${getConversationStatusLabel(conversation.status)}. ${statusText}`,
  };
};
