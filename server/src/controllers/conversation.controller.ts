import { randomUUID } from "crypto";
import { Response } from "express";
import Account from "../models/Account";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import pusher from "../lib/pusher";
import { sendFacebookMessage } from "../services/facebook.service";
import { syncFacebookConversations } from "../services/facebook-sync.service";
import { sendInstagramMessage } from "../services/instagram.service";
import { sendWhatsAppMessage } from "../services/whatsapp.service";

const getSingleQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return typeof value === "string" ? value : undefined;
};

const getSellerAccountIds = async (sellerId: string) => {
  const accounts = await Account.find({ seller_id: sellerId }).select("_id");
  return accounts.map((account) => account.id);
};

const syncSellerFacebookAccounts = async (sellerId: string) => {
  const accounts = await Account.find({
    seller_id: sellerId,
    platform: "facebook",
    status: "active",
  });

  await Promise.all(
    accounts.map(async (account) => {
      try {
        await syncFacebookConversations(account);
      } catch (error) {
        console.warn(
          `[facebook-sync] failed ${JSON.stringify({
            pageId: account.page_id,
            error: error instanceof Error ? error.message : String(error),
          })}`,
        );
      }
    }),
  );
};

const getConversationForSeller = async (
  sellerId: string,
  conversationId: string,
) => {
  const accountIds = await getSellerAccountIds(sellerId);

  return Conversation.findOne({
    _id: conversationId,
    account_id: { $in: accountIds },
  });
};

export const getConversations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const sellerId = req.user?.sellerId;

  if (!sellerId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  await syncSellerFacebookAccounts(sellerId);

  const accountIds = await getSellerAccountIds(sellerId);
  const query: Record<string, unknown> = {
    account_id: { $in: accountIds },
  };

  const status = getSingleQueryValue(req.query.status);
  const accountId = getSingleQueryValue(req.query.account_id);

  if (status) {
    query.status = status;
  }

  if (accountId) {
    query.account_id = accountId;
  }

  const conversations = await Conversation.find(query).sort({
    last_message_at: -1,
  });

  return res.json(conversations);
};

export const getMessages = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const sellerId = req.user?.sellerId;

  if (!sellerId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const conversation = await getConversationForSeller(
    sellerId,
    String(req.params.id),
  );

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found." });
  }

  await Conversation.findByIdAndUpdate(conversation.id, { unread_count: 0 });

  const messages = await Message.find({
    conversation_id: conversation.id,
  }).sort({ timestamp: 1 });

  return res.json(messages);
};

export const sendReply = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const sellerId = req.user?.sellerId;
  const text = String(req.body?.text ?? "").trim();

  if (!sellerId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (!text) {
    return res.status(400).json({ message: "Reply text is required." });
  }

  const conversation = await getConversationForSeller(
    sellerId,
    String(req.params.id),
  );

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found." });
  }

  const account = await Account.findById(conversation.account_id);

  if (!account) {
    return res.status(404).json({ message: "Connected account not found." });
  }

  let deliveryResult: { messageId?: string; raw: unknown };

  if (conversation.platform === "facebook") {
    deliveryResult = await sendFacebookMessage({
      accessToken: account.access_token,
      pageId: account.page_id,
      recipientId: conversation.sender_id,
      text,
    });
  } else if (conversation.platform === "instagram") {
    deliveryResult = await sendInstagramMessage({
      accessToken: account.access_token,
      pageId: account.page_id,
      recipientId: conversation.sender_id,
      text,
    });
  } else {
    deliveryResult = await sendWhatsAppMessage({
      accessToken: account.access_token,
      pageId: account.page_id,
      recipientId: conversation.sender_id,
      text,
    });
  }

  const timestamp = new Date();
  const message = await Message.create({
    conversation_id: conversation.id,
    platform: conversation.platform,
    page_id: conversation.page_id,
    sender_id: conversation.sender_id,
    sender_name: conversation.sender_name,
    message_id: deliveryResult.messageId ?? `out-${randomUUID()}`,
    direction: "outbound",
    source: "manual",
    message_type: "text",
    message_text: text,
    attachments: [],
    timestamp,
  });

  const updatedConversation = await Conversation.findByIdAndUpdate(
    conversation.id,
    {
      last_message_at: timestamp,
      last_message_preview: text.slice(0, 80),
    },
    { returnDocument: "after" },
  );

  await pusher?.trigger(`conversation-${conversation.id}`, "new-message", message);
  await pusher?.trigger("inbox", "conversation-updated", updatedConversation);

  return res.status(201).json({
    message,
    delivery: deliveryResult.raw,
  });
};

export const toggleAI = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const sellerId = req.user?.sellerId;

  if (!sellerId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const conversation = await getConversationForSeller(
    sellerId,
    String(req.params.id),
  );

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found." });
  }

  const requestedState = req.body?.ai_enabled;
  const aiEnabled =
    typeof requestedState === "boolean"
      ? requestedState
      : !conversation.ai_enabled;

  const updatedConversation = await Conversation.findByIdAndUpdate(
    conversation.id,
    { ai_enabled: aiEnabled },
    { returnDocument: "after" },
  );

  await pusher?.trigger("inbox", "conversation-updated", updatedConversation);

  return res.json(updatedConversation);
};
