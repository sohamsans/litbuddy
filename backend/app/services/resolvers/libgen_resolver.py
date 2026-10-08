"""
LibGen Scientific Articles (Scimag) Multi-Mirror Concurrent Resolver.
Concurrently races across LibGen mirrors and download resolvers.
"""
import asyncio
import re
from typing import Optional
from urllib.parse import urljoin
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS

LIBGEN_MIRRORS = [
    "https://libgen.is",
    "https://libgen.rs",
    "https://libgen.li",
    "https://libgen.gs",
]

DOWNLOAD_MIRRORS = [
    "https://download.library.lol",
    "https://libgen.rocks",
    "https://libgen.li/ads.php",
]


async def _download_from_libgen_link(url: str, client: httpx.AsyncClient) -> Optional[bytes]:
    """Follow a LibGen download page link and extract the raw PDF binary."""
    try:
        res = await client.get(url, timeout=14.0, follow_redirects=True, headers=BROWSER_HEADERS)
        if res.status_code == 200:
            if is_valid_pdf(res.content):
                return res.content
            if b"<html" in res.content[:200].lower():
                html = res.text
                pdf_link = re.search(r'href="([^"]+\.pdf[^"]*)"', html, re.IGNORECASE)
                if not pdf_link:
                    # Also look for 'GET' download button
                    pdf_link = re.search(r'href="([^"]*get\.php[^"]*)"', html, re.IGNORECASE)
                if pdf_link:
                    pdf_url = pdf_link.group(1)
                    if not pdf_url.startswith("http"):
                        pdf_url = urljoin(url, pdf_url)
                    dl_res = await client.get(pdf_url, timeout=18.0, follow_redirects=True, headers=BROWSER_HEADERS)
                    if is_valid_pdf(dl_res.content):
                        return dl_res.content
    except Exception:
        pass
    return None


async def _probe_single_libgen_mirror(mirror: str, clean_doi: str, client: httpx.AsyncClient) -> Optional[bytes]:
    """Search a single LibGen mirror by DOI."""
    try:
        search_url = f"{mirror}/scimag/?q={clean_doi}"
        res = await client.get(search_url, timeout=14.0, follow_redirects=True, headers=BROWSER_HEADERS)
        if res.status_code != 200:
            return None

        html = res.text
        md5_matches = re.findall(r'md5=([a-fA-F0-9]{32})', html, re.IGNORECASE)
        if md5_matches:
            md5 = md5_matches[0].lower()
            for dl_mirror in DOWNLOAD_MIRRORS:
                dl_url = f"{dl_mirror}/main/{md5}"
                pdf = await _download_from_libgen_link(dl_url, client)
                if pdf:
                    return pdf

        # Check direct download hrefs
        dl_matches = re.findall(r'href="(https?://(?:download\.library\.lol|libgen\.rocks)/[^"]+)"', html, re.IGNORECASE)
        for dl_url in dl_matches[:3]:
            pdf = await _download_from_libgen_link(dl_url, client)
            if pdf:
                return pdf
    except Exception:
        pass
    return None


async def resolve_libgen(
    doi: Optional[str],
    title: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """Race all LibGen mirrors simultaneously."""
    if not doi:
        return None

    clean_doi = doi.strip()
    clean_doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", clean_doi)

    tasks = [
        asyncio.create_task(_probe_single_libgen_mirror(mirror, clean_doi, client))
        for mirror in LIBGEN_MIRRORS
    ]

    try:
        for fut in asyncio.as_completed(tasks, timeout=24.0):
            try:
                res = await fut
                if res and is_valid_pdf(res):
                    for t in tasks:
                        if not t.done():
                            t.cancel()
                    return res
            except Exception:
                continue
    except asyncio.TimeoutError:
        pass
    finally:
        for t in tasks:
            if not t.done():
                t.cancel()

    return None
