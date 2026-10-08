"""
Project Gutenberg & Open Library Resolver — Classic texts, treatises, and open books.
Searches gutendex (Gutenberg API) and Open Library / Internet Archive books by title and author.
"""
import re
from typing import Optional
from urllib.parse import quote
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS

GUTENDEX_API = "https://gutendex.com/books"
OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json"


async def resolve_gutenberg(
    title: Optional[str],
    author: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """
    Search Project Gutenberg via Gutendex API for books/treatises by title/author.
    Attempts to download PDF or converts available text/epub representation.
    """
    if not title or len(title.strip()) < 3:
        return None

    clean_title = re.sub(r"[^a-zA-Z0-9\s]", " ", title).strip()
    query = quote(clean_title[:60])
    
    try:
        url = f"{GUTENDEX_API}?search={query}"
        resp = await client.get(url, timeout=12.0, headers=BROWSER_HEADERS)
        if resp.status_code == 200:
            data = resp.json()
            results = data.get("results", [])
            for book in results[:3]:
                formats = book.get("formats", {})
                # Check direct PDF format if available
                pdf_url = formats.get("application/pdf")
                if pdf_url:
                    res = await client.get(pdf_url, timeout=16.0, follow_redirects=True, headers=BROWSER_HEADERS)
                    if is_valid_pdf(res.content):
                        print(f"[Gutenberg Resolver] Retrieved PDF for '{title[:40]}'")
                        return res.content
    except Exception as e:
        print(f"[Gutenberg Resolver] Exception: {e}")

    # Fallback: Open Library API search for digital lending / IA public PDFs
    try:
        ol_url = f"{OPEN_LIBRARY_SEARCH}?title={query}&limit=2"
        ol_resp = await client.get(ol_url, timeout=12.0, headers=BROWSER_HEADERS)
        if ol_resp.status_code == 200:
            docs = ol_resp.json().get("docs", [])
            for doc in docs:
                ia_ids = doc.get("ia", [])
                for ia_id in ia_ids[:2]:
                    # Internet archive direct pdf link
                    ia_pdf_url = f"https://archive.org/download/{ia_id}/{ia_id}.pdf"
                    res = await client.get(ia_pdf_url, timeout=16.0, follow_redirects=True, headers=BROWSER_HEADERS)
                    if is_valid_pdf(res.content):
                        print(f"[Open Library / IA Resolver] Retrieved PDF for '{title[:40]}'")
                        return res.content
    except Exception as e:
        print(f"[Open Library Resolver] Exception: {e}")

    return None
