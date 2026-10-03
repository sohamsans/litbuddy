"""
Habanero / Crossref Text-Mining Link Resolver — Tier 2.
Uses the Crossref REST API (via habanero-style requests) to extract 
'intended-application: text-mining' and 'intended-application: similarity-checking'
fulltext PDF URLs registered by publishers including:
- Elsevier, Wiley, Springer, Taylor & Francis, Sage, Royal Society, etc.
These links are legally provided by publishers for machine access.
"""
from typing import Optional
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS

CROSSREF_API = "https://api.crossref.org/works"
CROSSREF_EMAIL = "litbuddy@research.local"


async def resolve_habanero_crossref(
    doi: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """
    Query Crossref works API for the DOI, then extract text-mining fulltext links
    from the 'link' array in the response JSON.
    """
    if not doi:
        return None

    clean_doi = doi.strip().lstrip("https://doi.org/").lstrip("http://dx.doi.org/")

    try:
        api_url = f"{CROSSREF_API}/{clean_doi}"
        res = await client.get(
            api_url,
            timeout=12.0,
            headers={**BROWSER_HEADERS, "User-Agent": f"LitBuddy/4.1 (mailto:{CROSSREF_EMAIL})"}
        )
        if res.status_code != 200:
            return None

        data = res.json().get("message", {})
        links = data.get("link", [])

        # Sort: prefer text-mining > similarity-checking > unspecified
        def link_priority(link: dict) -> int:
            app = link.get("intended-application", "")
            if app == "text-mining":
                return 0
            if app == "similarity-checking":
                return 1
            return 2

        links_sorted = sorted(links, key=link_priority)

        for link in links_sorted:
            content_type = link.get("content-type", "")
            url = link.get("URL", "")
            if not url:
                continue
            # Prefer PDF content types
            if "pdf" in content_type or "unspecified" in content_type or content_type == "":
                try:
                    pdf = await client.get(url, timeout=15.0, follow_redirects=True, headers=BROWSER_HEADERS)
                    if pdf.status_code == 200 and is_valid_pdf(pdf.content):
                        print(f"[Crossref/Habanero] Downloaded '{clean_doi}' via text-mining link")
                        return pdf.content
                except Exception:
                    continue

    except Exception as e:
        print(f"[Crossref/Habanero] Error for '{doi}': {e}")

    return None
