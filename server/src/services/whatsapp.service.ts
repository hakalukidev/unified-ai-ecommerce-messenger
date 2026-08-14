import axios from "axios";
import type {
  SendPlatformMessageInput,
  SendPlatformMessageResult,
} from "./facebook.service";

const graphVersion = process.env.META_GRAPH_VERSION ?? "v23.0";

export async function sendWhatsAppMessage({
  accessToken,
  pageId,
  recipientId,
  text,
}: SendPlatformMessageInput): Promise<SendPlatformMessageResult> {
  const url = `https://graph.facebook.com/${graphVersion}/${pageId}/messages`;

  const response = await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientId,
      type: "text",
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data = response.data as { messages?: Array<{ id?: string }> };

  return {
    messageId: data.messages?.[0]?.id,
    raw: data,
  };
}

export interface SendWhatsAppAudioInput {
  accessToken: string;
  pageId: string; // WhatsApp phone_number_id
  recipientId: string;
  audioBuffer: Buffer;
}

/**
 * WhatsApp doesn't accept an attachment URL like FB/IG — the audio has to be
 * uploaded to Meta's media store first (OGG/Opus only), then referenced by
 * media id in the send call.
 */
export async function sendWhatsAppAudioMessage({
  accessToken,
  pageId,
  recipientId,
  audioBuffer,
}: SendWhatsAppAudioInput): Promise<SendPlatformMessageResult> {
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" }),
    "reply.ogg",
  );

  const { data: uploadData } = await axios.post<{ id: string }>(
    `https://graph.facebook.com/${graphVersion}/${pageId}/media`,
    form,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const response = await axios.post(
    `https://graph.facebook.com/${graphVersion}/${pageId}/messages`,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientId,
      type: "audio",
      audio: { id: uploadData.id },
    },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const data = response.data as { messages?: Array<{ id?: string }> };

  return {
    messageId: data.messages?.[0]?.id,
    raw: data,
  };
}
