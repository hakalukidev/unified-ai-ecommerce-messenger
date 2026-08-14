import { Request, Response } from "express";
import Account, { Platform } from "../models/Account";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import pusher from "../lib/pusher";
import { normalizeMessage } from "../services/normalize.service";

const logWebhook = (
  level: "log" | "warn" | "error",
  event: string,
  details: Record<string, unknown> = {},
) => {
  console[level](
    `[webhook] ${event} ${JSON.stringify({
      timestamp: new Date().toISOString(),
      ...details,
    })}`,
  );
};

const getFacebookEvents = (entry: Record<string, any>) => {
  const messagingEvents = Array.isArray(entry.messaging) ? entry.messaging : [];
  const changeEvents = Array.isArray(entry.changes)
    ? entry.changes
        .filter((change: Record<string, any>) =>
          ["messages", "messaging_postbacks"].includes(change.field),
        )
        .map((change: Record<string, any>) => change.value)
        .filter(Boolean)
    : [];

  return [...messagingEvents, ...changeEvents];
};

const getFacebookPageId = (
  entry: Record<string, any>,
  event: Record<string, any>,
) => String(entry.id ?? event.recipient?.id ?? event.page_id ?? "").trim();

const isProcessableFacebookEvent = (event: Record<string, any>) =>
  Boolean(event.message || event.postback);

export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    logWebhook("log", "verify.success", {
      path: req.path,
      mode,
    });
    return res.status(200).send(challenge);
  }

  logWebhook("warn", "verify.failed", {
    path: req.path,
    mode,
    tokenMatched: token === process.env.VERIFY_TOKEN,
  });
  return res.sendStatus(403);
};

export const facebookWebhook = async (req: Request, res: Response) => {
  logWebhook("log", "facebook.hit", {
    contentType: req.header("content-type"),
    bodyKeys:
      req.body && typeof req.body === "object" ? Object.keys(req.body) : [],
  });

  res.sendStatus(200);

  try {
    const body = req.body as Record<string, any>;

    logWebhook("log", "facebook.received", {
      object: body.object,
      entryCount: Array.isArray(body.entry) ? body.entry.length : 0,
    });

    if (body.object !== "page") {
      logWebhook("warn", "facebook.ignored.object", {
        object: body.object,
      });
      return;
    }

    for (const entry of body.entry ?? []) {
      const events = getFacebookEvents(entry);

      logWebhook("log", "facebook.entry_parsed", {
        entryId: entry.id,
        eventCount: events.length,
      });

      for (const event of events) {
        const pageId = getFacebookPageId(entry, event);

        if (!isProcessableFacebookEvent(event)) {
          logWebhook("log", "facebook.event_skipped", {
            pageId,
            senderId: event.sender?.id,
            hasMessage: Boolean(event.message),
            hasPostback: Boolean(event.postback),
            hasRead: Boolean(event.read),
            hasDelivery: Boolean(event.delivery),
          });
          continue;
        }

        if (event.message?.is_echo) {
          logWebhook("log", "facebook.echo_skipped", {
            pageId,
            senderId: event.sender?.id,
            messageId: event.message?.mid,
          });
          continue;
        }

        if (!pageId) {
          logWebhook("warn", "facebook.page_id_missing", {
            entryId: entry.id,
            senderId: event.sender?.id,
          });
          continue;
        }

        const account = await Account.findOne({
          page_id: pageId,
          platform: "facebook",
        });

        if (!account) {
          logWebhook("warn", "facebook.account_missing", {
            pageId,
            senderId: event.sender?.id,
          });
          continue;
        }

        logWebhook("log", "facebook.account_matched", {
          pageId,
          accountId: account.id,
          senderId: event.sender?.id,
        });

        await processIncoming("facebook", event, pageId, account.id);
      }
    }
  } catch (error) {
    logWebhook("error", "facebook.processing_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const instagramWebhook = async (req: Request, res: Response) => {
  res.sendStatus(200);

  try {
    const body = req.body as Record<string, any>;

    logWebhook("log", "instagram.received", {
      object: body.object,
      entryCount: Array.isArray(body.entry) ? body.entry.length : 0,
    });

    if (body.object !== "instagram") {
      logWebhook("warn", "instagram.ignored.object", {
        object: body.object,
      });
      return;
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") {
          logWebhook("log", "instagram.change_skipped", {
            field: change.field,
          });
          continue;
        }

        const value = change.value ?? {};
        const pageId = value.recipient?.id;
        const account = await Account.findOne({
          page_id: pageId,
          platform: "instagram",
        });

        if (!account || !pageId) {
          logWebhook("warn", "instagram.account_missing", {
            pageId,
          });
          continue;
        }

        const normalizedEvent = {
          sender: value.sender,
          recipient: value.recipient,
          message: value.message ?? value.messages?.[0],
          timestamp: value.timestamp ?? value.time,
        };

        await processIncoming("instagram", normalizedEvent, pageId, account.id);
      }
    }
  } catch (error) {
    logWebhook("error", "instagram.processing_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const whatsappWebhook = async (req: Request, res: Response) => {
  res.sendStatus(200);

  try {
    const body = req.body as Record<string, any>;
    const changeValue = body.entry?.[0]?.changes?.[0]?.value;

    logWebhook("log", "whatsapp.received", {
      object: body.object,
      hasMessages: Boolean(changeValue?.messages),
    });

    if (!changeValue?.messages) {
      logWebhook("warn", "whatsapp.ignored.no_messages");
      return;
    }

    const phoneNumberId = changeValue.metadata?.phone_number_id;
    const account = await Account.findOne({
      page_id: phoneNumberId,
      platform: "whatsapp",
    });

    if (!account) {
      logWebhook("warn", "whatsapp.account_missing", {
        phoneNumberId,
      });
      return;
    }

    for (const incomingMessage of changeValue.messages) {
      await processIncoming(
        "whatsapp",
        {
          ...incomingMessage,
          contacts: changeValue.contacts,
        },
        phoneNumberId,
        account.id,
      );
    }
  } catch (error) {
    logWebhook("error", "whatsapp.processing_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

async function processIncoming(
  platform: Platform,
  raw: Record<string, any>,
  pageId: string,
  accountId: string,
) {
  logWebhook("log", "message.processing_started", {
    platform,
    pageId,
    accountId,
    senderId:
      raw.sender?.id ??
      raw.from ??
      raw.contacts?.[0]?.wa_id ??
      null,
  });

  const normalized = normalizeMessage(platform, raw, pageId);

  if (!normalized) {
    logWebhook("warn", "message.normalization_failed", {
      platform,
      pageId,
    });
    return;
  }

  let conversation = await Conversation.findOne({
    page_id: pageId,
    sender_id: normalized.sender_id,
    account_id: accountId,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      account_id: accountId,
      platform,
      page_id: pageId,
      sender_id: normalized.sender_id,
      sender_name: normalized.sender_name,
      last_message_at: normalized.timestamp,
      last_message_preview: normalized.message_text.slice(0, 80),
      unread_count: 0,
    });

    logWebhook("log", "conversation.created", {
      platform,
      pageId,
      accountId,
      conversationId: conversation.id,
      senderId: normalized.sender_id,
    });
  }

  const existingMessage = await Message.findOne({
    message_id: normalized.message_id,
  });

  if (existingMessage) {
    logWebhook("log", "message.duplicate_skipped", {
      platform,
      pageId,
      messageId: normalized.message_id,
      conversationId: conversation.id,
    });
    return;
  }

  const updatedConversation = await Conversation.findByIdAndUpdate(
    conversation.id,
    {
      last_message_at: normalized.timestamp,
      last_message_preview: normalized.message_text.slice(0, 80),
      $inc: { unread_count: 1 },
    },
    { returnDocument: "after" },
  );

  const message = await Message.create({
    conversation_id: conversation.id,
    direction: "inbound",
    source: "customer",
    ...normalized,
  });

  logWebhook("log", "message.saved", {
    platform,
    pageId,
    accountId,
    conversationId: conversation.id,
    messageId: message.message_id,
    senderId: normalized.sender_id,
  });

  await pusher?.trigger(`conversation-${conversation.id}`, "new-message", message);
  await pusher?.trigger(
    "inbox",
    "conversation-updated",
    updatedConversation ?? conversation,
  );

  logWebhook("log", "message.broadcasted", {
    platform,
    conversationId: conversation.id,
    messageId: message.message_id,
  });
}
