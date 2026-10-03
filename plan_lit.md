# Project Specification: AutoLit AI (Autonomous Literature Review Engine)

## 1. Project Overview & Goal
Build a full-stack, open-source-friendly literature review automation app named **AutoLit AI**. 
The application allows a researcher to input a research topic, query, or rough notes draft. It autonomously:
1. Searches scientific literature using free academic APIs (Semantic Scholar, OpenAlex, arXiv).
2. Executes a **Two-Stage LLM Evaluation Pipeline** (Stage 1: Batch Triage of abstracts; Stage 2: Deep Extraction of top papers for gaps, methods, and critical remarks).
3. Resolves and downloads legal Open Access full-text PDFs (via Unpaywall, arXiv, Core.ac.uk) or provides direct DOI links.
4. Generates an interactive, filterable web table and allows instant one-click export to formatted Excel (`.xlsx`), CSV, and syncs with Google Sheets.
5. Is architected to be deployed on **Netlify** (static frontend) with a modular backend API (FastAPI deployable on Render/Railway/Fly.io or serverless functions).

---

## 2. System Architecture & Tech Stack

### Frontend (Netlify Compatible)
- **Framework:** React + Vite (TypeScript) or Next.js (Static Export / SPA mode).
- **Styling:** Tailwind CSS + Lucide React (clean, academic/modern UI).
- **State & Data Table:** TanStack Table (v8) with search, filter, and sorting.
- **Export Utility:** SheetJS (`xlsx`) for client-side Excel and CSV generation.
- **Hosting Target:** Netlify (using `netlify.toml` with proxy redirects to backend).

### Backend (API & Processing Engine)
- **Framework:** Python 3.11+ with **FastAPI**.
- **PDF Extraction:** `pypdf` or `pymupdf` (fitz) to read downloaded paper snippets (Abstract, Intro, Conclusion).
- **Spreadsheet Generation:** `pandas` and `openpyxl`.
- **CORS:** Configured to allow Netlify client domains and custom subdomains.

### LLM Inference (100% Free Tiers / Local Option)
- Multi-provider client abstraction supporting:
  - **Google AI Studio (Gemini 1.5/2.5 Flash)** (Primary: 1M+ token context window, free tier).
  - **Groq Cloud (Llama 3.1/3.3 70B/8B)** (Secondary: ultra-fast batch triage, free tier).
  - **Local Ollama (`qwen2.5:7b` / `llama3.2`)** (Fallback: fully offline, zero-cost).
- All LLM interactions must use **Structured JSON outputs / JSON Mode**.

---

## 3. Core Processing Pipeline

### Phase A: Academic Discovery & Deduplication
- User provides: `topic` (string), `max_results` (default: 20), `year_min` (optional), `relevance_threshold` (1–5).
- Query **OpenAlex API** (`https://api.openalex.org/works`) and **Semantic Scholar API** (`https://api.semanticscholar.org/graph/v1/paper/search`).
- Deduplicate results by `doi` or normalized `title`.
- Extract raw metadata: Title, Authors, Year, Venue, DOI, Abstract, Open Access Status, and PDF direct URL.

### Phase B: Stage 1 — Batch Triage & Relevance Filter (1 LLM Call)
- Consolidate 15–25 candidate abstracts into a single JSON payload.
- System prompt instructs the LLM to score each paper's relevance to the user's research topic from 1 to 5, providing a 1-sentence triage rationale.
- Filter and retain only papers with a score $\ge$ user threshold (default: $\ge 4$, max top 8 papers) to avoid context dilution and unnecessary processing.

### Phase C: PDF Retrieval & Section Extraction
- For each selected paper:
  - Check Open Access status via **Unpaywall API** (`https://api.unpaywall.org/v2/{doi}?email=user@domain.com`).
  - Attempt download if a direct Open Access PDF link exists.
  - If downloaded, use `pymupdf` to extract the **Abstract**, **Introduction (first 2 pages)**, and **Discussion/Conclusion (last 2 pages)**.
  - If no open PDF exists, fall back to analyzing the full available Abstract and metadata.

### Phase D: Stage 2 — Deep Extraction & Synthesis (1 LLM Call Per Selected Paper)
- Execute an individual extraction call for each top paper with the following strict JSON schema:
```json
{
  "title": "string",
  "year": "integer",
  "authors": ["string"],
  "core_problem": "1-2 sentences on what problem the paper tackles",
  "methodology": "Summary of experimental or theoretical approach",
  "key_findings": "Top 2-3 empirical or conceptual findings",
  "research_gaps": "Specific limitations, unaddressed questions, or future work mentioned",
  "critical_remarks": "Actionable evaluation: how to use this in a literature review",
  "doi_link": "string",
  "pdf_downloaded": true
}