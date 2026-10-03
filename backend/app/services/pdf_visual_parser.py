import os
import json
import pymupdf
from typing import Dict, List, Any, Tuple
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.db.models import PaperDocumentVault

import sys

def _get_figures_dir() -> str:
    if getattr(sys, "frozen", False):
        base = os.path.dirname(sys.executable)
    else:
        base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    path = os.getenv("LITBUDDY_FIGURES_DIR", os.path.join(base, "app_data", "figures"))
    os.makedirs(path, exist_ok=True)
    return path

FIGURES_DIR = _get_figures_dir()

def extract_pdf_layout_and_figures(pdf_path: str, vault_id: str, max_figures: int = 6) -> Dict[str, Any]:
    """Parse full text sections and extract high-resolution diagram/figure PNGs using PyMuPDF."""
    if not os.path.exists(pdf_path):
        return {"fulltext": "", "figures": [], "sections": {}}

    try:
        doc = pymupdf.open(pdf_path)
    except Exception as e:
        print(f"[PyMuPDF Open Error] {pdf_path}: {e}")
        return {"fulltext": "", "figures": [], "sections": {}}

    sections: Dict[str, List[str]] = {
        "abstract": [],
        "introduction": [],
        "methodology": [],
        "results": [],
        "discussion": [],
        "conclusion": []
    }

    fulltext_pages = []
    extracted_figures = []
    fig_count = 0

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        text = page.get_text("text").strip()
        if text:
            fulltext_pages.append(f"--- [PAGE {page_idx + 1}] ---\n{text}")

        # Extract raster diagrams & charts
        if fig_count < max_figures:
            image_list = page.get_images(full=True)
            for img_info in image_list:
                xref = img_info[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image.get("image")
                image_ext = base_image.get("ext", "png")
                width = base_image.get("width", 0)
                height = base_image.get("height", 0)

                # Filter out tiny logos, icons, formulas (< 150x150)
                if width >= 180 and height >= 180:
                    fig_id = f"fig_{vault_id[:12]}_p{page_idx + 1}_{xref}"
                    img_filename = f"{fig_id}.{image_ext}"
                    img_save_path = os.path.join(FIGURES_DIR, img_filename)

                    with open(img_save_path, "wb") as f_img:
                        f_img.write(image_bytes)

                    # Extract nearby candidate caption from page lines
                    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
                    caption = ""
                    for ln in lines:
                        if ln.lower().startswith(("figure ", "fig. ", "chart ", "diagram ")):
                            caption = ln[:140]
                            break

                    extracted_figures.append({
                        "id": fig_id,
                        "page": page_idx + 1,
                        "img_url": f"/api/vault/figures/{img_filename}",
                        "caption": caption or f"Figure extracted from Page {page_idx + 1} ({width}x{height}px)"
                    })
                    fig_count += 1
                    if fig_count >= max_figures:
                        break

    doc.close()
    full_text = "\n\n".join(fulltext_pages)

    return {
        "fulltext": full_text[:25000], # Cap at 25,000 chars for LLM context bounds
        "figures": extracted_figures,
        "sections": sections
    }

async def get_or_parse_vault_document(vault_id: str) -> Dict[str, Any]:
    """Retrieve pre-parsed layout/figures from database or parse PDF with PyMuPDF."""
    async with AsyncSessionLocal() as session:
        stmt = select(PaperDocumentVault).where(PaperDocumentVault.id == vault_id)
        result = await session.execute(stmt)
        record = result.scalar_one_or_none()

        if not record or not os.path.exists(record.file_path):
            return {"fulltext": "", "figures": [], "sections": {}}

        # Cache check
        if record.parsed_fulltext:
            figures = json.loads(record.figures_json) if record.figures_json else []
            sections = json.loads(record.sections_json) if record.sections_json else {}
            return {
                "fulltext": record.parsed_fulltext,
                "figures": figures,
                "sections": sections
            }

        # Parse with PyMuPDF
        parsed = extract_pdf_layout_and_figures(record.file_path, vault_id)
        record.parsed_fulltext = parsed["fulltext"]
        record.figures_json = json.dumps(parsed["figures"])
        record.sections_json = json.dumps(parsed["sections"])
        await session.commit()

        return parsed
