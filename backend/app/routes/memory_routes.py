"""Kynora Backend — Memory Routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Memory
from app.schemas import MemoriesResponse, MemoryOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/memory", tags=["Memory"])


@router.get("/{persona_id}", response_model=MemoriesResponse)
def get_memories(
    persona_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get relationship memories for a specific persona."""
    memories = (
        db.query(Memory)
        .filter(Memory.user_id == current_user.id, Memory.persona_id == persona_id)
        .order_by(Memory.created_at.desc())
        .limit(20)
        .all()
    )

    return MemoriesResponse(
        persona_id=persona_id,
        memories=[
            MemoryOut(
                id=m.id,
                summary=m.summary,
                created_at=m.created_at,
            )
            for m in memories
        ],
    )
