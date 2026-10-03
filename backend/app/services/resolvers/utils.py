"""
Shared utilities for all LitBuddy PDF resolvers.
Validates raw bytes are a real PDF binary and not an HTML error/Captcha page.
"""
import re
from typing import Optional

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/pdf,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

MIN_PDF_BYTES = 20_000  # Anything smaller is an error/Captcha page


def is_valid_pdf(data: Optional[bytes]) -> bool:
    """
    Check that byte data represents a genuine PDF document.
    Rejects None, HTML error pages, Captcha pages, and stub PDFs.
    """
    if not data or len(data) < MIN_PDF_BYTES:
        return False
    if not data.startswith(b"%PDF-"):
        return False
    # Reject Sci-Hub / LibGen Captcha responses disguised as HTML inside a PDF wrapper
    first_kb = data[:1024].lower()
    if b"<html" in first_kb or b"<head" in first_kb:
        return False
    return True


def extract_arxiv_id(doi: Optional[str], title: Optional[str], abstract: Optional[str] = None) -> Optional[str]:
    """
    Best-effort extraction of arXiv paper ID from DOI, title, or abstract.
    Returns clean 'YYMM.NNNNN' or 'CATEGORY/NNNNNNN' string.
    """
    patterns = [
        r"arxiv[:/](\d{4}\.\d{4,5}(?:v\d+)?)",       # arXiv:2301.12345
        r"10\.48550/arxiv\.(\d{4}\.\d{4,5}(?:v\d+)?)",  # DOI prefix
        r"abs/(\d{4}\.\d{4,5}(?:v\d+)?)",               # abs/ URL fragment
        r"pdf/(\d{4}\.\d{4,5}(?:v\d+)?)",               # pdf/ URL fragment
        r"(\d{4}\.\d{4,5}(?:v\d+)?)",                   # bare ID
    ]
    search_targets = [doi or "", title or "", abstract or ""]
    for target in search_targets:
        for pattern in patterns:
            m = re.search(pattern, target, re.IGNORECASE)
            if m:
                return m.group(1).rstrip("v").split("v")[0] if "v" in m.group(1) else m.group(1)
    return None
