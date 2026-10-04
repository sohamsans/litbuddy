import io
import os
import json
import zipfile
import asyncio
from typing import List
from app.models.schemas import VaultPaperItem
from app.services.document_vault_service import fetch_and_vault_paper, sanitize_filename

def generate_bibtex_entry(p: VaultPaperItem, idx: int) -> str:
    """Format paper as standard BibTeX article entry."""
    first_author = (p.authors[0].split()[-1].lower()) if p.authors else "author"
    year = p.year or 2024
    key = f"{first_author}{year}_{idx+1}"
    authors_str = " and ".join(p.authors) if p.authors else "Unknown"
    doi_part = f",\n  doi = {{{p.doi}}}" if p.doi else ""
    journal = f",\n  journal = {{{p.venue}}}" if p.venue else ""

    return f"""@article{{{key},
  title = {{{p.title}}},
  author = {{{authors_str}}},
  year = {{{year}}}{journal}{doi_part}
}}"""

async def create_bulk_papers_zip(papers: List[VaultPaperItem]) -> io.BytesIO:
    """Download and bundle selected papers into an in-memory ZIP archive with manifest & .bib citations.
    Guaranteed to return in <= 18 seconds to prevent Netlify/proxy 504 gateway timeouts."""
    zip_buffer = io.BytesIO()

    # Concurrent bounded download (max 6 concurrent PDF streams with 8s per-item timeout)
    semaphore = asyncio.Semaphore(6)

    async def bounded_fetch(p: VaultPaperItem):
        async with semaphore:
            try:
                return await asyncio.wait_for(fetch_and_vault_paper(p), timeout=8.0)
            except Exception as e:
                print(f"[Bulk Download Skip] Failed or timed out on '{p.title[:40]}': {e}")
                return None, None

    # Run tasks with strict overall deadline (18.0s max)
    tasks = [asyncio.create_task(bounded_fetch(p)) for p in papers]
    results = []
    try:
        results = await asyncio.wait_for(
            asyncio.gather(*tasks, return_exceptions=True),
            timeout=18.0
        )
    except asyncio.TimeoutError:
        print(f"[Bulk Download] Global 18s timeout reached for {len(papers)} papers. Packaging resolved documents...")
        for t in tasks:
            if not t.done():
                t.cancel()
        # Collect whatever tasks completed in time
        results = []
        for t in tasks:
            if t.done() and not t.cancelled():
                try:
                    results.append(t.result())
                except Exception:
                    results.append((None, None))
            else:
                results.append((None, None))

    manifest_entries = []
    bibtex_entries = []

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for idx, (paper, res) in enumerate(zip(papers, results)):
            vault_id = None
            file_path = None
            if isinstance(res, tuple):
                vault_id, file_path = res

            safe_title = sanitize_filename(paper.title)
            year_str = str(paper.year) if paper.year else "nd"
            author_lead = paper.authors[0].split()[-1] if paper.authors else "Author"

            entry_info = {
                "index": idx + 1,
                "title": paper.title,
                "authors": paper.authors,
                "year": paper.year,
                "venue": paper.venue,
                "doi": paper.doi,
                "downloaded": False
            }

            if file_path and os.path.exists(file_path):
                archive_name = f"papers/[{idx+1}]_{author_lead}_{year_str}_{safe_title[:50]}.pdf"
                zf.write(file_path, arcname=archive_name)
                entry_info["downloaded"] = True
                entry_info["archive_path"] = archive_name

            manifest_entries.append(entry_info)
            bibtex_entries.append(generate_bibtex_entry(paper, idx))

        # Add references.bib
        bibtex_content = "\n\n".join(bibtex_entries)
        zf.writestr("references.bib", bibtex_content)

        # Add manifest.json
        manifest_content = json.dumps({
            "tool": "LitBuddy Academic Document Vault",
            "total_papers": len(papers),
            "successfully_bundled": sum(1 for e in manifest_entries if e["downloaded"]),
            "papers": manifest_entries
        }, indent=2)
        zf.writestr("manifest.json", manifest_content)

        # Add README.txt
        readme_content = (
            "LitBuddy Literature Review - Paper Bundle\n"
            "=========================================\n\n"
            f"Total Requested: {len(papers)}\n"
            f"Successfully Vaulted: {sum(1 for e in manifest_entries if e['downloaded'])}\n\n"
            "Contents:\n"
            "- papers/         : Full-text PDF documents\n"
            "- references.bib  : Consolidated BibTeX citations for LaTeX / Overleaf\n"
            "- manifest.json   : Metadata index linking filenames to DOIs and venues\n"
        )
        zf.writestr("README.txt", readme_content)

    zip_buffer.seek(0)
    return zip_buffer
