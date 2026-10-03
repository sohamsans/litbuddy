import os
import json
import re
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse, Response
from pydantic import BaseModel
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.db.models import PaperDocumentVault, DiscoveryCache, PaperCache
from app.services.bulk_download_service import generate_bibtex_entry

router = APIRouter(prefix="/api/references", tags=["Master Reference Manager"])

class ExportReferencesRequest(BaseModel):
    paper_ids: Optional[List[str]] = None
    format: str = "bibtex"  # "bibtex" or "ris"

def generate_ris_entry(paper: dict) -> str:
    """Format paper dictionary into standard Research Information Systems (RIS) format."""
    lines = ["TY  - JOUR"]
    lines.append(f"TI  - {paper.get('title', 'Untitled')}")
    for author in paper.get("authors", []):
        lines.append(f"AU  - {author}")
    if paper.get("year"):
        lines.append(f"PY  - {paper.get('year')}///")
    if paper.get("venue"):
        lines.append(f"JO  - {paper.get('venue')}")
    if paper.get("doi"):
        lines.append(f"DO  - {paper.get('doi')}")
    if paper.get("abstract"):
        lines.append(f"AB  - {paper.get('abstract')}")
    lines.append("ER  - \n")
    return "\n".join(lines)

@router.get("/all")
async def get_all_references(
    search: Optional[str] = Query(None, description="Search query across titles and authors"),
    tag: Optional[str] = Query(None, description="Filter by tag or category"),
    year_min: Optional[int] = Query(None),
    year_max: Optional[int] = Query(None),
    only_vaulted: bool = Query(False),
    only_synthesized: bool = Query(False)
):
    """
    Retrieve all papers across the entire LitBuddy ecosystem (Vaulted, Synthesized, and Pooled).
    Deduplicates by normalized DOI or Title.
    """
    merged_papers = {}

    async with AsyncSessionLocal() as session:
        # 1. Load Vaulted Papers
        stmt_vault = select(PaperDocumentVault)
        res_v = await session.execute(stmt_vault)
        vault_records = res_v.scalars().all()
        for v in vault_records:
            key = (v.doi.lower().strip() if v.doi else v.title.lower().strip())
            file_exists = os.path.exists(v.file_path) if v.file_path else False
            merged_papers[key] = {
                "id": v.id,
                "title": v.title,
                "authors": [],
                "year": None,
                "venue": "",
                "doi": v.doi,
                "doi_link": f"https://doi.org/{v.doi}" if v.doi else "",
                "pdf_url": "",
                "pdf_downloaded": file_exists,
                "is_vaulted": file_exists,
                "vault_id": v.id,
                "file_size_bytes": v.file_size_bytes,
                "source": v.source_resolved or "vault",
                "is_synthesized": False,
                "relevance_score": 5,
                "core_problem": "",
                "methodology": "",
                "key_findings": "",
                "research_gaps": "",
                "abstract": "",
                "has_figures": bool(v.figures_json),
                "created_at": v.created_at.isoformat() if v.created_at else None
            }

        # 2. Load Synthesized Papers Cache
        stmt_synth = select(PaperCache)
        res_s = await session.execute(stmt_synth)
        synth_records = res_s.scalars().all()
        for s in synth_records:
            key = (s.doi.lower().strip() if s.doi else s.title.lower().strip())
            authors = json.loads(s.authors_json) if s.authors_json else []
            if key in merged_papers:
                merged_papers[key].update({
                    "authors": authors,
                    "year": s.year,
                    "venue": s.venue or "",
                    "is_synthesized": True,
                    "relevance_score": s.relevance_score or 4,
                    "core_problem": s.core_problem or "",
                    "methodology": s.methodology or "",
                    "key_findings": s.key_findings or "",
                    "research_gaps": s.research_gaps or ""
                })
            else:
                merged_papers[key] = {
                    "id": s.cache_key,
                    "title": s.title,
                    "authors": authors,
                    "year": s.year,
                    "venue": s.venue or "",
                    "doi": s.doi,
                    "doi_link": f"https://doi.org/{s.doi}" if s.doi else "",
                    "pdf_url": s.pdf_url or "",
                    "pdf_downloaded": False,
                    "is_vaulted": False,
                    "vault_id": None,
                    "file_size_bytes": 0,
                    "source": s.source or "cache",
                    "is_synthesized": True,
                    "relevance_score": s.relevance_score or 4,
                    "core_problem": s.core_problem or "",
                    "methodology": s.methodology or "",
                    "key_findings": s.key_findings or "",
                    "research_gaps": s.research_gaps or "",
                    "abstract": s.abstract or "",
                    "has_figures": False,
                    "created_at": s.created_at.isoformat() if s.created_at else None
                }

        # 3. Load Discovery Pooled Papers
        stmt_disc = select(DiscoveryCache)
        res_d = await session.execute(stmt_disc)
        disc_records = res_d.scalars().all()
        for d in disc_records:
            try:
                papers_list = json.loads(d.papers_json)
                for p in papers_list:
                    p_doi = p.get("doi")
                    p_title = p.get("title", "")
                    if not p_title:
                        continue
                    key = (p_doi.lower().strip() if p_doi else p_title.lower().strip())
                    if key in merged_papers:
                        # Fill in missing authors or abstract
                        if not merged_papers[key]["authors"]:
                            merged_papers[key]["authors"] = p.get("authors", [])
                        if not merged_papers[key]["year"]:
                            merged_papers[key]["year"] = p.get("year")
                        if not merged_papers[key]["abstract"]:
                            merged_papers[key]["abstract"] = p.get("abstract", "")
                        if not merged_papers[key]["venue"]:
                            merged_papers[key]["venue"] = p.get("venue", "")
                    else:
                        merged_papers[key] = {
                            "id": p.get("id") or key,
                            "title": p_title,
                            "authors": p.get("authors", []),
                            "year": p.get("year"),
                            "venue": p.get("venue", ""),
                            "doi": p_doi,
                            "doi_link": p.get("doi_link") or (f"https://doi.org/{p_doi}" if p_doi else ""),
                            "pdf_url": p.get("pdf_url", ""),
                            "pdf_downloaded": p.get("pdf_downloaded", False),
                            "is_vaulted": False,
                            "vault_id": None,
                            "file_size_bytes": 0,
                            "source": p.get("source", "openalex"),
                            "is_synthesized": False,
                            "relevance_score": 3,
                            "core_problem": "",
                            "methodology": "",
                            "key_findings": "",
                            "research_gaps": "",
                            "abstract": p.get("abstract", ""),
                            "has_figures": False,
                            "created_at": None
                        }
            except Exception:
                continue

    all_items = list(merged_papers.values())

    # Apply filters
    filtered = all_items
    if search:
        s_lower = search.lower().strip()
        filtered = [
            p for p in filtered
            if s_lower in p["title"].lower() or any(s_lower in a.lower() for a in p["authors"]) or s_lower in (p.get("venue") or "").lower()
        ]

    if year_min:
        filtered = [p for p in filtered if p.get("year") and p["year"] >= year_min]

    if year_max:
        filtered = [p for p in filtered if p.get("year") and p["year"] <= year_max]

    if only_vaulted:
        filtered = [p for p in filtered if p["is_vaulted"]]

    if only_synthesized:
        filtered = [p for p in filtered if p["is_synthesized"]]

    # Sort: vaulted first, then synthesized, then by year desc
    filtered.sort(key=lambda x: (x["is_vaulted"], x["is_synthesized"], x.get("year") or 0), reverse=True)

    return {
        "total": len(filtered),
        "total_unfiltered": len(all_items),
        "vaulted_count": sum(1 for p in all_items if p["is_vaulted"]),
        "synthesized_count": sum(1 for p in all_items if p["is_synthesized"]),
        "items": filtered
    }

@router.post("/export")
async def export_master_references(req: ExportReferencesRequest):
    """Export selected or all references into BibTeX or RIS format."""
    # Retrieve all references
    refs_data = await get_all_references()
    all_items = refs_data["items"]

    target_items = all_items
    if req.paper_ids:
        id_set = set(req.paper_ids)
        target_items = [p for p in all_items if p["id"] in id_set]

    if req.format.lower() == "ris":
        content = "\n".join(generate_ris_entry(p) for p in target_items)
        filename = f"litbuddy_references_{len(target_items)}.ris"
        return Response(
            content=content,
            media_type="application/x-research-info-systems",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    else:
        # Default BibTeX
        content_lines = []
        for i, p in enumerate(target_items, 1):
            class DummyPaper:
                def __init__(self, d):
                    self.id = d.get("id", f"p{i}")
                    self.title = d.get("title", "Untitled")
                    self.authors = d.get("authors", [])
                    self.year = d.get("year")
                    self.venue = d.get("venue", "")
                    self.doi = d.get("doi", "")
            content_lines.append(generate_bibtex_entry(DummyPaper(p), i))

        content = "\n\n".join(content_lines)
        filename = f"litbuddy_references_{len(target_items)}.bib"
        return Response(
            content=content,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
