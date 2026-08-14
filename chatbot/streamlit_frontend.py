import streamlit as st
from langchain_core.messages import HumanMessage, AIMessage
import uuid
from datetime import datetime

from backend import chatbot, speech_to_text, text_to_speech

# ==================== FRONTEND UI ====================

st.set_page_config(
    page_title="AI Chatbot",
    page_icon="🤖",
    layout="wide"
)

# ---------- Chat UI theme ----------
st.markdown("""
<style>
html, body, [data-testid="stAppViewContainer"], [data-testid="stApp"] {
    background-color: #212121 !important;
    color: #ececec !important;
}
[data-testid="stHeader"] {
    background-color: #212121 !important;
    border-bottom: 1px solid #2a2a2a;
}
[data-testid="stMainMenu"], [data-testid="stToolbar"], [data-testid="stDecoration"], footer, #MainMenu {
    display: none !important;
}

/* Sidebar */
[data-testid="stSidebar"] {
    background-color: #171717 !important;
    border-right: 1px solid #2a2a2a;
}
[data-testid="stSidebar"] * { color: #ececec; }
[data-testid="stSidebarContent"] { padding: 0.75rem 0.5rem; }
[data-testid="stSidebar"] h1 { font-size: 1.05rem !important; padding: 0.3rem 0.2rem 0.8rem; }
[data-testid="stSidebar"] button {
    background-color: transparent !important;
    border: 1px solid transparent !important;
    color: #ececec !important;
    text-align: left !important;
    border-radius: 10px !important;
    font-size: 0.88rem !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background-color .15s ease;
}
[data-testid="stSidebar"] button:hover {
    background-color: #2a2a2a !important;
}
[data-testid="stSidebar"] [data-testid="stBaseButton-primary"] {
    background-color: #2f2f2f !important;
    border-color: #3a3a3a !important;
}
[data-testid="stSidebar"] hr { border-color: #2a2a2a; margin: 0.35rem 0; }
[data-testid="stSidebar"] [data-testid="stCaptionContainer"] {
    color: #8e8e8e !important;
    font-size: 0.72rem !important;
}

/* Main chat column */
[data-testid="stMainBlockContainer"] {
    max-width: 48rem;
    margin: 0 auto;
    padding-top: 1.5rem;
    padding-bottom: 9rem;
}

/* Chat messages */
[data-testid="stChatMessage"] {
    background: transparent !important;
    border: none !important;
    padding: 0.6rem 0 !important;
    gap: 0.75rem;
}
[data-testid="stChatMessageAvatarUser"] { display: none !important; }
[data-testid="stChatMessage"]:has([data-testid="stChatMessageAvatarUser"]) {
    justify-content: flex-end;
}
[data-testid="stChatMessage"]:has([data-testid="stChatMessageAvatarUser"]) [data-testid="stChatMessageContent"] {
    background-color: #2f2f2f;
    border-radius: 20px;
    padding: 0.6rem 1rem;
    max-width: 75%;
    margin-left: auto;
}
[data-testid="stChatMessageAvatarAssistant"] {
    background: linear-gradient(135deg, #10a37f, #1a7f64) !important;
}
[data-testid="stChatMessage"]:has([data-testid="stChatMessageAvatarAssistant"]) [data-testid="stChatMessageContent"] {
    max-width: 100%;
    padding-top: 0.15rem;
}

/* Chat input */
[data-testid="stBottom"] > div {
    background-color: #212121 !important;
}
[data-testid="stBottomBlockContainer"] {
    background: linear-gradient(180deg, rgba(33,33,33,0) 0%, #212121 45%);
    max-width: 48rem;
    margin: 0 auto;
}
[data-testid="stChatInput"] {
    background-color: #2f2f2f !important;
    border: 1px solid #3a3a3a !important;
    border-radius: 26px !important;
    box-shadow: 0 4px 14px rgba(0,0,0,0.3);
}
[data-testid="stChatInput"] * {
    background-color: transparent !important;
}
[data-testid="stChatInputTextArea"] {
    color: #ececec !important;
}
[data-testid="stChatInputTextArea"]::placeholder {
    color: #8e8e8e !important;
}
[data-testid="stChatInputSubmitButton"] {
    background-color: #ececec !important;
    border-radius: 50% !important;
}

/* Alerts / errors */
[data-testid="stAlert"] {
    background-color: #2a2a2a !important;
    border: 1px solid #3a3a3a !important;
    border-radius: 12px !important;
}
</style>
""", unsafe_allow_html=True)

# Initialize session state for multiple threads
if "threads" not in st.session_state:
    # Format: {thread_id: {"name": "Chat 1", "messages": [], "created_at": timestamp}}
    st.session_state.threads = {}

if "current_thread_id" not in st.session_state:
    # Create first thread
    first_thread_id = str(uuid.uuid4())
    st.session_state.threads[first_thread_id] = {
        "name": "New Chat",
        "messages": [],
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    st.session_state.current_thread_id = first_thread_id

# ==================== SIDEBAR ====================

with st.sidebar:
    st.title("Khoroch Assistant")

    # New Chat button
    if st.button("✏️  New chat", use_container_width=True):
        new_thread_id = str(uuid.uuid4())
        st.session_state.threads[new_thread_id] = {
            "name": "New Chat",
            "messages": [],
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M")
        }
        st.session_state.current_thread_id = new_thread_id
        st.rerun()

    st.divider()

    # Display all threads
    for thread_id, thread_data in st.session_state.threads.items():
        is_current = thread_id == st.session_state.current_thread_id

        col1, col2 = st.columns([5, 1])

        with col1:
            if st.button(
                thread_data['name'],
                key=f"thread_{thread_id}",
                use_container_width=True,
                type="primary" if is_current else "secondary"
            ):
                if not is_current:
                    st.session_state.current_thread_id = thread_id
                    st.rerun()

        with col2:
            # Delete thread button (except if it's the only one)
            if len(st.session_state.threads) > 1:
                if st.button("✕", key=f"delete_{thread_id}"):
                    # Don't delete if it's the current thread
                    if thread_id == st.session_state.current_thread_id:
                        # Switch to first available thread
                        other_threads = [tid for tid in st.session_state.threads.keys() if tid != thread_id]
                        if other_threads:
                            st.session_state.current_thread_id = other_threads[0]
                    del st.session_state.threads[thread_id]
                    st.rerun()

    st.divider()

    # Clear all chats option
    if len(st.session_state.threads) > 0:
        if st.button("🗑️  Clear all chats", use_container_width=True):
            # Keep only one new thread
            new_thread_id = str(uuid.uuid4())
            st.session_state.threads = {
                new_thread_id: {
                    "name": "New Chat",
                    "messages": [],
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M")
                }
            }
            st.session_state.current_thread_id = new_thread_id
            st.rerun()

    st.divider()
    voice_reply_enabled = st.checkbox("🔊 Voice e o reply shunbo", value=True)

# ==================== MAIN CHAT AREA ====================

# Get current thread messages
current_thread = st.session_state.threads[st.session_state.current_thread_id]
messages = current_thread["messages"]

st.markdown(
    f'<div style="text-align:center;font-size:0.95rem;color:#b4b4b4;'
    f'padding-bottom:1rem;">{current_thread["name"]}</div>',
    unsafe_allow_html=True,
)

# Display chat messages
chat_container = st.container()

with chat_container:
    if not messages:
        st.markdown(
            """
            <div style="display:flex;flex-direction:column;align-items:center;
                        justify-content:center;height:48vh;text-align:center;">
                <div style="font-size:2.1rem;font-weight:600;color:#ececec;margin-bottom:0.5rem;">
                    How can I help you today?
                </div>
                <div style="color:#8e8e8e;font-size:0.95rem;">
                    Ask me anything to get started.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        for message in messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])

# Chat input at the bottom (mic icon built in)
chat_value = st.chat_input("Message the assistant...", accept_audio=True)

prompt = None
if chat_value is not None:
    if chat_value.audio is not None:
        with st.spinner("Voice ta bujhtesi..."):
            try:
                prompt = speech_to_text(chat_value.audio.getvalue())
            except Exception as e:
                st.error(f"❌ Voice bujhte parlam na: {e}")
    elif chat_value.text:
        prompt = chat_value.text

if prompt:
    # Add user message to current thread
    messages.append({"role": "user", "content": prompt})

    # Display user message
    with st.chat_message("user"):
        st.markdown(prompt)

    # Get bot response
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            try:
                # Prepare the state with conversation history
                langchain_messages = []
                for msg in messages:
                    if msg["role"] == "user":
                        langchain_messages.append(HumanMessage(content=msg["content"]))
                    elif msg["role"] == "assistant":
                        langchain_messages.append(AIMessage(content=msg["content"]))

                # Invoke the chatbot
                config = {"configurable": {"thread_id": st.session_state.current_thread_id}}
                state = {'messages': langchain_messages}

                response = chatbot.invoke(state, config=config)
                bot_response = response['messages'][-1].content

                # Display bot response
                st.markdown(bot_response)

                # Speak the bot response back (voice reply)
                if voice_reply_enabled:
                    try:
                        speech_bytes = text_to_speech(bot_response)
                        st.audio(speech_bytes, format="audio/wav", autoplay=True)
                    except Exception as e:
                        st.warning(f"🔇 Voice reply banate parlam na: {e}")

                # Add bot response to thread
                messages.append({"role": "assistant", "content": bot_response})

                # Auto-update thread name if it's still "New Chat" and has messages
                if current_thread["name"] == "New Chat" and len(messages) >= 2:
                    # Use first few words of first user message as title
                    first_user_msg = next((msg["content"] for msg in messages if msg["role"] == "user"), "")
                    if first_user_msg:
                        words = first_user_msg.split()[:5]
                        current_thread["name"] = " ".join(words) + "..."

            except Exception as e:
                error_msg = f"❌ Error: {str(e)}"
                st.error(error_msg)
                messages.append({"role": "assistant", "content": error_msg})

    # Force rerun to update UI
    st.rerun()
