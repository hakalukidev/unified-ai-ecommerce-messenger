from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_groq import ChatGroq
from groq import Groq
from dotenv import load_dotenv
import os
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import add_messages


class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",  # ✅ model দিতে হবে!
    temperature=0.7,
    api_key=os.getenv("GROQ_API_KEY")
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def speech_to_text(audio_bytes: bytes, filename: str = "audio.wav") -> str:
    """Voice recording ke text e convert kore (Groq Whisper)."""
    transcript = groq_client.audio.transcriptions.create(
        model="whisper-large-v3",
        file=(filename, audio_bytes),
        response_format="text",
    )
    return transcript if isinstance(transcript, str) else transcript.text


def text_to_speech(text: str, voice: str = "hannah") -> bytes:
    """Bot er text reply ke voice (wav bytes) e convert kore (Groq Orpheus TTS).

    playai-tts was decommissioned by Groq (Dec 2025); replaced with
    canopylabs/orpheus-v1-english. That model caps input at 200 characters,
    so longer replies get truncated for the voice note (the full text still
    goes out as the chat message).
    """
    response = groq_client.audio.speech.create(
        model="canopylabs/orpheus-v1-english",
        voice=voice,
        input=text[:200],
        response_format="wav",
    )
    return response.read()

SYSTEM_PROMPT = SystemMessage(content=(
    "Tumi shobshomoy Banglish e (Bangla kotha English letter diye lekha, jemon "
    "'kemon acho', 'ki khobor') reply korbe, jate user shohoje bujhte pare. "
    "Jodi user Bangla script e (আসল বাংলা হরফে) lekhe, tahole tumi o Bangla script e "
    "reply korbe. Kokhono khati English e reply dibe na, jodi na user nijei English e "
    "kotha bole. Reply shobshomoy ekdom short rakhbe — matro EK-টা sentence e, r "
    "kono extra explanation ba multiple point dibe na."
))


def chat_node(state: ChatState):
    messages = state['messages']
    if not messages or not isinstance(messages[0], SystemMessage):
        messages = [SYSTEM_PROMPT] + messages
    response = llm.invoke(messages)
    return {'messages': [response]}


checkpointer = MemorySaver()

graph = StateGraph(ChatState)
graph.add_node('chat_node', chat_node)
graph.add_edge(START, 'chat_node')
graph.add_edge('chat_node', END)

chatbot = graph.compile(checkpointer=checkpointer)
