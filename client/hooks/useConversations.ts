"use client";

import { enrichConversation, sortConversations } from "@/lib/inbox";
import { getPusherClient } from "@/lib/pusher";
import { accountService } from "@/services/accounts";
import { conversationService } from "@/services/conversations";
import type {
  AccountRecord,
  ConversationFilter,
  ConversationRecord,
  ConversationView,
  Platform,
} from "@/types";
import { useEffect, useEffectEvent, useState } from "react";

type ConversationUpdate = Partial<ConversationRecord> & {
  _id?: string;
  conversation_id?: string;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

const mergeConversation = (
  current: ConversationView[],
  accounts: AccountRecord[],
  update: ConversationUpdate,
) => {
  const conversationId = update._id ?? update.conversation_id;

  if (!conversationId) {
    return current;
  }

  const existing = current.find(
    (conversation) => conversation._id === conversationId,
  );
  if (!existing && !update.account_id) {
    return current;
  }

  const merged = enrichConversation(
    {
      account_id: existing?.account_id ?? String(update.account_id ?? ""),
      platform:
        existing?.platform ??
        ((update.platform as Platform | undefined) ?? "facebook"),
      page_id: existing?.page_id ?? String(update.page_id ?? ""),
      sender_id: existing?.sender_id ?? String(update.sender_id ?? ""),
      sender_name:
        existing?.sender_name ?? String(update.sender_name ?? "Unknown"),
      status: existing?.status ?? "active",
      ai_enabled: existing?.ai_enabled ?? true,
      unread_count: existing?.unread_count ?? 0,
      last_message_at: existing?.last_message_at ?? new Date().toISOString(),
      last_message_preview: existing?.last_message_preview ?? "",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: existing?.updatedAt ?? new Date().toISOString(),
      ...update,
      _id: conversationId,
    },
    accounts,
  );

  return sortConversations([
    merged,
    ...current.filter((conversation) => conversation._id !== conversationId),
  ]);
};

export function useConversations(openedConversationId?: string | null) {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [allConversations, setAllConversations] = useState<ConversationView[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ConversationFilter>("all");

  const readInboxData = async () => {
    const [nextAccounts, conversations] = await Promise.all([
      accountService.list(),
      conversationService.list(),
    ]);

    return {
      accounts: nextAccounts,
      conversations: sortConversations(
        conversations.map((conversation) =>
          enrichConversation(conversation, nextAccounts),
        ),
      ),
    };
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextInbox = await readInboxData();
      setAccounts(nextInbox.accounts);
      setAllConversations(nextInbox.conversations);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  };

  const handleConversationUpdated = useEffectEvent((update: ConversationUpdate) => {
    setAllConversations((current) => mergeConversation(current, accounts, update));
  });

  useEffect(() => {
    let active = true;

    const loadInbox = async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const nextInbox = await readInboxData();

        if (active) {
          setAccounts(nextInbox.accounts);
          setAllConversations(nextInbox.conversations);
          setError(null);
        }
      } catch (nextError) {
        if (active) {
          setError(getErrorMessage(nextError));
        }
      } finally {
        if (active && showLoading) {
          setLoading(false);
        }
      }
    };

    void loadInbox(true);
    const pollId = window.setInterval(() => {
      void loadInbox(false);
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(pollId);
    };
  }, []);

  useEffect(() => {
    const pusher = getPusherClient();

    if (!pusher) {
      return;
    }

    const channel = pusher.subscribe("inbox");
    channel.bind("conversation-updated", handleConversationUpdated);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("inbox");
    };
  }, []);

  const applyConversationUpdate = (update: ConversationUpdate) => {
    setAllConversations((current) => mergeConversation(current, accounts, update));
  };

  const adjustedConversations = openedConversationId
    ? allConversations.map((conversation) =>
        conversation._id === openedConversationId
          ? { ...conversation, unread_count: 0 }
          : conversation,
      )
    : allConversations;

  const conversations = adjustedConversations.filter((conversation) => {
    if (filter === "all") {
      return true;
    }

    if (filter === "unread") {
      return conversation.unread_count > 0;
    }

    if (filter === "escalated") {
      return conversation.status === "escalated";
    }

    if (filter === "resolved") {
      return conversation.status === "resolved";
    }

    return conversation.platform === filter;
  });

  return {
    accounts,
    allConversations: adjustedConversations,
    conversations,
    loading,
    error,
    filter,
    setFilter,
    refresh,
    applyConversationUpdate,
  };
}
