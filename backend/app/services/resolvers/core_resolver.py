"""
CORE Open Access Aggregator Resolver — Tier 2.
Queries the CORE API (core.ac.uk) which aggregates 200M+ open access papers
from institutional repositories, preprint servers, and OA journals worldwide.
Free API key recommended (core.ac.uk/services/api) but works without for low-volume.
"""
from typing import Optional
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS

CORE_API_BASE = "https://api.core.ac.uk/v3"


async def resolve_core(
    doi: Optional[str],
    title: Optional[str],
    client: httpx.AsyncClient,
    api_key: Optional[str] = None
) -> Optional[bytes]:
    """Search CORE aggregator for open-access PDF download link."""
    if not doi and not title:
        return None

    headers = dict(BROWSER_HEADERS)
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    # Build query
    if doi:
        query = f'doi:"{doi}"'
    else:
        query = f'"{title}"' if title else ""

    try:
        search_url = f"{CORE_API_BASE}/search/works"
        params = {"q": query, "limit": 3}
        res = await client.get(search_url, params=params, timeout=14.0, headers=headers)
        if res.status_code == 200:
            data = res.json()
            for hit in data.get("results", []):
                # Prefer direct downloadUrl
                download_url = hit.get("downloadUrl") or hit.get("sourceFulltextUrls", [None])[0]
                if download_url:
                    pdf = await client.get(download_url, timeout=15.0, follow_redirects=True, headers=BROWSER_HEADERS)
                    if pdf.status_code == 200 and is_valid_pdf(pdf.content):
                        print(f"[CORE Resolver] Downloaded '{doi or title}' from {download_url}")
                        return pdf.content
        elif res.status_code == 429:
            print("[CORE Resolver] Rate limited — skipping.")
    except Exception as e:
        print(f"[CORE Resolver] Error: {e}")
    return None
