"""
LibGen Scientific Articles (Scimag) Resolver — Tier 4 (shadow archive fallback).
Queries LibGen's scimag index by DOI to retrieve the MD5 hash, then constructs
direct download links via multiple LibGen mirrors and download.library.lol.
Uses the libgen-api library with httpx fallback for DOI-to-MD5 lookup.
"""
import re
from typing import Optional
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS

LIBGEN_MIRRORS = [
    "https://libgen.is",
    "https://libgen.rs",
    "https://libgen.li",
]

DOWNLOAD_MIRRORS = [
    "https://download.library.lol",
    "https://libgen.rocks",
]


async def resolve_libgen(
    doi: Optional[str],
    title: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """
    Resolve paper via LibGen scimag DOI search.
    Steps:
    1. Query /scimag/?q={doi} on each LibGen mirror.
    2. Scrape the download link row.
    3. Follow download.library.lol or libgen.rocks link to raw PDF.
    """
    if not doi:
        return None

    clean_doi = doi.strip().lstrip("https://doi.org/").lstrip("http://dx.doi.org/")

    for mirror in LIBGEN_MIRRORS:
        try:
            search_url = f"{mirror}/scimag/?q={clean_doi}"
            res = await client.get(search_url, timeout=14.0, follow_redirects=True, headers=BROWSER_HEADERS)
            if res.status_code != 200:
                continue

            html = res.text

            # Extract MD5 hash and libgen download link from table row
            # Pattern: href containing /scimag/get.php?doi= or download.library.lol
            md5_matches = re.findall(r'md5=([a-fA-F0-9]{32})', html, re.IGNORECASE)
            if not md5_matches:
                # Try alternate pattern for direct download links
                dl_matches = re.findall(
                    r'href="(https?://(?:download\.library\.lol|libgen\.rocks)/[^"]+)"',
                    html, re.IGNORECASE
                )
                for dl_url in dl_matches[:3]:
                    pdf = await _download_from_libgen_link(dl_url, client)
                    if pdf:
                        return pdf
                continue

            md5 = md5_matches[0].lower()
            # Try download mirrors with this MD5
            for dl_mirror in DOWNLOAD_MIRRORS:
                dl_url = f"{dl_mirror}/main/{md5}"
                pdf = await _download_from_libgen_link(dl_url, client)
                if pdf:
                    print(f"[LibGen Resolver] Downloaded '{clean_doi}' via {dl_mirror}")
                    return pdf

        except Exception as e:
            print(f"[LibGen Resolver] Mirror {mirror}: {e}")
            continue

    return None


async def _download_from_libgen_link(url: str, client: httpx.AsyncClient) -> Optional[bytes]:
    """Follow a LibGen download page link and extract the raw PDF binary."""
    try:
        res = await client.get(url, timeout=14.0, follow_redirects=True, headers=BROWSER_HEADERS)
        if res.status_code == 200:
            # Direct PDF binary
            if is_valid_pdf(res.content):
                return res.content
            # HTML download page — find the actual GET link
            if b"<html" in res.content[:200].lower():
                html = res.text
                pdf_link = re.search(
                    r'href="([^"]+\.pdf[^"]*)"',
                    html, re.IGNORECASE
                )
                if pdf_link:
                    pdf_url = pdf_link.group(1)
                    if not pdf_url.startswith("http"):
                        from urllib.parse import urljoin
                        pdf_url = urljoin(url, pdf_url)
                    pdf = await client.get(pdf_url, timeout=15.0, follow_redirects=True, headers=BROWSER_HEADERS)
                    if pdf.status_code == 200 and is_valid_pdf(pdf.content):
                        return pdf.content
    except Exception as e:
        print(f"[LibGen Download] {url}: {e}")
    return None
