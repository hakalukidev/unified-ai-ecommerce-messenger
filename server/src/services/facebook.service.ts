import axios from "axios";

export interface SendPlatformMessageInput {
  accessToken: string;
  pageId: string;
  recipientId: string;
  text: string;
}

export interface SendPlatformMessageResult {
  messageId?: string;
  raw: unknown;
}

const graphVersion = process.env.META_GRAPH_VERSION ?? "v23.0";

export async function sendFacebookMessage({
  accessToken,
  pageId,
  recipientId,
  text,
}: SendPlatformMessageInput): Promise<SendPlatformMessageResult> {
  const url = `https://graph.facebook.com/${graphVersion}/${pageId}/messages`;

  const response = await axios.post(
    url,
    {
      messaging_type: "RESPONSE",
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
