import { randomUUID } from "crypto";
import Account from "../models/Account";
import Conversation, { ConversationDocument } from "../models/Conversation";
import Message, { MessageDocument } from "../models/Message";
import pusher from "../lib/pusher";
import { getAIReply, synthesizeSpeech, transcribeAudio } from "./chatbot.service";
import { downloadFromUrl, downloadWhatsAppMedia, saveAudioReply } from "./media.service";
import { sendFacebookAudioMessage, sendFacebookMessage } from "./facebook.service";
import { sendInstagramAudioMessage, sendInstagramMessage } from "./instagram.service";
import { sendWhatsAppAudioMessage, sendWhatsAppMessage } from "./whatsapp.service";

const log = (
  level: "log" | "warn" | "error",
  event: string,
  details: Record<string, unknown> = {},
) => {
  console[level](
    `[ai-reply] ${event} ${JSON.stringify({ timestamp: new Date().toISOString(), ...details })}`,
  );
};

/** Turn an inbound message into plain text the chatbot can respond to. */
async function resolveInboundText(
  conversation: ConversationDocument & { id: string },
  message: MessageDocument,
  accessToken: string,
): Promise<{ text: string; wasVoice: boolean } | null> {
  if (message.message_type === "text" || message.message_type === "postback") {
    return message.message_text ? { text: message.message_text, wasVoice: false } : null;
  }

  if (message.message_type !== "audio") {
    // images/video/files aren't supported by the text chatbot yet.
    return null;
  }

  const attachment = message.attachments?.[0] as Record<string, any> | undefined;
  if (!attachment) return null;

  let audioBuffer: Buffer;
  let mimeType = "audio/wav";
  let filename = "audio.wav";

  if (conversation.platform === "whatsapp") {
    const mediaId = attachment.id;
    if (!mediaId) return null;
    const media = await downloadWhatsAppMedia(mediaId, accessToken);
    audioBuffer = media.buffer;
    mimeType = media.mimeType;
    filename = `audio.${mimeType.split("/")[1]?.split(";")[0] ?? "wav"}`;
  } else {
    // Webhook-delivered attachments carry the URL at `payload.url`; the
    // same message re-discovered later via the Graph API sync fallback
    // (see facebook-sync.service.ts) comes back shaped differently, with
    // the URL at `file_url` instead. Accept either.
    const url = attachment.payload?.url ?? attachment.file_url;
    if (!url) return null;
    audioBuffer = await downloadFromUrl(url);
  }

  const text = await transcribeAudio(audioBuffer, filename, mimeType);
  return text ? { text, wasVoice: true } : null;
}

/**
 * Called after an inbound customer message has been saved. If AI auto-reply
 * is enabled for both the connected account and this conversation, ask the
 * chatbot service for a reply and send it back on the same platform.
 */
export async function maybeAutoReply(
  conversation: ConversationDocument & { id: string },
  message: MessageDocument,
  accountId: string,
) {
  try {
    const account = await Account.findById(accountId);

    if (!account || !account.ai_enabled || !conversation.ai_enabled) {
      return;
    }

    const inbound = await resolveInboundText(conversation, message, account.access_token);

    if (!inbound) {
      log("log", "skip.unsupported_message_type", {
        conversationId: conversation.id,
        messageType: message.message_type,
        messageTextLength: message.message_text?.length ?? 0,
        attachmentCount: message.attachments?.length ?? 0,
        attachments: message.attachments,
      });
      return;
    }

    const replyText = await getAIReply(conversation.id, inbound.text);

    let deliveryResult: { messageId?: string; raw: unknown };
    let messageType: MessageDocument["message_type"] = "text";
    let attachments: unknown[] = [];

    if (inbound.wasVoice) {
      messageType = "audio";

      if (conversation.platform === "whatsapp") {
        const audioBuffer = await synthesizeSpeech(replyText, "ogg");
        attachments = [{ type: "audio", mimeType: "audio/ogg" }];

        deliveryResult = await sendWhatsAppAudioMessage({
          accessToken: account.access_token,
          pageId: account.page_id,
          recipientId: conversation.sender_id,
          audioBuffer,
        });
      } else {
        const audioBuffer = await synthesizeSpeech(replyText, "wav");
        const audioUrl = saveAudioReply(audioBuffer);
        attachments = [{ type: "audio", url: audioUrl }];

        deliveryResult =
          conversation.platform === "facebook"
            ? await sendFacebookAudioMessage({
                accessToken: account.access_token,
                pageId: account.page_id,
                recipientId: conversation.sender_id,
                audioUrl,
              })
            : await sendInstagramAudioMessage({
                accessToken: account.access_token,
                pageId: account.page_id,
                recipientId: conversation.sender_id,
                audioUrl,
              });
      }
    } else {
      deliveryResult =
        conversation.platform === "facebook"
          ? await sendFacebookMessage({
              accessToken: account.access_token,
              pageId: account.page_id,
              recipientId: conversation.sender_id,
              text: replyText,
            })
          : conversation.platform === "instagram"
            ? await sendInstagramMessage({
                accessToken: account.access_token,
                pageId: account.page_id,
                recipientId: conversation.sender_id,
                text: replyText,
              })
            : await sendWhatsAppMessage({
                accessToken: account.access_token,
                pageId: account.page_id,
                recipientId: conversation.sender_id,
                text: replyText,
              });
    }

    const timestamp = new Date();
    const outboundMessage = await Message.create({
      conversation_id: conversation.id,
      platform: conversation.platform,
      page_id: conversation.page_id,
      sender_id: conversation.sender_id,
      sender_name: conversation.sender_name,
      message_id: deliveryResult.messageId ?? `ai-${randomUUID()}`,
      direction: "outbound",
      source: "ai_auto",
      message_type: messageType,
      message_text: replyText,
      attachments,
      timestamp,
    });

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversation.id,
      {
        last_message_at: timestamp,
        last_message_preview: replyText.slice(0, 80),
      },
      { returnDocument: "after" },
    );

    await pusher?.trigger(`conversation-${conversation.id}`, "new-message", outboundMessage);
    await pusher?.trigger("inbox", "conversation-updated", updatedConversation ?? conversation);

    log("log", "reply_sent", {
      conversationId: conversation.id,
      platform: conversation.platform,
      voice: inbound.wasVoice,
    });
  } catch (error) {
    const graphError =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: unknown } }).response?.data
        : undefined;
    log("error", "failed", {
      conversationId: conversation.id,
      error: error instanceof Error ? error.message : String(error),
      graphError,
    });
  }
}
