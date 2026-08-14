import { randomUUID } from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { spawn } from "child_process";
import axios from "axios";
import ffmpegPath from "ffmpeg-static";

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
 * Save an audio buffer to /public/media and return a URL that's reachable
 * from Meta's servers (via SERVER_URL, e.g. the ngrok tunnel).
 */
export function saveAudioReply(buffer: Buffer, extension = "wav"): string {
  const filename = `${randomUUID()}.${extension}`;
  writeFileSync(path.join(mediaDir, filename), buffer);

  const base = (process.env.SERVER_URL ?? "http://localhost:5000").replace(
    /\/$/,
    "",
  );

  return `${base}/media/${filename}`;
}

/**
 * Transcode an audio buffer with ffmpeg (piped through stdin/stdout, no temp
 * files). Used to turn a browser voice recording (webm/opus) into the
 * formats each platform's Send API actually accepts.
 */
export function transcodeAudio(
  inputBuffer: Buffer,
  outputArgs: string[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg binary not found (ffmpeg-static)."));
      return;
    }

    const ffmpeg = spawn(ffmpegPath, [
      "-y",
      "-i",
      "pipe:0",
      ...outputArgs,
      "pipe:1",
    ]);

    const chunks: Buffer[] = [];
    let stderr = "";

    ffmpeg.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });

    ffmpeg.stdin.write(inputBuffer);
    ffmpeg.stdin.end();
  });
}

/** Transcode a browser recording (webm/opus) into an OGG/Opus file for WhatsApp. */
export const toOggOpus = (buffer: Buffer) =>
  transcodeAudio(buffer, ["-c:a", "libopus", "-ac", "1", "-f", "ogg"]);

/** Transcode a browser recording into mp3 for the Facebook/Instagram Send API. */
export const toMp3 = (buffer: Buffer) =>
  transcodeAudio(buffer, ["-c:a", "libmp3lame", "-b:a", "64k", "-f", "mp3"]);
