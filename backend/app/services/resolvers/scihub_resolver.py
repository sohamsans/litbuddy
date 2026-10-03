"""
Sci-Hub Multi-Mirror Resolver — Tier 4 (scidownl-inspired mirror rotation).
Implements the same mirror rotation and regex strategies used in:
- scidownl (github.com/Tishacy/scidownl)
- PyPaperBot (github.com/ferru97/PyPaperBot)
Expands mirror list and PDF extraction patterns vs. original LitBuddy implementation.
"""
import re
from typing import Optional
from urllib.parse import urljoin
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS

SCI_HUB_MIRRORS = [
    "https://sci-hub.se",
    "https://sci-hub.st",
    "https://sci-hub.ru",
    "https://sci-hub.ren",
    "https://sci-hub.wf",
    "https://sci-hub.do",
    "https://sci-hub.ee",
    "https://sci-hub.mksa.top",
    "https://sci-hub.shop",
]

# Regex patterns to extract PDF src/href from Sci-Hub response HTML
PDF_SRC_PATTERNS = [
    r"location\.href\s*=\s*['\"]([^'\"]+\.pdf[^'\"]*)['\"]",
    r'src\s*=\s*[\'"]([^"\']+\.pdf(?:\?[^"\']*)?)[\'"]',
    r'iframe[^>]+src\s*=\s*[\'"]([^"\']+)[\'"]',
    r'embed[^>]+src\s*=\s*[\'"]([^"\']+\.pdf[^"\']*)[\'"]',
    r'href\s*=\s*[\'"]([^"\']*download[^"\']*)[\'"]',
    r'download\s*=\s*[\'"][^\'"]*[\'"][^>]*href\s*=\s*[\'"]([^"\']+)[\'"]',
]


async def resolve_scihub(
    doi: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """Try each Sci-Hub mirror to resolve and download PDF for the given DOI."""
    if not doi:
        return None

    clean_doi = doi.strip().lstrip("https://doi.org/").lstrip("http://dx.doi.org/")

    for mirror in SCI_HUB_MIRRORS:
        try:
            page_url = f"{mirror}/{clean_doi}"
            res = await client.get(page_url, timeout=16.0, follow_redirects=True, headers=BROWSER_HEADERS)
            if res.status_code not in (200, 301, 302):
                continue

            # Direct PDF response
            if is_valid_pdf(res.content):
                print(f"[Sci-Hub Resolver] Direct PDF from {mirror}")
                return res.content

            if not (b"<html" in res.content[:200].lower() or b"<!doc" in res.content[:200].lower()):
                continue

            html = res.text

            # Extract embedded PDF URL from HTML
            for pattern in PDF_SRC_PATTERNS:
                matches = re.findall(pattern, html, re.IGNORECASE)
                for match in matches:
                    pdf_url = match.strip()
                    if pdf_url.startswith("//"):
                        pdf_url = "https:" + pdf_url
                    elif not pdf_url.startswith("http"):
                        pdf_url = urljoin(mirror, pdf_url)

                    try:
                        pdf_res = await client.get(
                            pdf_url, timeout=18.0, follow_redirects=True, headers=BROWSER_HEADERS
                        )
                        if pdf_res.status_code == 200 and is_valid_pdf(pdf_res.content):
                            print(f"[Sci-Hub Resolver] Downloaded from {mirror} via pattern")
                            return pdf_res.content
                    except Exception:
                        continue

        except Exception as e:
            print(f"[Sci-Hub Resolver] Mirror {mirror}: {e}")
            continue

    return None
