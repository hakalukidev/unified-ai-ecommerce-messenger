"use client";

import type { Platform } from "@/types";
import { Loader2, Mic, Paperclip, Send, Square } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface Props {
  suggestions: string[];
  sending: boolean;
  platform: Platform;
  onSend: (text: string) => Promise<void>;
  onSendAudio: (blob: Blob) => Promise<void>;
}

const MAX_TEXTAREA_HEIGHT = 144;

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function ReplyComposer({
  suggestions,
  sending,
  platform,
  onSend,
  onSendAudio,
}: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const maxLength = platform === "whatsapp" ? 4096 : undefined;
  const nearLimit = maxLength ? text.length >= maxLength * 0.9 : false;

  const [isRecording, setIsRecording] = useState(false);
  const [sendingAudio, setSendingAudio] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [text]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const handleSend = async () => {
    if (!text.trim() || sending) {
      return;
    }

    await onSend(text);
    setText("");
  };

  const startRecording = async () => {
    setRecordError(null);

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecordError("Voice recording isn't supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration((current) => current + 1);
      }, 1000);
    } catch {
      setRecordError("Microphone access was denied.");
    }
  };

  const stopRecording = (send: boolean) => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsRecording(false);

      if (!send || chunksRef.current.length === 0) {
        chunksRef.current = [];
        return;
      }

      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      chunksRef.current = [];

      setSendingAudio(true);
      try {
        await onSendAudio(blob);
      } catch {
        setRecordError("Couldn't send the voice reply. Please try again.");
      } finally {
        setSendingAudio(false);
      }
    };

    recorder.stop();
  };

  return (
    <div className="border-t border-[var(--color-line)] bg-[rgba(255,255,255,0.74)] p-3">
      {recordError ? (
        <p className="mb-2 text-xs font-medium text-red-600">{recordError}</p>
      ) : null}

      {isRecording ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-red-700">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            Recording... {formatDuration(duration)}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => stopRecording(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Square size={12} />
              Stop &amp; send
            </button>
          </div>
        </div>
      ) : null}

      {suggestions.length > 0 && !isRecording ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setText(suggestion)}
              className="max-w-full rounded-2xl border border-[rgba(15,118,110,0.18)] bg-[var(--color-accent-soft)] px-3 py-1.5 text-left text-xs font-medium leading-5 text-[var(--color-accent-strong)] transition hover:border-[rgba(15,118,110,0.26)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2 rounded-[26px] border border-[var(--color-line)] bg-white px-2.5 py-2 shadow-[0_16px_40px_rgba(16,35,58,0.08)] transition focus-within:border-[var(--color-accent)] focus-within:ring-4 focus-within:ring-[rgba(15,118,110,0.12)]">
        <textarea
          ref={textareaRef}
          value={text}
          maxLength={maxLength}
          disabled={isRecording}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          rows={1}
          placeholder={
            isRecording ? "Recording a voice reply..." : "Write your reply..."
          }
          aria-label="Reply message"
          className="min-h-9 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-sm leading-6 text-[var(--color-foreground)] outline-none disabled:cursor-not-allowed"
        />

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled
            aria-label="Attach a file (not available yet)"
            title="Attachment sending is not available in the current backend yet."
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)] opacity-60"
          >
            <Paperclip size={16} />
          </button>

          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={isRecording || sendingAudio}
            aria-label="Record a voice reply"
            title="Record a voice reply"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sendingAudio ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Mic size={16} />
            )}
          </button>

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!text.trim() || sending || isRecording}
            aria-label="Send reply"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-muted)]">
        <span>
          <kbd className="rounded border border-[var(--color-line)] bg-white px-1.5 py-0.5 font-sans text-[10px]">
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd className="rounded border border-[var(--color-line)] bg-white px-1.5 py-0.5 font-sans text-[10px]">
            Shift+Enter
          </kbd>{" "}
          for a new line
        </span>
        {maxLength ? (
          <span className={nearLimit ? "font-semibold text-orange-600" : undefined}>
            {text.length}/{maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
}
