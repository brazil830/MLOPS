"""Kynora Backend — Chat Routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Conversation, Message, Memory
from app.schemas import ChatRequest, ChatResponse, ChatHistoryResponse, MessageOut
from app.auth import get_current_user
from app.emotion import analyze_emotion
from app.persona import get_persona_response  # kept as scripted fallback
from app.llm import call_llm
from app.persona_profiles import build_full_system_prompt
from app.memory_engine import (
    load_user_profile,
    load_question_log,
    build_conversation_context,
    extract_and_store_facts,
    record_persona_questions,
)

router = APIRouter(prefix="/api/chat", tags=["Chat"])


def _get_or_create_conversation(db: Session, user_id: int, persona_id: str) -> Conversation:
    """Get existing conversation or create a new one for user-persona pair."""
    conversation = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id, Conversation.persona_id == persona_id)
        .first()
    )
    if not conversation:
        conversation = Conversation(user_id=user_id, persona_id=persona_id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    return conversation


def _get_last_persona_message(db: Session, conversation_id: int) -> str | None:
    """Return the content of the most recent persona message, or None."""
    msg = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
            Message.role == "persona",
        )
        .order_by(Message.created_at.desc())
        .first()
    )
    return msg.content if msg else None


@router.post("/send", response_model=ChatResponse)
def send_message(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to a persona and get an emotion-aware, memory-informed response."""
    conversation = _get_or_create_conversation(db, current_user.id, req.persona_id)

    # ------------------------------------------------------------------
    # 1. Check conversation state
    # ------------------------------------------------------------------
    existing_count = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .count()
    )
    is_first = existing_count == 0

    # ------------------------------------------------------------------
    # 2. Retrieve the last persona message (to detect Q→A pairs)
    # ------------------------------------------------------------------
    last_persona_msg = _get_last_persona_message(db, conversation.id)

    # ------------------------------------------------------------------
    # 3. Analyze emotion of user's message
    # ------------------------------------------------------------------
    emotion_result = analyze_emotion(req.message)

    # ------------------------------------------------------------------
    # 4. Extract and store user-provided facts BEFORE generating response
    #    (so the very next LLM call has the updated facts available)
    # ------------------------------------------------------------------
    extract_and_store_facts(
        db=db,
        user_id=current_user.id,
        conversation_id=conversation.id,
        user_message=req.message,
        assistant_previous_message=last_persona_msg,
    )
    db.flush()  # Persist extractions without committing yet

    # ------------------------------------------------------------------
    # 5. Save user message to DB
    # ------------------------------------------------------------------
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=req.message,
        emotion=emotion_result["primary_emotion"],
        emotion_vector=emotion_result["emotion_vector"],
    )
    db.add(user_msg)
    db.flush()

    # ------------------------------------------------------------------
    # 6. Build LLM context
    # ------------------------------------------------------------------
    user_profile = load_user_profile(db, current_user.id)
    question_log = load_question_log(db, conversation.id)
    conversation_history = build_conversation_context(
        db, conversation.id, max_turns=20
    )

    # Inject emotion context into the system prompt header
    emotion_note = (
        f"\nCURRENT MESSAGE EMOTION: {emotion_result['primary_emotion']} "
        f"(visual: {emotion_result['visual_state']}). "
        "Respond in a manner appropriate to this emotional context while staying fully in persona."
    )
    system_prompt = build_full_system_prompt(
        persona_id=req.persona_id,
        user_profile=user_profile,
        question_log=question_log,
    ) + emotion_note

    # For first-message greetings the conversation history is empty;
    # the LLM will naturally produce an introductory reply.

    # ------------------------------------------------------------------
    # 7. Generate response: LLM first, scripted engine as fallback
    # ------------------------------------------------------------------
    response_text = call_llm(
        system_prompt=system_prompt,
        conversation_history=conversation_history,
        user_message=req.message,
        max_output_tokens=350,
        temperature=0.87,
    )

    if not response_text:
        # Fallback to the scripted engine (works without an API key)
        memories = (
            db.query(Memory)
            .filter(
                Memory.user_id == current_user.id,
                Memory.persona_id == req.persona_id,
            )
            .order_by(Memory.created_at.desc())
            .limit(5)
            .all()
        )
        response_text = get_persona_response(
            persona_id=req.persona_id,
            user_message=req.message,
            emotion_result=emotion_result,
            memories=[m.summary for m in memories],
            is_first_message=is_first,
        )

    # ------------------------------------------------------------------
    # 8. Save persona response
    # ------------------------------------------------------------------
    persona_msg = Message(
        conversation_id=conversation.id,
        role="persona",
        content=response_text,
        emotion=emotion_result["visual_state"],
    )
    db.add(persona_msg)

    # ------------------------------------------------------------------
    # 9. Record questions asked in the persona's reply
    # ------------------------------------------------------------------
    record_persona_questions(db, conversation.id, response_text)

    # ------------------------------------------------------------------
    # 10. Legacy episodic memory (kept for backward compatibility)
    # ------------------------------------------------------------------
    total_messages = existing_count + 2
    if total_messages % 6 == 0:
        memory = Memory(
            user_id=current_user.id,
            persona_id=req.persona_id,
            summary=f"Talked about: {req.message[:100]}",
        )
        db.add(memory)

    db.commit()

    return ChatResponse(
        response=response_text,
        emotion=emotion_result["visual_state"],
        emotion_vector=emotion_result["emotion_vector"],
        persona_id=req.persona_id,
    )


@router.get("/history/{persona_id}", response_model=ChatHistoryResponse)
def get_chat_history(
    persona_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get conversation history for a specific persona."""
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.user_id == current_user.id,
            Conversation.persona_id == persona_id,
        )
        .first()
    )

    if not conversation:
        return ChatHistoryResponse(persona_id=persona_id, messages=[])

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return ChatHistoryResponse(
        persona_id=persona_id,
        messages=[
            MessageOut(
                id=m.id,
                role=m.role,
                content=m.content,
                emotion=m.emotion,
                timestamp=m.created_at,
            )
            for m in messages
        ],
    )
