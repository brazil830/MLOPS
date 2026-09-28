"""Kynora Backend — SQLAlchemy ORM Models."""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for Google OAuth users
    auth_provider = Column(String(50), default="email")  # "email" or "google"
    google_id = Column(String(255), unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    profile_facts = relationship("UserProfile", back_populates="user", cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    persona_id = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan",
                            order_by="Message.created_at")
    question_tracks = relationship("QuestionTrack", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # "user" or "persona"
    content = Column(Text, nullable=False)
    emotion = Column(String(50), nullable=True)
    emotion_vector = Column(JSON, nullable=True)  # Full 27-class probabilities
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    persona_id = Column(String(50), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    relevance_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="memories")


class UserProfile(Base):
    """Persistent key-value store for user-provided profile facts.

    Shared across all personas (no persona scope) so that the user's name,
    studies, etc. are available in every conversation without re-asking.
    """
    __tablename__ = "user_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", "fact_key", name="uq_user_profile_fact"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    fact_key = Column(String(100), nullable=False)   # e.g. "preferred_name", "studies"
    fact_value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="profile_facts")


class QuestionTrack(Base):
    """Tracks questions the persona has asked per conversation.

    Prevents the persona from re-asking for information already provided.
    One row per topic per conversation; status transitions "unanswered" → "answered".
    """
    __tablename__ = "question_tracks"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    topic = Column(String(100), nullable=False)          # canonical topic key, e.g. "preferred_name"
    question_text = Column(String(500), nullable=True)   # the actual question text (truncated)
    status = Column(String(20), default="unanswered")    # "unanswered" | "answered"
    answer_summary = Column(String(500), nullable=True)  # user's answer (truncated)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="question_tracks")
