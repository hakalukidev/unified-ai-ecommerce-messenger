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
