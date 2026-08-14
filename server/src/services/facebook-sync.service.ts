import axios from "axios";
import type { HydratedDocument } from "mongoose";
import type { AccountDocument } from "../models/Account";
import Conversation from "../models/Conversation";
import Message, { MessageType } from "../models/Message";

type AccountDoc = HydratedDocument<AccountDocument>;

interface GraphAttachment {
  type?: string;
  [key: string]: unknown;
}

interface GraphMessage {
  id?: string;
  message?: string;
  from?: {
    id?: string;
    name?: string;
  };
  to?: {
    data?: Array<{
      id?: string;
      name?: string;
    }>;
  };
  created_time?: string;
  attachments?: {
    data?: GraphAttachment[];
  };
}

interface GraphConversation {
  id?: string;
  updated_time?: string;
  snippet?: string;
  participants?: {
    data?: Array<{
      id?: string;
      name?: string;
    }>;
  };
  messages?: {
    data?: GraphMessage[];
  };
}

interface GraphConversationResponse {
  data?: GraphConversation[];
}

const graphVersion = process.env.META_GRAPH_VERSION ?? "v25.0";

const mapAttachmentType = (attachmentType?: string): MessageType => {
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

const getMessageText = (message: GraphMessage) => {
  if (message.message) {
    return message.message;
  }

  const attachmentType = message.attachments?.data?.[0]?.type;
  return attachmentType ? `[${attachmentType}]` : "";
};

const getMessageTimestamp = (message: GraphMessage, fallback?: string) =>
  new Date(message.created_time ?? fallback ?? Date.now());

const getCustomerFromConversation = (
  account: AccountDoc,
  conversation: GraphConversation,
) => {
  const messages = conversation.messages?.data ?? [];
  const customerMessage = messages.find(
    (message) => message.from?.id && message.from.id !== account.page_id,
  );

  if (customerMessage?.from?.id) {
    return {
      id: customerMessage.from.id,
      name: customerMessage.from.name ?? "Unknown",
    };
  }

  const participant = conversation.participants?.data?.find(
    (entry) => entry.id && entry.id !== account.page_id,
  );

  if (participant?.id) {
    return {
      id: participant.id,
      name: participant.name ?? "Unknown",
    };
  }

  return null;
};

const getFallbackMessageId = (
  graphConversationId: string,
  message: GraphMessage,
) =>
  [
    "fb-sync",
    graphConversationId,
    message.created_time ?? Date.now(),
    message.from?.id,
  ]
    .filter(Boolean)
    .join("-");

const fetchFacebookConversations = async (account: AccountDoc) => {
  const response = await axios.get<GraphConversationResponse>(
    `https://graph.facebook.com/${graphVersion}/${account.page_id}/conversations`,
    {
      params: {
        access_token: account.access_token,
        platform: "messenger",
        limit: 25,
        fields:
          "id,updated_time,snippet,participants{id,name},messages.limit(20){id,message,from,to,created_time,attachments}",
      },
    },
  );

  return response.data.data ?? [];
};

export const syncFacebookConversations = async (account: AccountDoc) => {
  if (account.platform !== "facebook" || account.status !== "active") {
    return;
  }

  const graphConversations = await fetchFacebookConversations(account);

  for (const graphConversation of graphConversations) {
    const customer = getCustomerFromConversation(account, graphConversation);

    if (!graphConversation.id || !customer) {
      continue;
    }

    const graphMessages = [...(graphConversation.messages?.data ?? [])].sort(
      (left, right) =>
        getMessageTimestamp(left).getTime() - getMessageTimestamp(right).getTime(),
    );
    const latestGraphMessage = graphMessages[graphMessages.length - 1];
    const latestTimestamp = latestGraphMessage
      ? getMessageTimestamp(latestGraphMessage, graphConversation.updated_time)
      : new Date(graphConversation.updated_time ?? Date.now());
    const latestPreview =
      (latestGraphMessage ? getMessageText(latestGraphMessage) : "") ||
      graphConversation.snippet ||
      "";

    const conversation = await Conversation.findOneAndUpdate(
      {
        account_id: account.id,
        page_id: account.page_id,
        sender_id: customer.id,
      },
      {
        $setOnInsert: {
          account_id: account.id,
          platform: "facebook",
          page_id: account.page_id,
          sender_id: customer.id,
          status: "active",
          ai_enabled: account.ai_enabled,
          unread_count: 0,
        },
        $set: {
          sender_name: customer.name,
          last_message_at: latestTimestamp,
          last_message_preview: latestPreview.slice(0, 80),
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    let newInboundCount = 0;

    for (const graphMessage of graphMessages) {
      const messageId =
        graphMessage.id ?? getFallbackMessageId(graphConversation.id, graphMessage);
      const existingMessage = await Message.findOne({ message_id: messageId });

      if (existingMessage) {
        continue;
      }

      const direction =
        graphMessage.from?.id === account.page_id ? "outbound" : "inbound";
      const messageText = getMessageText(graphMessage);
      const attachments = graphMessage.attachments?.data ?? [];
      const messageType = mapAttachmentType(attachments[0]?.type);

      await Message.create({
        conversation_id: conversation.id,
        platform: "facebook",
        page_id: account.page_id,
        sender_id: customer.id,
        sender_name: customer.name,
        message_id: messageId,
        direction,
        source: direction === "inbound" ? "customer" : "manual",
        message_type: messageType,
        message_text: messageText,
        attachments,
        timestamp: getMessageTimestamp(graphMessage, graphConversation.updated_time),
      });

      if (direction === "inbound") {
        newInboundCount += 1;
      }
    }

    if (newInboundCount > 0) {
      await Conversation.findByIdAndUpdate(conversation.id, {
        $inc: { unread_count: newInboundCount },
      });
    }
  }
};
