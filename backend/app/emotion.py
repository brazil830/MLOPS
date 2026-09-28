"""Kynora Backend — Emotion Detection Service with Ultra-Fast Hybrid Engine."""

from typing import Optional
import logging
import threading
import re

logger = logging.getLogger(__name__)

# Global model reference (loaded in background)
_classifier = None
_model_loading = False
_model_lock = threading.Lock()

# Mapping 27 GoEmotions classes to 8 visual states
EMOTION_TO_VISUAL = {
    "admiration": "happy",
    "amusement": "playful",
    "anger": "angry",
    "annoyance": "angry",
    "approval": "happy",
    "caring": "caring",
    "confusion": "neutral",
    "curiosity": "neutral",
    "desire": "romantic",
    "disappointment": "sad",
    "disapproval": "serious",
    "disgust": "angry",
    "embarrassment": "sad",
    "excitement": "playful",
    "fear": "sad",
    "gratitude": "happy",
    "grief": "sad",
    "joy": "happy",
    "love": "romantic",
    "nervousness": "sad",
    "optimism": "happy",
    "pride": "happy",
    "realization": "serious",
    "relief": "caring",
    "remorse": "sad",
    "sadness": "sad",
    "surprise": "playful",
    "neutral": "neutral",
}

# Fast keyword & pattern lexicon for sub-millisecond accurate classification
EMOTION_KEYWORDS = {
    "love": ["love", "adore", "heart", "darling", "sweetheart", "kiss", "hug", "babe", "baby", "miss you", "crush", "in love", "soulmate", "forever"],
    "joy": ["happy", "glad", "great", "awesome", "yay", "wonderful", "celebrate", "smile", "laugh", "cheerful", "blessed", "good day", "delighted", "super happy"],
    "gratitude": ["thank", "thanks", "grateful", "appreciate", "thankful", "blessing", "kind of you", "helped me"],
    "admiration": ["proud", "amazing", "hero", "inspiration", "inspire", "respect", "idol", "genius", "brilliant", "fantastic"],
    "excitement": ["excited", "omg", "hyped", "cannot wait", "can't wait", "hurray", "lets go", "let's go", "woohoo", "insane", "thrilled"],
    "amusement": ["haha", "lmao", "lol", "funny", "joke", "hilarious", "rofl", "hehe", "chaotic", "giggle"],
    "caring": ["take care", "hope you", "worry", "comfort", "safe", "hug", "nurture", "protect", "warm", "hold you", "here for you"],
    "sadness": ["sad", "depressed", "unhappy", "cry", "crying", "tears", "lonely", "broken", "hurts", "pain", "miss", "down", "gloomy", "heartbroken", "bad day"],
    "grief": ["lost", "passed away", "mourning", "died", "funeral", "grief", "agony"],
    "disappointment": ["disappointed", "let down", "failed", "ruined", "missed out", "bummed", "sucks"],
    "anger": ["angry", "mad", "furious", "hate", "pissed", "rage", "shut up", "idiot", "annoying", "annoyed", "frustrated", "irritated", "screaming"],
    "fear": ["scared", "afraid", "fear", "terrified", "panic", "anxious", "anxiety", "freaking out", "nervous", "dread"],
    "optimism": ["hope", "positive", "future", "better", "bright", "looking forward", "will work", "improve", "believe", "faith"],
    "curiosity": ["why", "how", "what if", "wonder", "curious", "explain", "tell me", "question", "interesting"],
    "confusion": ["confused", "what do you mean", "lost", "dont understand", "don't understand", "huh", "puzzled"],
}

# Emoji sentiment clues
EMOJI_MAP = {
    "❤️": "love", "💖": "love", "💕": "love", "😍": "love", "🥰": "love", "😘": "love",
    "😊": "joy", "😄": "joy", "😁": "joy", "✨": "joy", "🎉": "excitement", "🔥": "excitement",
    "😂": "amusement", "🤣": "amusement", "😉": "amusement", "😏": "amusement",
    "🥺": "sadness", "😢": "sadness", "😭": "sadness", "😞": "sadness", "😔": "sadness", "💔": "sadness",
    "😡": "anger", "🤬": "anger", "😤": "anger", "😠": "anger",
    "😨": "fear", "😱": "fear", "😰": "fear", "😟": "fear",
    "🤗": "caring", "🙏": "gratitude", "🙌": "admiration", "🌟": "optimism",
    "🤔": "curiosity", "🤨": "curiosity", "🤯": "surprise",
}


def _fast_emotion_classify(text: str) -> dict:
    """Instant heuristic emotion classification (< 0.5ms)."""
    text_lower = text.lower()
    
    # 1. Check direct emoji hints
    for emoji_char, emo_label in EMOJI_MAP.items():
        if emoji_char in text:
            visual = EMOTION_TO_VISUAL.get(emo_label, "neutral")
            return {
                "primary_emotion": emo_label,
                "visual_state": visual,
                "emotion_vector": {emo_label: 0.95, "neutral": 0.05},
            }

    # 2. Check keyword matches
    scored_emotions = {}
    for emo_label, kws in EMOTION_KEYWORDS.items():
        score = 0
        for kw in kws:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                score += 1
        if score > 0:
            scored_emotions[emo_label] = score

    if scored_emotions:
        top_emotion = max(scored_emotions.items(), key=lambda x: x[1])[0]
        visual = EMOTION_TO_VISUAL.get(top_emotion, "neutral")
        return {
            "primary_emotion": top_emotion,
            "visual_state": visual,
            "emotion_vector": {top_emotion: 0.85, "neutral": 0.15},
        }

    return {
        "primary_emotion": "neutral",
        "visual_state": "neutral",
        "emotion_vector": {"neutral": 1.0},
    }


def start_model_prewarm():
    """Start model loading in background thread on startup."""
    def _worker():
        global _classifier, _model_loading
        with _model_lock:
            if _classifier is not None or _model_loading:
                return
            _model_loading = True
        try:
            from transformers import pipeline
            from app.config import get_settings
            settings = get_settings()
            logger.info("Pre-warming emotion model in background...")
            clf = pipeline(
                "text-classification",
                model=settings.emotion_model,
                top_k=None,
                device=-1,
            )
            with _model_lock:
                _classifier = clf
            logger.info("Emotion model ready.")
        except Exception as e:
            logger.warning(f"Background emotion model loading skipped: {e}")
        finally:
            with _model_lock:
                _model_loading = False

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()


def analyze_emotion(text: str) -> dict:
    """
    Analyze the emotion of a text input with instant response guarantee.
    """
    global _classifier

    # Fast heuristic analysis first for instant sub-millisecond execution
    heuristic = _fast_emotion_classify(text)
    if heuristic["primary_emotion"] != "neutral":
        return heuristic

    # If neural model is loaded and ready, use it
    if _classifier is not None:
        try:
            results = _classifier(text[:256])
            scores = results[0] if results else []
            emotion_vector = {}
            top_emotion = "neutral"
            top_score = 0.0

            for item in scores:
                label = item["label"]
                score = item["score"]
                emotion_vector[label] = round(score, 4)
                if score > top_score:
                    top_score = score
                    top_emotion = label

            visual_state = EMOTION_TO_VISUAL.get(top_emotion, "neutral")
            return {
                "primary_emotion": top_emotion,
                "visual_state": visual_state,
                "emotion_vector": emotion_vector,
            }
        except Exception as e:
            logger.debug(f"Emotion model inference error: {e}")

    return heuristic

