"use client";

import { buildReplySuggestions } from "@/lib/inbox";
import { getPusherClient } from "@/lib/pusher";
import { conversationService } from "@/services/conversations";
import type { MessageRecord, Platform } from "@/types";
import { useEffect, useEffectEvent, useState } from "react";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

const sortMessages = (messages: MessageRecord[]) =>
  [...messages].sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );

export function useMessages(
  conversationId: string | null,
  platform: Platform | null,
) {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendMessage = useEffectEvent((message: MessageRecord) => {
    setMessages((current) => {
      if (current.some((entry) => entry._id === message._id)) {
        return current;
      }

      return sortMessages([...current, message]);
    });
  });

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let active = true;

    const loadMessages = async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      try {
        const nextMessages = await conversationService.getMessages(conversationId);

        if (active) {
          setMessages(sortMessages(nextMessages));
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

    void loadMessages(true);
    const pollId = window.setInterval(() => {
      void loadMessages(false);
    }, 5000);

    const pusher = getPusherClient();
    if (!pusher) {
      return () => {
        active = false;
        window.clearInterval(pollId);
      };
    }

    const channel = pusher.subscribe(`conversation-${conversationId}`);
    channel.bind("new-message", appendMessage);

    return () => {
      active = false;
      window.clearInterval(pollId);
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId]);

  const sendReply = async (text: string) => {
    if (!conversationId || !text.trim()) {
      return null;
    }

    setSending(true);

    try {
      const response = await conversationService.sendReply(
        conversationId,
        text.trim(),
      );

      setMessages((current) => {
        if (current.some((entry) => entry._id === response.message._id)) {
          return current;
        }

        return sortMessages([...current, response.message]);
      });

      return response.message;
    } finally {
      setSending(false);
    }
  };

  const sendAudioReply = async (blob: Blob) => {
    if (!conversationId) {
      return null;
    }

    const response = await conversationService.sendAudioReply(
      conversationId,
      blob,
    );

    setMessages((current) => {
      if (current.some((entry) => entry._id === response.message._id)) {
        return current;
      }

      return sortMessages([...current, response.message]);
    });

    return response.message;
  };

  return {
    messages: conversationId ? messages : [],
    loading: conversationId ? loading : false,
    sending,
    error: conversationId ? error : null,
    suggestions: buildReplySuggestions(messages, platform),
    sendReply,
    sendAudioReply,
  };
}
