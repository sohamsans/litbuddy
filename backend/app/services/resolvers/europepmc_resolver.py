"""
Europe PMC / PubMed Central Resolver — Tier 1 (gold open access for biomedical).
Queries Europe PMC REST API for full-text OA PDFs and PMCID-based PDF downloads.
"""
import re
from typing import Optional
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS


async def resolve_europepmc(
    doi: Optional[str],
    title: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """Query Europe PMC for open access PDF links."""
    query = f"DOI:{doi}" if doi else f'"{title}"'
    try:
        api_url = (
            f"https://www.ebi.ac.uk/europepmc/webservices/rest/search"
            f"?query={query}&format=json&resultType=core&pageSize=3&HAS_PDF:y"
        )
        res = await client.get(api_url, timeout=12.0, headers=BROWSER_HEADERS)
        if res.status_code == 200:
            data = res.json()
            for hit in data.get("resultList", {}).get("result", []):
                pmcid = hit.get("pmcid")
                if pmcid:
                    pdf_url = f"https://europepmc.org/articles/{pmcid}/pdf"
                    pdf = await client.get(pdf_url, timeout=15.0, follow_redirects=True, headers=BROWSER_HEADERS)
                    if pdf.status_code == 200 and is_valid_pdf(pdf.content):
                        print(f"[Europe PMC Resolver] Downloaded via PMCID {pmcid}")
                        return pdf.content
    except Exception as e:
        print(f"[Europe PMC Resolver] Error: {e}")
    return None
