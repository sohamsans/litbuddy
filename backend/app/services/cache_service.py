import json
import hashlib
import re
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.db.models import DiscoveryCache, PaperCache
from app.models.schemas import RawPaperMetadata, ReviewPaper

def compute_query_hash(
    topic: str,
    year_min: Optional[int] = None,
    year_max: Optional[int] = None,
    no_year_constraint: bool = False,
    max_results: int = 50,
    offset: int = 0
) -> str:
    """Deterministic hash for caching raw discovery queries with pagination offset."""
    normalized_topic = re.sub(r'[^a-zA-Z0-9]', '', topic.lower()).strip()
    key_str = f"{normalized_topic}_{year_min}_{year_max}_{no_year_constraint}_{max_results}_{offset}"
    return hashlib.sha256(key_str.encode("utf-8")).hexdigest()

def compute_paper_cache_key(doi: Optional[str], title: str) -> str:
    """Deterministic key for caching individual paper syntheses."""
    if doi and len(doi.strip()) > 3:
        clean_doi = doi.lower().strip()
        clean_doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", clean_doi)
        return f"doi_{hashlib.sha256(clean_doi.encode('utf-8')).hexdigest()[:32]}"
    clean_title = re.sub(r'[^a-zA-Z0-9]', '', title.lower()).strip()
    return f"title_{hashlib.sha256(clean_title.encode('utf-8')).hexdigest()[:32]}"

async def get_cached_discovery(query_hash: str) -> Optional[List[RawPaperMetadata]]:
    """Retrieve raw candidate papers from Tier 1 cache if available."""
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(DiscoveryCache).where(DiscoveryCache.query_hash == query_hash)
            result = await session.execute(stmt)
            cached = result.scalar_one_or_none()
            if cached:
                cached.access_count += 1
                await session.commit()
                data = json.loads(cached.papers_json)
                return [RawPaperMetadata.model_validate(p) for p in data]
    except Exception as e:
        print(f"[Cache Warning] Failed to read discovery cache: {e}")
    return None

async def save_discovery_cache(
    query_hash: str,
    topic: str,
    filters_dict: dict,
    papers: List[RawPaperMetadata]
):
    """Save discovered candidate paper pool into Tier 1 cache."""
    try:
        async with AsyncSessionLocal() as session:
            papers_data = [p.model_dump() for p in papers]
            papers_json = json.dumps(papers_data)
            filters_json = json.dumps(filters_dict)

            stmt = select(DiscoveryCache).where(DiscoveryCache.query_hash == query_hash)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()

            if existing:
                existing.papers_json = papers_json
                existing.total_count = len(papers)
                existing.created_at = datetime.now(timezone.utc)
            else:
                entry = DiscoveryCache(
                    query_hash=query_hash,
                    topic=topic,
                    filters_json=filters_json,
                    papers_json=papers_json,
                    total_count=len(papers),
                    access_count=1
                )
                session.add(entry)
            await session.commit()
    except Exception as e:
        print(f"[Cache Warning] Failed to save discovery cache: {e}")

async def get_cached_synthesis(doi: Optional[str], title: str) -> Optional[ReviewPaper]:
    """Retrieve synthesized literature review from Tier 2 cache if available."""
    cache_key = compute_paper_cache_key(doi, title)
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(PaperCache).where(PaperCache.cache_key == cache_key)
            result = await session.execute(stmt)
            cached = result.scalar_one_or_none()
            if cached:
                cached.access_count += 1
                await session.commit()
                return ReviewPaper(
                    id=cached.doi or cached.cache_key,
                    title=cached.title,
                    year=cached.year,
                    authors=json.loads(cached.authors_json),
                    venue=cached.venue,
                    relevance_score=cached.relevance_score,
                    triage_rationale=cached.triage_rationale or "Retrieved from AutoLit synthesis cache.",
                    core_problem=cached.core_problem,
                    methodology=cached.methodology,
                    key_findings=cached.key_findings,
                    research_gaps=cached.research_gaps,
                    critical_remarks=cached.critical_remarks,
                    doi_link=f"https://doi.org/{cached.doi}" if cached.doi else "",
                    pdf_downloaded=cached.is_oa,
                    source=cached.source
                )
    except Exception as e:
        print(f"[Cache Warning] Failed to read paper synthesis cache: {e}")
    return None

async def save_paper_synthesis(paper: ReviewPaper):
    """Save synthesized literature review into Tier 2 cache."""
    cache_key = compute_paper_cache_key(paper.doi_link.replace("https://doi.org/", ""), paper.title)
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(PaperCache).where(PaperCache.cache_key == cache_key)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()

            doi = paper.doi_link.replace("https://doi.org/", "") if paper.doi_link else None

            if existing:
                existing.relevance_score = paper.relevance_score
                existing.triage_rationale = paper.triage_rationale
                existing.core_problem = paper.core_problem
                existing.methodology = paper.methodology
                existing.key_findings = paper.key_findings
                existing.research_gaps = paper.research_gaps
                existing.critical_remarks = paper.critical_remarks
                existing.access_count += 1
            else:
                entry = PaperCache(
                    cache_key=cache_key,
                    doi=doi,
                    title=paper.title,
                    authors_json=json.dumps(paper.authors),
                    year=paper.year,
                    venue=paper.venue,
                    is_oa=paper.pdf_downloaded,
                    relevance_score=paper.relevance_score,
                    triage_rationale=paper.triage_rationale,
                    core_problem=paper.core_problem,
                    methodology=paper.methodology,
                    key_findings=paper.key_findings,
                    research_gaps=paper.research_gaps,
                    critical_remarks=paper.critical_remarks,
                    source=paper.source,
                    access_count=1
                )
                session.add(entry)
            await session.commit()
    except Exception as e:
        print(f"[Cache Warning] Failed to save paper synthesis cache: {e}")
