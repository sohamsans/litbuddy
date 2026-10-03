"""
arXiv Resolver — Tier 1 (fastest, highest fidelity for preprints).
Extracts arXiv IDs from DOI / title / abstract and downloads direct PDF binary.
"""
import re
from typing import Optional
import httpx
from .utils import is_valid_pdf, extract_arxiv_id, BROWSER_HEADERS


async def resolve_arxiv(
    doi: Optional[str],
    title: Optional[str],
    abstract: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """Try every known arXiv URL pattern for the paper."""
    arxiv_id = extract_arxiv_id(doi, title, abstract)
    if not arxiv_id:
        return None

    candidates = [
        f"https://arxiv.org/pdf/{arxiv_id}.pdf",
        f"https://arxiv.org/pdf/{arxiv_id}",
        f"https://export.arxiv.org/pdf/{arxiv_id}",
        f"https://ar5iv.labs.arxiv.org/html/{arxiv_id}",  # HTML fallback
    ]
    for url in candidates:
        try:
            res = await client.get(url, timeout=15.0, follow_redirects=True, headers=BROWSER_HEADERS)
            if res.status_code == 200 and is_valid_pdf(res.content):
                print(f"[arXiv Resolver] Downloaded {arxiv_id} from {url}")
                return res.content
        except Exception as e:
            print(f"[arXiv Resolver] {url}: {e}")
            continue
    return None
