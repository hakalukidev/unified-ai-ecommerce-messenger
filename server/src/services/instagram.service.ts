import axios from "axios";
import type {
  SendPlatformAudioInput,
  SendPlatformMessageInput,
  SendPlatformMessageResult,
} from "./facebook.service";

const graphVersion = process.env.META_GRAPH_VERSION ?? "v23.0";

export async function sendInstagramAudioMessage({
  accessToken,
  pageId,
  recipientId,
  audioUrl,
}: SendPlatformAudioInput): Promise<SendPlatformMessageResult> {
  const url = `https://graph.facebook.com/${graphVersion}/${pageId}/messages`;

  const response = await axios.post(
    url,
    {
      recipient: { id: recipientId },
      message: {
        attachment: { type: "audio", payload: { url: audioUrl, is_reusable: true } },
      },
    },
    {
      params: { access_token: accessToken },
    },
  );

  const data = response.data as { message_id?: string };

  return {
    messageId: data.message_id,
    raw: data,
  };
}

export async function sendInstagramMessage({
  accessToken,
  pageId,
  recipientId,
  text,
}: SendPlatformMessageInput): Promise<SendPlatformMessageResult> {
  const url = `https://graph.facebook.com/${graphVersion}/${pageId}/messages`;

  const response = await axios.post(
    url,
    {
      recipient: { id: recipientId },
      message: { text },
    },
    {
      params: { access_token: accessToken },
    },
  );

  const data = response.data as { message_id?: string };

  return {
    messageId: data.message_id,
    raw: data,
  };
}
