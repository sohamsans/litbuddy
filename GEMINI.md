# AutoLit AI - Workspace Rules & Execution Guidelines

## 1. Context & Token Conservation
- Always consult `.agents/skills/autolit-memory/SKILL.md` and `PROJECT_MEMORY.md` before initiating major modifications.
- Keep context lean: avoid reading entire large dependency files or re-running extensive research queries when local memory already contains the verified contracts.
- Strictly adhere to the two-stage LLM evaluation pipeline:
  - Stage 1: Batch triage with abstract truncation at 250 words.
  - Stage 2: Sliced PDF sections (pages 1-2 and last 2 pages) up to 12,000 characters total.

## 2. Anti-Hallucination & Model Selection Directives
- External APIs (OpenAlex, Semantic Scholar, Unpaywall, arXiv) have fixed endpoints and formats documented in `.agents/skills/academic-apis/SKILL.md`.
- Prioritize generous free APIs: OpenAlex (100k req/day polite pool) and arXiv (completely open).
- Model Selection: AutoLit requires simple relevance scoring and text parsing, not complex coding or multi-step math. Exclusively use lightweight, high-speed, cloud-hosted free-tier models: Groq `llama-3.1-8b-instant` or Gemini `gemini-1.5-flash-8b`. No local models (Ollama) to prevent laptop battery/RAM drain and ensure seamless cloud/Netlify deployment. Never invoke heavy or expensive models.
- Always parse and sanitize LLM outputs via Pydantic schemas. Strip code fences before decoding JSON.
- Never invent query parameters or assume PDF availability; always implement graceful fallbacks to abstracts.

## 3. Technology Consistency
- Backend: Python 3.12, FastAPI, `httpx`, `pymupdf`, `pydantic`, `pandas`, `openpyxl`.
- Frontend: Vite + React + TypeScript + Tailwind CSS + Lucide Icons + TanStack Table v8 + SheetJS (`xlsx`).
- Deployment: Netlify SPA (`netlify.toml` with proxy redirect `/api/*`).
