---
name: pdf-extraction
description: >-
  Open Access PDF retrieval and smart section extraction skill for AutoLit AI.
  Use when fetching OA full-texts via Unpaywall or direct URLs, safely streaming PDFs,
  and extracting targeted text slices (Intro, Conclusion) using PyMuPDF.
---

# PDF Retrieval & Smart Slicing Guide

This skill guides the safe downloading and selective text extraction of academic PDFs, maximizing context relevance while keeping LLM token costs minimal.

## 1. Safe Streaming PDF Download
Academic PDFs can range from 1MB to 100MB+. Never download unlimited bytes into memory.

```python
import httpx

MAX_PDF_BYTES = 25 * 1024 * 1024  # 25 MB limit
DOWNLOAD_TIMEOUT = 15.0

async def download_pdf_stream(pdf_url: str) -> bytes | None:
    headers = {"User-Agent": "AutoLit/1.0 (academic literature review tool; mailto:autolit@research.local)"}
    try:
        async with httpx.AsyncClient(timeout=DOWNLOAD_TIMEOUT, follow_redirects=True) as client:
            async with client.stream("GET", pdf_url, headers=headers) as response:
                if response.status_code != 200:
                    return None
                content_type = response.headers.get("content-type", "").lower()
                if "application/pdf" not in content_type and not pdf_url.endswith(".pdf"):
                    # Check if response is actually HTML landing page
                    chunk = await anext(response.aiter_bytes())
                    if not chunk.startswith(b"%PDF-"):
                        return None
                content = bytearray()
                async for chunk in response.aiter_bytes():
                    content.extend(chunk)
                    if len(content) > MAX_PDF_BYTES:
                        return None # Abort oversized files
                return bytes(content)
    except Exception:
        return None
```

## 2. Targeted Section Extraction with PyMuPDF (`pymupdf` / `fitz`)
Rather than dumping 30 pages of PDF into the LLM context, selectively extract:
- **Pages 1 to 2** (Title, Abstract, Introduction)
- **Last 2 to 3 pages** (Discussion, Limitations, Conclusion) - skipping reference lists if possible.

```python
import pymupdf  # or import fitz

def extract_key_sections(pdf_bytes: bytes, max_chars: int = 12000) -> str:
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)
        if total_pages == 0:
            return ""

        extracted_text = []

        # First 2 pages (Intro)
        pages_to_read = min(2, total_pages)
        for i in range(pages_to_read):
            text = doc[i].get_text("text").strip()
            if text:
                extracted_text.append(f"--- PAGE {i+1} (Introduction / Context) ---\n{text}")

        # Last 2 pages (Conclusion / Discussion)
        if total_pages > 2:
            start_last = max(2, total_pages - 2)
            for i in range(start_last, total_pages):
                text = doc[i].get_text("text").strip()
                if text:
                    extracted_text.append(f"--- PAGE {i+1} (Discussion / Conclusion) ---\n{text}")

        full_extracted = "\n\n".join(extracted_text)
        # Cap total characters to avoid token inflation
        return full_extracted[:max_chars]
    except Exception as e:
        return ""
```

## 3. Graceful Fallback Protocol
If:
- DOI is paywalled / no OA link found
- Download fails or times out
- PDF is a scanned image with no OCR text

**Fallback Action:** Set `pdf_downloaded: false`, and construct the Stage 2 extraction prompt strictly from the candidate paper's title, authors, venue, and full abstract. Never fail the entire review query due to a missing PDF.
