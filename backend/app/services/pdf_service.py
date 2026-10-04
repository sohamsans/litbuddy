from typing import Optional, Tuple
import httpx
try:
    import pymupdf
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        pymupdf = None
from app.config import get_settings

async def resolve_unpaywall_pdf(doi: str, client: Optional[httpx.AsyncClient] = None) -> Optional[str]:
    """Check Unpaywall for legal Open Access PDF direct URL."""
    if not doi:
        return None
    settings = get_settings()
    url = f"https://api.unpaywall.org/v2/{doi}?email={settings.academic_contact_email}"
    try:
        should_close = False
        if client is None:
            client = httpx.AsyncClient(timeout=8.0)
            should_close = True

        res = await client.get(url)
        if res.status_code == 200:
            data = res.json()
            if data.get("is_oa"):
                best_oa = data.get("best_oa_location") or {}
                pdf_url = best_oa.get("url_for_pdf")
                if pdf_url:
                    return pdf_url
        if should_close:
            await client.aclose()
    except Exception as e:
        print(f"[Unpaywall Warning] Error querying {doi}: {e}")
    return None

async def download_pdf_stream(pdf_url: str, max_bytes: int = 25 * 1024 * 1024) -> Optional[bytes]:
    """Stream download PDF with memory guard and timeout."""
    if not pdf_url:
        return None
    settings = get_settings()
    headers = {
        "User-Agent": f"AutoLit/1.0 (academic literature review tool; mailto:{settings.academic_contact_email})"
    }
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=headers) as client:
            async with client.stream("GET", pdf_url) as response:
                if response.status_code != 200:
                    return None
                
                content = bytearray()
                async for chunk in response.aiter_bytes():
                    content.extend(chunk)
                    if len(content) > max_bytes:
                        return None # File exceeds size threshold
                
                # Verify PDF header signature
                raw_bytes = bytes(content)
                if not raw_bytes.startswith(b"%PDF-"):
                    return None
                return raw_bytes
    except Exception as e:
        print(f"[PDF Download Warning] Failed to stream {pdf_url}: {e}")
        return None

def extract_pdf_sections(pdf_bytes: bytes, max_chars: int = 12000) -> str:
    if not pymupdf:
        return ""
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)
        if total_pages == 0:
            return ""

        extracted_sections = []

        # Read first 2 pages (Intro / Context)
        intro_pages = min(2, total_pages)
        for i in range(intro_pages):
            page_text = doc[i].get_text("text").strip()
            if page_text:
                extracted_sections.append(f"--- [PAGE {i+1}: TITLE / INTRODUCTION] ---\n{page_text}")

        # Read last 2 pages (Discussion / Conclusion)
        if total_pages > 2:
            start_last = max(2, total_pages - 2)
            for i in range(start_last, total_pages):
                page_text = doc[i].get_text("text").strip()
                if page_text:
                    extracted_sections.append(f"--- [PAGE {i+1}: DISCUSSION / CONCLUSION] ---\n{page_text}")

        combined_text = "\n\n".join(extracted_sections)
        # Cap text length to prevent context inflation
        return combined_text[:max_chars]
    except Exception as e:
        print(f"[PyMuPDF Warning] Error parsing PDF stream: {e}")
        return ""

async def get_paper_content_slices(
    doi: Optional[str],
    pdf_url: Optional[str],
    abstract: str
) -> Tuple[str, bool]:
    """Retrieve PDF slices if available; otherwise return abstract with fallback flag."""
    target_url = pdf_url
    if not target_url and doi:
        target_url = await resolve_unpaywall_pdf(doi)

    if target_url:
        pdf_data = await download_pdf_stream(target_url)
        if pdf_data:
            sliced_text = extract_pdf_sections(pdf_data)
            if sliced_text and len(sliced_text) > 300:
                # Include abstract at the beginning of sliced text for full clarity
                final_text = f"--- [ABSTRACT] ---\n{abstract}\n\n{sliced_text}"
                return final_text, True

    # Fallback to abstract only
    fallback_text = f"--- [ABSTRACT] ---\n{abstract}"
    return fallback_text, False
