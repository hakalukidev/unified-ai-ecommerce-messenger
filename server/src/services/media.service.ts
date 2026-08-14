import { randomUUID } from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import axios from "axios";

const graphVersion = process.env.META_GRAPH_VERSION ?? "v23.0";

export const mediaDir = path.join(__dirname, "../../public/media");

if (!existsSync(mediaDir)) {
  mkdirSync(mediaDir, { recursive: true });
}

/** Download a Facebook/Instagram attachment (the payload URL is already public). */
export async function downloadFromUrl(url: string): Promise<Buffer> {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: "arraybuffer",
  });

  return Buffer.from(response.data);
}

/** WhatsApp media is private: resolve the media id to a URL, then fetch it with the page token. */
export async function downloadWhatsAppMedia(
  mediaId: string,
  accessToken: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const { data: meta } = await axios.get<{ url: string; mime_type: string }>(
    `https://graph.facebook.com/${graphVersion}/${mediaId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const response = await axios.get<ArrayBuffer>(meta.url, {
    responseType: "arraybuffer",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return { buffer: Buffer.from(response.data), mimeType: meta.mime_type };
}

/**
 * Save generated speech to /public/media and return a URL that's reachable
 * from Meta's servers (via SERVER_URL, e.g. the ngrok tunnel).
 */
export function saveAudioReply(buffer: Buffer): string {
  const filename = `${randomUUID()}.wav`;
  writeFileSync(path.join(mediaDir, filename), buffer);

  const base = (process.env.SERVER_URL ?? "http://localhost:5000").replace(
    /\/$/,
    "",
  );

  return `${base}/media/${filename}`;
}
