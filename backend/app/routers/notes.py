import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.database import get_db
from app.db.models import ManuscriptNote, get_utc_now
from app.models.schemas import (
    ManuscriptSaveRequest,
    ManuscriptResponse,
    ManuscriptListResponse
)

router = APIRouter(prefix="/api/notes", tags=["Writing Studio & Manuscripts"])

def _model_to_response(m: ManuscriptNote) -> ManuscriptResponse:
    citations = []
    if m.citations_json:
        try:
            citations = json.loads(m.citations_json)
        except Exception:
            citations = []

    return ManuscriptResponse(
        id=m.id,
        title=m.title or "Untitled Manuscript",
        mode=m.mode or "rich",
        content=m.content or "",
        latex_source=m.latex_source or "",
        associated_topic=m.associated_topic,
        citations=citations,
        word_count=m.word_count or 0,
        created_at=m.created_at.isoformat() if m.created_at else get_utc_now().isoformat(),
        updated_at=m.updated_at.isoformat() if m.updated_at else get_utc_now().isoformat()
    )

@router.get("", response_model=ManuscriptListResponse)
async def list_manuscripts(db: AsyncSession = Depends(get_db)):
    """List all saved manuscripts and research notes ordered by last updated."""
    stmt = select(ManuscriptNote).order_by(desc(ManuscriptNote.updated_at))
    res = await db.execute(stmt)
    records = res.scalars().all()
    items = [_model_to_response(m) for m in records]
    return ManuscriptListResponse(items=items, total=len(items))

@router.get("/{note_id}", response_model=ManuscriptResponse)
async def get_manuscript(note_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch a single manuscript by ID."""
    stmt = select(ManuscriptNote).where(ManuscriptNote.id == note_id)
    res = await db.execute(stmt)
    m = res.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Manuscript note not found.")
    return _model_to_response(m)

@router.post("", response_model=ManuscriptResponse)
async def save_manuscript(req: ManuscriptSaveRequest, db: AsyncSession = Depends(get_db)):
    """Create or update a manuscript draft with auto-save support."""
    note_id = req.id or str(uuid.uuid4())

    # Compute word count
    text_to_count = req.content if req.mode == "rich" else req.latex_source
    word_count = len(text_to_count.split()) if text_to_count else 0

    citations_json = json.dumps(req.citations) if req.citations else "[]"

    stmt = select(ManuscriptNote).where(ManuscriptNote.id == note_id)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()

    if existing:
        existing.title = req.title.strip() or "Untitled Manuscript"
        existing.mode = req.mode
        existing.content = req.content
        existing.latex_source = req.latex_source
        existing.associated_topic = req.associated_topic
        existing.citations_json = citations_json
        existing.word_count = word_count
        existing.updated_at = get_utc_now()
        await db.commit()
        await db.refresh(existing)
        return _model_to_response(existing)
    else:
        new_note = ManuscriptNote(
            id=note_id,
            title=req.title.strip() or "Untitled Manuscript",
            mode=req.mode,
            content=req.content,
            latex_source=req.latex_source,
            associated_topic=req.associated_topic,
            citations_json=citations_json,
            word_count=word_count,
            created_at=get_utc_now(),
            updated_at=get_utc_now()
        )
        db.add(new_note)
        await db.commit()
        await db.refresh(new_note)
        return _model_to_response(new_note)

@router.delete("/{note_id}")
async def delete_manuscript(note_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a manuscript draft from local storage."""
    stmt = select(ManuscriptNote).where(ManuscriptNote.id == note_id)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=404, detail="Manuscript note not found.")
    await db.delete(existing)
    await db.commit()
    return {"status": "success", "message": f"Manuscript {note_id} deleted."}
