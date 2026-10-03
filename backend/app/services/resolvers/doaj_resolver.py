"""
DOAJ (Directory of Open Access Journals) Resolver — Tier 2.
Queries DOAJ Article Search API v2 for direct full-text PDF links.
Covers 10,000+ fully open access journals with immediate PDF availability.
"""
from typing import Optional
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS


async def resolve_doaj(
    doi: Optional[str],
    title: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """Search DOAJ for a direct full-text PDF via DOI or title."""
    if not doi and not title:
        return None

    # Build query - DOI is the best key
    if doi:
        query_url = f"https://doaj.org/api/v2/search/articles/doi:{doi}?pageSize=3"
    else:
        safe = title[:80].replace(" ", "+") if title else ""
        query_url = f"https://doaj.org/api/v2/search/articles/{safe}?pageSize=3"

    try:
        res = await client.get(query_url, timeout=12.0, headers=BROWSER_HEADERS)
        if res.status_code == 200:
            data = res.json()
            for hit in data.get("results", []):
                # Extract direct bibjson fulltext link
                links = hit.get("bibjson", {}).get("link", [])
                for link in links:
                    if link.get("type") in ("fulltext", "pdf"):
                        pdf_url = link.get("url", "")
                        if pdf_url:
                            pdf = await client.get(pdf_url, timeout=15.0, follow_redirects=True, headers=BROWSER_HEADERS)
                            if pdf.status_code == 200 and is_valid_pdf(pdf.content):
                                print(f"[DOAJ Resolver] Downloaded '{doi or title}'")
                                return pdf.content
    except Exception as e:
        print(f"[DOAJ Resolver] Error: {e}")
    return None
