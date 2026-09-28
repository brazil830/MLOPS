"""Kynora Backend — Configuration via Pydantic Settings."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+pg8000://postgres:postgres@localhost:5432/kynora"

    # JWT
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Google OAuth
    google_client_id: str = ""

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Emotion Model
    emotion_model: str = "SamLowe/roberta-base-go_emotions"

    # LLM — Google Gemini (get a free key at https://aistudio.google.com/apikey)
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
