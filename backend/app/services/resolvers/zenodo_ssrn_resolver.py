"""
Zenodo & SSRN Open Science Resolver.
CERN Zenodo records, Open Science preprints, and SSRN working papers.
"""
import re
from typing import Optional
from urllib.parse import quote
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS

ZENODO_API = "https://zenodo.org/api/records"

async def resolve_zenodo(
    doi: Optional[str],
    title: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """Resolve records hosted on Zenodo (CERN Open Science)."""
    # 1. By DOI
    if doi:
        clean_doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi.strip())
        if "10.5281/zenodo." in clean_doi:
            record_id = clean_doi.split("zenodo.")[-1]
            try:
                url = f"{ZENODO_API}/{record_id}"
                resp = await client.get(url, timeout=10.0, headers=BROWSER_HEADERS)
                if resp.status_code == 200:
                    data = resp.json()
                    files = data.get("files", [])
                    for f in files:
                        links = f.get("links", {})
                        download_url = links.get("self") or links.get("download")
                        if download_url and (f.get("key", "").endswith(".pdf") or f.get("type") == "pdf"):
                            res = await client.get(download_url, timeout=18.0, follow_redirects=True, headers=BROWSER_HEADERS)
                            if is_valid_pdf(res.content):
                                print(f"[Zenodo Resolver] Resolved via record {record_id}")
                                return res.content
            except Exception as e:
                print(f"[Zenodo Resolver] Record lookup error: {e}")

    # 2. By Title Search on Zenodo API
    if title and len(title.strip()) > 8:
        try:
            clean_title = re.sub(r"[^a-zA-Z0-9\s]", " ", title).strip()
            q = quote(clean_title[:70])
            url = f"{ZENODO_API}?q={q}&size=2&type=publication"
            resp = await client.get(url, timeout=10.0, headers=BROWSER_HEADERS)
            if resp.status_code == 200:
                data = resp.json()
                hits = data.get("hits", {}).get("hits", [])
                for hit in hits:
                    files = hit.get("files", [])
                    for f in files:
                        links = f.get("links", {})
                        download_url = links.get("self") or links.get("download")
                        if download_url and (f.get("key", "").endswith(".pdf") or f.get("type") == "pdf"):
                            res = await client.get(download_url, timeout=18.0, follow_redirects=True, headers=BROWSER_HEADERS)
                            if is_valid_pdf(res.content):
                                print(f"[Zenodo Resolver] Resolved via search query")
                                return res.content
        except Exception:
            pass

    return None

async def resolve_ssrn(
    doi: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """Resolve Social Science Research Network (SSRN) open access papers."""
    if not doi:
        return None
    clean_doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi.strip())
    if "10.2139/ssrn." in clean_doi.lower():
        ssrn_id = re.sub(r"[^0-9]", "", clean_doi.lower().split("ssrn.")[-1])
        if ssrn_id:
            try:
                dl_url = f"https://papers.ssrn.com/sol3/Delivery.cfm/SSRN_ID{ssrn_id}_code.pdf?abstractid={ssrn_id}&mirid=1"
                res = await client.get(dl_url, timeout=16.0, follow_redirects=True, headers=BROWSER_HEADERS)
                if is_valid_pdf(res.content):
                    print(f"[SSRN Resolver] Resolved SSRN ID {ssrn_id}")
                    return res.content
            except Exception:
                pass
    return None
