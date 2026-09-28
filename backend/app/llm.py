"""Kynora Backend — LLM Client (Google Gemini).

Wraps the Gemini generative-language REST API.
Falls back to the legacy scripted engine if the API key is absent or the
call fails, so the application always returns a response.
"""

from __future__ import annotations

import logging
import re
from typing import List, Dict, Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
GEMINI_MODEL = "gemini-3.6-flash"


def _build_gemini_url() -> str:
    settings = get_settings()
    return (
        f"{GEMINI_API_BASE}/{GEMINI_MODEL}:generateContent"
        f"?key={settings.gemini_api_key}"
    )


def _strip_markdown_artifacts(text: str) -> str:
    """Remove residual markdown that leaks into conversational replies."""
    text = re.sub(r"\*{1,3}([^*]+)\*{1,3}", r"\1", text)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
    return text.strip()


def call_llm(
    system_prompt: str,
    conversation_history: List[Dict[str, str]],
    user_message: str,
    max_output_tokens: int = 350,
    temperature: float = 0.85,
) -> Optional[str]:
    """
    Call the Gemini API with the given system prompt and conversation history.

    Parameters
    ----------
    system_prompt:        The persona system instruction.
    conversation_history: List of {"role": "user"/"model", "content": str} dicts,
                          oldest first, NOT including the current user message.
    user_message:         The current user turn.
    max_output_tokens:    Cap on response length.
    temperature:          Sampling temperature.

    Returns
    -------
    The assistant reply as a plain string, or None on failure.
    """
    settings = get_settings()
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not set — skipping LLM call.")
        return None

    # Build Gemini `contents` array: interleaved user / model turns
    contents = []
    for turn in conversation_history:
        role = "user" if turn["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": turn["content"]}]})

    # Append the current user message
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
            "topP": 0.95,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_ONLY_HIGH",
            },
        ],
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(_build_gemini_url(), json=payload)
            resp.raise_for_status()
            data = resp.json()

        candidates = data.get("candidates", [])
        if not candidates:
            logger.warning("Gemini returned no candidates: %s", data)
            return None

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            return None

        raw_text = parts[0].get("text", "").strip()
        return _strip_markdown_artifacts(raw_text) if raw_text else None

    except httpx.HTTPStatusError as exc:
        logger.error(
            "Gemini HTTP error %s: %s",
            exc.response.status_code,
            exc.response.text[:300],
        )
        return None
    except Exception as exc:
        logger.error("Gemini call failed: %s", exc)
        return None
