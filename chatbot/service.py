"""FastAPI wrapper around backend.py's LangGraph chatbot.

Exposes the chatbot (and its voice helpers) as HTTP endpoints so the
Node/Express server can call it to generate AI auto-replies for
Messenger/Instagram/WhatsApp conversations.

Run: uvicorn service:app --host 0.0.0.0 --port 8001
"""

import os
import subprocess
import tempfile

import imageio_ffmpeg
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from backend import chatbot, speech_to_text, text_to_speech

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()


def wav_to_ogg_opus(wav_bytes: bytes) -> bytes:
    """Convert wav bytes to mono OGG/Opus — the only audio format WhatsApp accepts."""
    with tempfile.NamedTemporaryFile(suffix=".wav") as wav_file, tempfile.NamedTemporaryFile(
        suffix=".ogg"
    ) as ogg_file:
        wav_file.write(wav_bytes)
        wav_file.flush()

        subprocess.run(
            [
                FFMPEG_EXE,
                "-y",
                "-i",
                wav_file.name,
                "-ac",
                "1",
                "-c:a",
                "libopus",
                "-b:a",
                "32k",
                ogg_file.name,
            ],
            check=True,
            capture_output=True,
        )

        ogg_file.seek(0)
        return ogg_file.read()

load_dotenv()

app = FastAPI(title="unified-ai-ecommerce-messenger chatbot service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    conversation_id: str
    text: str


class ChatResponse(BaseModel):
    reply: str


class SpeakRequest(BaseModel):
    text: str
    voice: str | None = None
    format: str | None = None  # "wav" (default) or "ogg" (opus, for WhatsApp)


class TranscribeResponse(BaseModel):
    text: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    try:
        result = chatbot.invoke(
            {"messages": [HumanMessage(content=text)]},
            config={"configurable": {"thread_id": payload.conversation_id}},
        )
        reply = result["messages"][-1].content
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(error)) from error

    return ChatResponse(reply=reply)


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="empty audio file")

    try:
        text = speech_to_text(audio_bytes, filename=file.filename or "audio.wav")
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(error)) from error

    return TranscribeResponse(text=text)


@app.post("/speak")
def speak(payload: SpeakRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    try:
        audio_bytes = text_to_speech(
            text, voice=payload.voice or "hannah"
        )

        if payload.format == "ogg":
            audio_bytes = wav_to_ogg_opus(audio_bytes)
            return Response(content=audio_bytes, media_type="audio/ogg")
    except subprocess.CalledProcessError as error:
        raise HTTPException(
            status_code=502, detail=f"ffmpeg conversion failed: {error.stderr!r}"
        ) from error
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(error)) from error

    return Response(content=audio_bytes, media_type="audio/wav")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "service:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8001")),
        reload=True,
    )
