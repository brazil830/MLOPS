"""Kynora Backend — Pydantic Schemas for API validation."""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ---------- Auth Schemas ----------
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    auth_provider: str

    class Config:
        from_attributes = True


# ---------- Chat Schemas ----------
class ChatRequest(BaseModel):
    message: str
    persona_id: str


class ChatResponse(BaseModel):
    response: str
    emotion: str
    emotion_vector: Optional[dict] = None
    persona_id: str


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    emotion: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    persona_id: str
    messages: list[MessageOut]


# ---------- Memory Schemas ----------
class MemoryOut(BaseModel):
    id: int
    summary: str
    created_at: datetime

    class Config:
        from_attributes = True


class MemoriesResponse(BaseModel):
    persona_id: str
    memories: list[MemoryOut]
