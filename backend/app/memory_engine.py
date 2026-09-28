"""Kynora Backend — Memory Extraction & Retrieval Engine.

Responsibilities:
  1. Extract user-provided facts from conversation turns and persist them
     as structured UserProfile rows (one row per user per fact key).
  2. Track questions asked by the persona and answers given by the user;
     mark them resolved so the persona never re-asks answered questions.
  3. Build the context bundle (history + profile + question log) used by
     the LLM prompt builder on every request.

Design decisions:
  - Extraction is synchronous so the very next response already has the
    new facts available — no async lag that would cause immediate re-asking.
  - All extraction is regex + heuristic; no secondary LLM call required.
  - The question deduplication log uses topic-level matching so
    "what is your name?" and "may I know your name?" resolve the same topic.
  - Cross-persona profile facts (name, studies, etc.) are stored without
    a persona_id so they are visible to all personas.
"""

from __future__ import annotations

import logging
import re
from typing import List, Dict, Optional, Tuple

from sqlalchemy.orm import Session

from app.models import UserProfile, QuestionTrack, Message

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Topic extraction patterns
# ---------------------------------------------------------------------------

# Maps a canonical topic key → list of regex patterns that detect the fact
# in user messages.
PROFILE_EXTRACT_PATTERNS: List[Tuple[str, List[str]]] = [
    ("preferred_name", [
        r"\bmy name is\s+(\w+)",
        r"(?:call me|i(?:'m| am) called)\s+(\w+)",
        r"(?:i prefer to be called|prefer calling me)\s+(\w+)",
        r"actually,?\s+(?:my name is|call me)\s+(\w+)",
    ]),
    ("age", [
        r"i(?:'m| am)\s+(\d{1,2})\s+years?\s+old",
        r"my age is\s+(\d{1,2})",
        r"i(?:'m| am)\s+(\d{1,2})\b",
    ]),
    ("studies", [
        r"i(?:'m| am)?\s+studying\s+([\w\s]+?)(?:\.|,|$)",
        r"i(?:'m| am)\s+(?:a\s+)?(\w[\w\s]+?)\s+(?:student|major)",
        r"my (?:course|degree|major|subject) is\s+([\w\s]+?)(?:\.|,|$)",
        r"i(?:'m doing|'m pursuing)\s+([\w\s]+?)(?:\.|,|$)",
        r"studying\s+([\w\s]+?)(?:\s+at|\s+in|\.|,|$)",
    ]),
    ("college", [
        r"(?:at|in|from)\s+([\w\s]+?)\s+(?:college|university|institute|school)\b",
        r"my college(?:\s+is)?\s+([\w\s]+?)(?:\.|,|$)",
    ]),
    ("occupation", [
        r"i(?:'m| am)\s+(?:a|an)\s+([\w\s]+?)(?:\s+at|\s+in|\.|,|$)",
        r"i work (?:as|at)\s+([\w\s]+?)(?:\.|,|$)",
        r"my job is\s+([\w\s]+?)(?:\.|,|$)",
    ]),
    ("favorite_color", [
        r"(?:my\s+)?favorite\s+color\s+is\s+(\w+)",
        r"i\s+love\s+the\s+color\s+(\w+)",
        r"i\s+like\s+(\w+)\s+(?:color|colour)",
    ]),
    ("hobbies", [
        r"i\s+(?:love|enjoy|like)\s+([\w\s,]+?)(?:\s+(?:a lot|very much|when|and)|\.|\!|$)",
        r"my hobby(?:\s+is)?\s+([\w\s]+?)(?:\.|,|$)",
        r"in my free time i\s+([\w\s]+?)(?:\.|,|$)",
    ]),
    ("location", [
        r"i(?:'m| am)\s+from\s+([\w\s,]+?)(?:\.|,|$)",
        r"i\s+live\s+in\s+([\w\s]+?)(?:\.|,|$)",
        r"i\s+stay\s+in\s+([\w\s]+?)(?:\.|,|$)",
    ]),
    ("goals", [
        r"(?:my goal|my dream|i want to)\s+([\w\s]+?)(?:\.|,|$)",
        r"i(?:'m| am)\s+planning\s+to\s+([\w\s]+?)(?:\.|,|$)",
    ]),
]


# Maps topic → list of patterns in ASSISTANT messages that indicate a question
# about that topic. Used to detect when the persona asked about something.
QUESTION_DETECT_PATTERNS: Dict[str, List[str]] = {
    "preferred_name": [
        r"what(?:'s| is) your name",
        r"(?:may i|can i|could i)\s+know your name",
        r"what (?:should|can) i call you",
        r"how (?:should|can) i (?:address|call) you",
    ],
    "studies": [
        r"what are you studying",
        r"what(?:'s| is) your (?:course|degree|major|subject|field|stream)",
        r"which (?:course|degree|major|field|stream) are you",
        r"what (?:course|degree|major|field|stream) are you",
        r"what do you study",
        r"what (?:field|stream) are you",
        r"which (?:college|course) are you (?:doing|pursuing|taking|enrolled in)",
        r"what are you (?:doing|pursuing|enrolled in)",
    ],
    "college": [
        r"which college",
        r"what (?:university|institute|school) are you",
        r"where are you studying",
    ],
    "age": [
        r"how old are you",
        r"what(?:'s| is) your age",
        r"may i ask your age",
    ],
    "occupation": [
        r"what do you do",
        r"what(?:'s| is) your (?:job|work|profession|occupation)",
        r"where do you work",
        r"are you working",
    ],
    "location": [
        r"where are you from",
        r"where do you live",
        r"which city",
        r"where are you based",
    ],
    "hobbies": [
        r"what are your (?:hobbies|interests)",
        r"what do you (?:enjoy|like) doing",
        r"what(?:'s| is) your hobby",
        r"what do you do for fun",
    ],
    "goals": [
        r"what(?:'s| is) your goal",
        r"what are you (?:aiming|working) for",
        r"what do you want to (?:be|achieve)",
    ],
    "favorite_color": [
        r"(?:what(?:'s| is) your )?favorite (?:color|colour)",
        r"which color do you like",
    ],
}


# ---------------------------------------------------------------------------
# Profile extraction helpers
# ---------------------------------------------------------------------------

def _extract_profile_facts(text: str) -> Dict[str, str]:
    """
    Parse a user message and return a dict of {topic: extracted_value}.
    Only returns facts that can be cleanly extracted; never infers.
    """
    text_lower = text.lower().strip()
    found: Dict[str, str] = {}

    for topic, patterns in PROFILE_EXTRACT_PATTERNS:
        for pat in patterns:
            m = re.search(pat, text_lower)
            if m:
                value = m.group(1).strip().title()
                # Sanity check: must be non-empty and ≤ 80 chars
                if 1 <= len(value) <= 80:
                    found[topic] = value
                break  # First matching pattern wins for this topic

    return found


def _topic_asked_in_text(text: str, topic: str) -> bool:
    """Return True if the text contains a question about the given topic."""
    text_lower = text.lower()
    for pat in QUESTION_DETECT_PATTERNS.get(topic, []):
        if re.search(pat, text_lower):
            return True
    return False


# ---------------------------------------------------------------------------
# Database operations
# ---------------------------------------------------------------------------

def load_user_profile(db: Session, user_id: int) -> Dict[str, str]:
    """
    Return all persisted user-profile facts for the user as {key: value}.
    Shared across all personas (profile facts have no persona scope).
    """
    rows = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == user_id)
        .all()
    )
    return {r.fact_key: r.fact_value for r in rows}


def upsert_profile_fact(
    db: Session,
    user_id: int,
    key: str,
    value: str,
) -> None:
    """
    Insert or update a single user-profile fact.
    If the value is unchanged the row is not written.
    """
    existing = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == user_id, UserProfile.fact_key == key)
        .first()
    )
    if existing:
        if existing.fact_value == value:
            return  # No change
        existing.fact_value = value
    else:
        db.add(UserProfile(user_id=user_id, fact_key=key, fact_value=value))


def load_question_log(
    db: Session,
    conversation_id: int,
) -> List[Dict]:
    """
    Return the question/answer tracking log for a conversation.
    Each entry: {topic, question, status, answer}
    """
    rows = (
        db.query(QuestionTrack)
        .filter(QuestionTrack.conversation_id == conversation_id)
        .all()
    )
    return [
        {
            "topic": r.topic,
            "question": r.question_text,
            "status": r.status,
            "answer": r.answer_summary or "",
        }
        for r in rows
    ]


def record_question(
    db: Session,
    conversation_id: int,
    topic: str,
    question_text: str,
) -> None:
    """
    Record that the persona asked about a topic. Idempotent per topic
    per conversation (does not create duplicates for the same topic).
    """
    existing = (
        db.query(QuestionTrack)
        .filter(
            QuestionTrack.conversation_id == conversation_id,
            QuestionTrack.topic == topic,
        )
        .first()
    )
    if not existing:
        db.add(
            QuestionTrack(
                conversation_id=conversation_id,
                topic=topic,
                question_text=question_text[:500],
                status="unanswered",
            )
        )


def mark_question_answered(
    db: Session,
    conversation_id: int,
    topic: str,
    answer_summary: str,
) -> None:
    """Mark the open question on this topic as answered."""
    existing = (
        db.query(QuestionTrack)
        .filter(
            QuestionTrack.conversation_id == conversation_id,
            QuestionTrack.topic == topic,
        )
        .first()
    )
    if existing and existing.status == "unanswered":
        existing.status = "answered"
        existing.answer_summary = answer_summary[:500]


# ---------------------------------------------------------------------------
# Main pipeline functions
# ---------------------------------------------------------------------------

def extract_and_store_facts(
    db: Session,
    user_id: int,
    conversation_id: int,
    user_message: str,
    assistant_previous_message: Optional[str],
) -> None:
    """
    Called after saving the user's message.

    1. Extract profile facts from the user's message.
    2. Upsert them into UserProfile.
    3. If a question was asked in the previous assistant message and the user
       answered it, mark it as answered in QuestionTrack.

    All writes are accumulated; the caller must db.commit().
    """
    # Step 1: extract facts
    new_facts = _extract_profile_facts(user_message)

    for key, value in new_facts.items():
        upsert_profile_fact(db, user_id, key, value)

        # If there was an open question about this topic, mark it answered
        if assistant_previous_message and _topic_asked_in_text(
            assistant_previous_message, key
        ):
            mark_question_answered(db, conversation_id, key, value)


def record_persona_questions(
    db: Session,
    conversation_id: int,
    assistant_message: str,
) -> None:
    """
    Scan the persona's reply for questions about known topics and log them.
    All writes are accumulated; the caller must db.commit().
    """
    for topic in QUESTION_DETECT_PATTERNS:
        if _topic_asked_in_text(assistant_message, topic):
            record_question(db, conversation_id, topic, assistant_message[:200])


def build_conversation_context(
    db: Session,
    conversation_id: int,
    max_turns: int = 20,
) -> List[Dict[str, str]]:
    """
    Return the most recent `max_turns` conversation turns as a list of
    {"role": "user"/"model", "content": str} dicts, oldest first.

    The current user message is NOT included — it is appended separately by
    the LLM caller.
    """
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(max_turns * 2)  # user + persona pairs
        .all()
    )
    # Reverse to chronological order
    messages = list(reversed(messages))

    history = []
    for m in messages:
        role = "user" if m.role == "user" else "model"
        history.append({"role": role, "content": m.content})

    return history
