import json
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, desc
import httpx
from app.db.database import AsyncSessionLocal
from app.db.models import FlowCanvas

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/flow", tags=["Flow Map Canvas Studio"])

class CreateCanvasRequest(BaseModel):
    title: str = "Untitled Flow Map"
    topic: str = "General Research"
    nodes_json: str = "[]"
    edges_json: str = "[]"
    viewport_json: str = '{"x": 0, "y": 0, "zoom": 1}'

class UpdateCanvasRequest(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    nodes_json: Optional[str] = None
    edges_json: Optional[str] = None
    viewport_json: Optional[str] = None

@router.get("/canvases")
async def list_canvases():
    """List all flow map canvases saved by the researcher."""
    async with AsyncSessionLocal() as session:
        stmt = select(FlowCanvas).order_by(desc(FlowCanvas.updated_at))
        result = await session.execute(stmt)
        canvases = result.scalars().all()
        return [
            {
                "id": c.id,
                "title": c.title,
                "topic": c.topic,
                "nodes_json": c.nodes_json,
                "edges_json": c.edges_json,
                "viewport_json": c.viewport_json,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None
            }
            for c in canvases
        ]

@router.post("/canvases")
async def create_canvas(req: CreateCanvasRequest):
    """Create a new dedicated canvas for a research topic."""
    async with AsyncSessionLocal() as session:
        new_canvas = FlowCanvas(
            title=req.title,
            topic=req.topic,
            nodes_json=req.nodes_json,
            edges_json=req.edges_json,
            viewport_json=req.viewport_json
        )
        session.add(new_canvas)
        await session.commit()
        await session.refresh(new_canvas)
        return {
            "id": new_canvas.id,
            "title": new_canvas.title,
            "topic": new_canvas.topic,
            "nodes_json": new_canvas.nodes_json,
            "edges_json": new_canvas.edges_json,
            "viewport_json": new_canvas.viewport_json,
            "created_at": new_canvas.created_at.isoformat() if new_canvas.created_at else None,
            "updated_at": new_canvas.updated_at.isoformat() if new_canvas.updated_at else None
        }

@router.put("/canvases/{canvas_id}")
async def update_canvas(canvas_id: str, req: UpdateCanvasRequest):
    """Update title, topic, nodes, edges, or camera viewport for a canvas."""
    async with AsyncSessionLocal() as session:
        stmt = select(FlowCanvas).where(FlowCanvas.id == canvas_id)
        result = await session.execute(stmt)
        canvas = result.scalar_one_or_none()
        if not canvas:
            raise HTTPException(status_code=404, detail="Canvas not found")

        if req.title is not None:
            canvas.title = req.title
        if req.topic is not None:
            canvas.topic = req.topic
        if req.nodes_json is not None:
            canvas.nodes_json = req.nodes_json
        if req.edges_json is not None:
            canvas.edges_json = req.edges_json
        if req.viewport_json is not None:
            canvas.viewport_json = req.viewport_json

        await session.commit()
        await session.refresh(canvas)
        return {
            "id": canvas.id,
            "title": canvas.title,
            "topic": canvas.topic,
            "nodes_json": canvas.nodes_json,
            "edges_json": canvas.edges_json,
            "viewport_json": canvas.viewport_json,
            "updated_at": canvas.updated_at.isoformat() if canvas.updated_at else None
        }

@router.delete("/canvases/{canvas_id}")
async def delete_canvas(canvas_id: str):
    """Delete a flow map canvas."""
    async with AsyncSessionLocal() as session:
        stmt = select(FlowCanvas).where(FlowCanvas.id == canvas_id)
        result = await session.execute(stmt)
        canvas = result.scalar_one_or_none()
        if not canvas:
            raise HTTPException(status_code=404, detail="Canvas not found")

        await session.delete(canvas)
        await session.commit()
        return {"status": "deleted", "id": canvas_id}

@router.get("/paper-trail")
async def get_paper_trail(doi: str = Query(..., description="DOI of the paper to parse citations for")):
    """
    Genuine Paper Trail: Query OpenAlex / Crossref to extract the real reference list
    and cited works of a paper, returning real academic records for the canvas.
    """
    clean_doi = doi.strip().replace("https://doi.org/", "").replace("http://doi.org/", "").strip()
    if not clean_doi:
        raise HTTPException(status_code=400, detail="Invalid DOI provided")

    headers = {"User-Agent": "LitBuddy/5.2 (mailto:team@litbuddy.ai; academic research assistant)"}
    
    # 1. Fetch work details from OpenAlex polite pool
    openalex_url = f"https://api.openalex.org/works/https://doi.org/{clean_doi}"
    cited_records = []
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(openalex_url, headers=headers)
            if resp.status_code == 200:
                work_data = resp.json()
                referenced_works = work_data.get("referenced_works", [])
                
                # Fetch metadata for the top 10-15 referenced works in a single batch
                if referenced_works:
                    top_refs = referenced_works[:12]
                    # Filter IDs to form batch query
                    clean_ids = "|".join([ref.split("/")[-1] for ref in top_refs])
                    batch_url = f"https://api.openalex.org/works?filter=openalex_id:{clean_ids}&per-page=15"
                    
                    batch_resp = await client.get(batch_url, headers=headers)
                    if batch_resp.status_code == 200:
                        batch_data = batch_resp.json()
                        for item in batch_data.get("results", []):
                            authors = [a.get("author", {}).get("display_name", "") for a in item.get("authorships", [])]
                            authors = [a for a in authors if a]
                            primary_loc = item.get("primary_location") or {}
                            pdf_url = primary_loc.get("pdf_url") or ""
                            source_name = primary_loc.get("source", {}).get("display_name", "") if primary_loc.get("source") else ""
                            
                            cited_records.append({
                                "id": item.get("id", "").split("/")[-1] or f"oa_{abs(hash(item.get('title')))}",
                                "title": item.get("title", "Untitled Reference"),
                                "authors": authors[:5],
                                "year": item.get("publication_year"),
                                "venue": source_name,
                                "doi": item.get("doi", "").replace("https://doi.org/", ""),
                                "pdf_url": pdf_url,
                                "cited_by_count": item.get("cited_by_count", 0),
                                "is_oa": item.get("open_access", {}).get("is_oa", False)
                            })
    except Exception as e:
        logger.warning(f"OpenAlex reference lookup error for DOI {clean_doi}: {e}")

    # Fallback to Crossref if OpenAlex did not yield results
    if not cited_records:
        try:
            crossref_url = f"https://api.crossref.org/works/{clean_doi}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(crossref_url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json().get("message", {})
                    references = data.get("reference", [])
                    for idx, ref in enumerate(references[:10]):
                        ref_doi = ref.get("DOI")
                        authors = [ref.get("author")] if ref.get("author") else []
                        cited_records.append({
                            "id": f"ref_{idx}_{clean_doi[-6:]}",
                            "title": ref.get("article-title") or ref.get("volume-title") or ref.get("unstructured", f"Reference {idx+1}"),
                            "authors": authors,
                            "year": int(ref.get("year")) if ref.get("year") and str(ref.get("year")).isdigit() else None,
                            "venue": ref.get("journal-title", ""),
                            "doi": ref_doi,
                            "pdf_url": "",
                            "cited_by_count": 0,
                            "is_oa": False
                        })
        except Exception as e:
            logger.warning(f"Crossref fallback lookup error for DOI {clean_doi}: {e}")

    return {
        "source_doi": clean_doi,
        "count": len(cited_records),
        "references": cited_records
    }
