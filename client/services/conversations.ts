import { apiClient } from "@/lib/api";
import type {
  ConversationRecord,
  MessageRecord,
  ReplyResponse,
} from "@/types";

type ListOptions = {
  status?: string;
  accountId?: string;
};

export const conversationService = {
  list: (options: ListOptions = {}) => {
    const params = new URLSearchParams();

    if (options.status) {
      params.set("status", options.status);
    }

    if (options.accountId) {
      params.set("account_id", options.accountId);
    }

    const query = params.toString();

    return apiClient.get<ConversationRecord[]>(
      `/conversations${query ? `?${query}` : ""}`,
    );
  },
  getMessages: (conversationId: string) =>
    apiClient.get<MessageRecord[]>(`/conversations/${conversationId}/messages`),
  sendReply: (conversationId: string, text: string) =>
    apiClient.post<ReplyResponse>(`/conversations/${conversationId}/reply`, {
      text,
    }),
  toggleAI: (conversationId: string, aiEnabled: boolean) =>
    apiClient.patch<ConversationRecord>(
      `/conversations/${conversationId}/ai-toggle`,
      {
        ai_enabled: aiEnabled,
      },
    ),
};
