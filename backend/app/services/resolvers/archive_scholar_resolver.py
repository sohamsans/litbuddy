"""
Internet Archive Scholar Resolver — Tier 3.
Queries scholar.archive.org (Fatcat/CDXAPI) for crawled and preserved OA PDFs.
Also checks Wayback Machine CDX API for any cached PDF snapshot of the DOI URL.
"""
import re
from typing import Optional
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS


async def resolve_archive_scholar(
    doi: Optional[str],
    title: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """
    Try:
    1. scholar.archive.org search by DOI or title -> extract PDF download URL.
    2. Wayback Machine CDX API snapshot of doi.org/{doi}.
    3. Internet Archive texts collection full-text search.
    """
    # Strategy 1: Internet Archive Scholar (Fatcat) search
    if doi or title:
        query = doi or title
        try:
            scholar_url = f"https://scholar.archive.org/search?q={query}&format=json"
            res = await client.get(scholar_url, timeout=14.0, headers=BROWSER_HEADERS)
            if res.status_code == 200:
                data = res.json()
                for hit in data.get("results", []):
                    file_obj = hit.get("_source", {}).get("file", {})
                    pdf_url = file_obj.get("pdf_url") or file_obj.get("urls", [None])[0]
                    if pdf_url:
                        pdf = await client.get(pdf_url, timeout=15.0, follow_redirects=True, headers=BROWSER_HEADERS)
                        if pdf.status_code == 200 and is_valid_pdf(pdf.content):
                            print(f"[Archive Scholar] Downloaded via scholar.archive.org")
                            return pdf.content
        except Exception as e:
            print(f"[Archive Scholar] Fatcat search: {e}")

    # Strategy 2: Wayback Machine CDX API snapshot
    if doi:
        try:
            doi_url = f"https://doi.org/{doi}"
            cdx_url = (
                f"https://archive.org/wayback/available?url={doi_url}&timestamp=20240101"
            )
            res = await client.get(cdx_url, timeout=10.0, headers=BROWSER_HEADERS)
            if res.status_code == 200:
                snap = res.json().get("archived_snapshots", {}).get("closest", {})
                if snap.get("available") and snap.get("url"):
                    wb_url = snap["url"]
                    pdf = await client.get(wb_url, timeout=15.0, follow_redirects=True, headers=BROWSER_HEADERS)
                    if pdf.status_code == 200 and is_valid_pdf(pdf.content):
                        print(f"[Archive Scholar] Downloaded Wayback snapshot for DOI {doi}")
                        return pdf.content
        except Exception as e:
            print(f"[Archive Scholar] Wayback CDX: {e}")

    # Strategy 3: Internet Archive texts search
    if title:
        try:
            search_query = title[:60].replace(" ", "+")
            ia_search = (
                f"https://archive.org/advancedsearch.php?"
                f"q={search_query}&fl[]=identifier&fl[]=format"
                f"&rows=5&output=json&mediatype=texts"
            )
            res = await client.get(ia_search, timeout=12.0, headers=BROWSER_HEADERS)
            if res.status_code == 200:
                docs = res.json().get("response", {}).get("docs", [])
                for doc in docs:
                    identifier = doc.get("identifier")
                    if identifier:
                        pdf_url = f"https://archive.org/download/{identifier}/{identifier}.pdf"
                        pdf = await client.get(pdf_url, timeout=15.0, follow_redirects=True, headers=BROWSER_HEADERS)
                        if pdf.status_code == 200 and is_valid_pdf(pdf.content):
                            print(f"[Archive Scholar] Downloaded via IA texts: {identifier}")
                            return pdf.content
        except Exception as e:
            print(f"[Archive Scholar] IA texts: {e}")

    return None
