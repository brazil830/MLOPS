"""
Kynora Backend — Main Application Entry Point.

FastAPI server with CORS, auth, chat, memory routes, and emotion analysis.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routes.auth_routes import router as auth_router
from app.routes.chat_routes import router as chat_router
from app.routes.memory_routes import router as memory_router

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create tables on startup."""
    settings = get_settings()
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready.")

    # Pre-warm emotion model in background daemon thread (non-blocking)
    try:
        from app.emotion import start_model_prewarm
        start_model_prewarm()
    except Exception as e:
        logger.warning(f"Could not initialize background prewarm: {e}")

    yield

    logger.info("Shutting down Kynora backend.")


# Create FastAPI app
app = FastAPI(
    title="Kynora API",
    description="Kynora AI Companion Backend — Emotion-aware, persona-driven conversations.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(memory_router)


@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "app": "Kynora",
        "status": "running",
        "version": "0.1.0",
    }


@app.get("/health")
def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "emotion_model": "lazy-loaded on first request",
    }
