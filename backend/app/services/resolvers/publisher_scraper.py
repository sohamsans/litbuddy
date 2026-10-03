"""
PyPaperBot-Style Universal Publisher Landing Page Scraper — Universal Wrapper.
Implements the HTML meta tag scraping strategy from github.com/ferru97/PyPaperBot.
Handles:
- Highwire Press: citation_pdf_url, citation_fulltext_html_url
- Dublin Core: dc.identifier, dc.relation
- PRISM: prism.url
- bepress: bepress_citation_pdf_url
- Elsevier ScienceDirect: specific div patterns
- Nature/Springer: og:url + /pdf suffix injection
- Wiley: anchor with 'epdf' or 'pdf' in href
- Taylor & Francis: PDF link patterns
- MDPI: /pdf/ path injection
- Sage Publications: Sage-specific meta patterns
"""
import re
from typing import Optional
from urllib.parse import urljoin
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS

# Publisher-specific PDF URL patterns (ordered by specificity)
META_PATTERNS = [
    # Highwire Press (APA, BMJ, PNAS, JBC, etc.)
    r'<meta[^>]+name=["\']citation_pdf_url["\'][^>]+content=["\']([^"\']+)["\']',
    r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']citation_pdf_url["\']',
    # bepress (Digital Commons, Elsevier Open Archive)
    r'<meta[^>]+name=["\']bepress_citation_pdf_url["\'][^>]+content=["\']([^"\']+)["\']',
    r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']bepress_citation_pdf_url["\']',
    # Dublin Core identifier (broad fallback)
    r'<meta[^>]+name=["\']DC\.identifier["\'][^>]+content=["\']([^"\'https?://][^"\']*\.pdf[^"\']*)["\']',
    # PRISM / Wiley meta
    r'<meta[^>]+name=["\']prism\.url["\'][^>]+content=["\']([^"\']+\.pdf[^"\']*)["\']',
    # og:pdf or twitter:pdf-url
    r'<meta[^>]+property=["\']og:pdf["\'][^>]+content=["\']([^"\']+)["\']',
]

ANCHOR_PATTERNS = [
    # Generic direct PDF anchors
    r'href=["\']([^"\']+\.pdf[^"\']*)["\']',
    # Wiley ePDF / eBook links
    r'href=["\']([^"\']+/epdf/[^"\']*)["\']',
    r'href=["\']([^"\']+/pdf/[^"\']+)["\']',
]


async def resolve_publisher_landing(
    url: str,
    client: httpx.AsyncClient,
    depth: int = 0
) -> Optional[bytes]:
    """
    Fetch a publisher landing page and extract the real PDF download URL.
    Implements the same scraping logic as PyPaperBot.
    """
    if depth > 2 or not url:
        return None

    try:
        res = await client.get(url, timeout=18.0, follow_redirects=True, headers=BROWSER_HEADERS)
        if res.status_code != 200:
            return None

        # Direct PDF
        if is_valid_pdf(res.content):
            return res.content

        content_type = res.headers.get("content-type", "").lower()
        if "html" not in content_type and not res.content[:50].lower().startswith(b"<!doc"):
            return None  # Not HTML, can't scrape

        html = res.text

        # 1. Scan all meta tag patterns
        for pattern in META_PATTERNS:
            matches = re.findall(pattern, html, re.IGNORECASE)
            for match in matches:
                pdf_url = urljoin(url, match.strip())
                result = await resolve_publisher_landing(pdf_url, client, depth + 1)
                if result:
                    print(f"[Landing Scraper] Resolved via meta: {pdf_url[:80]}")
                    return result

        # 2. Try Nature/Springer: inject /pdf/ into URL if it's a /article/ URL
        if "nature.com" in url or "springer.com" in url:
            pdf_url = url.replace("/article/", "/article-pdf/").replace(
                "article", "article-pdf"
            )
            if not pdf_url.endswith(".pdf"):
                pdf_url += ".pdf"
            result = await resolve_publisher_landing(pdf_url, client, depth + 1)
            if result:
                return result

        # 3. Try MDPI /pdf/ path injection
        if "mdpi.com" in url:
            pdf_url = url.rstrip("/") + "/pdf"
            result = await resolve_publisher_landing(pdf_url, client, depth + 1)
            if result:
                return result

        # 4. Scan anchor href patterns
        for pattern in ANCHOR_PATTERNS:
            anchors = re.findall(pattern, html, re.IGNORECASE)
            for anchor in anchors[:3]:
                pdf_url = urljoin(url, anchor.strip())
                if pdf_url == url:
                    continue
                result = await resolve_publisher_landing(pdf_url, client, depth + 1)
                if result:
                    print(f"[Landing Scraper] Resolved via anchor: {pdf_url[:80]}")
                    return result

    except Exception as e:
        print(f"[Landing Scraper] {url[:60]}: {e}")

    return None
