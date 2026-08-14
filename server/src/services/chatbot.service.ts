import axios from "axios";

const chatbotBaseUrl = process.env.CHATBOT_SERVICE_URL ?? "http://localhost:8001";

const chatbotClient = axios.create({
  baseURL: chatbotBaseUrl,
  timeout: 20_000,
});

/**
 * Ask the Python (LangGraph/Groq) chatbot service for a reply.
 * `conversationId` is used as the LangGraph thread id so the bot
 * keeps per-conversation memory.
 */
export async function getAIReply(
  conversationId: string,
  text: string,
): Promise<string> {
  const { data } = await chatbotClient.post<{ reply: string }>("/chat", {
    conversation_id: conversationId,
    text,
  });

  return data.reply;
}

/** Send inbound voice-note bytes to the chatbot service for transcription. */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: mimeType }),
    filename,
  );

  const { data } = await chatbotClient.post<{ text: string }>(
    "/transcribe",
    form,
  );

  return data.text;
}

/**
 * Synthesize a text reply into speech via the chatbot service.
 * `format: "ogg"` returns Opus-in-OGG (the only format WhatsApp accepts);
 * default "wav" works for Facebook/Instagram attachment URLs.
 */
export async function synthesizeSpeech(
  text: string,
  format: "wav" | "ogg" = "wav",
): Promise<Buffer> {
  const { data } = await chatbotClient.post(
    "/speak",
    { text, format },
    { responseType: "arraybuffer" },
  );

  return Buffer.from(data as ArrayBuffer);
}
