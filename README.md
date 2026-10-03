# AutoLit AI 📚⚡
> **Autonomous Academic Literature Review Engine**
> 100% Free Open Academic APIs &bull; Lightweight Cloud LLM Evaluation &bull; Netlify + FastAPI Full-Stack

AutoLit AI is an autonomous, open-source-friendly research engine designed to dramatically accelerate academic literature reviews. It discovers scientific papers across OpenAlex and arXiv, runs a **Two-Stage Cloud LLM Evaluation Pipeline** (Stage 1 Batch Triage $\rightarrow$ Stage 2 Deep Extraction), retrieves and slices legal Open Access PDFs via PyMuPDF, and presents a filterable synthesis matrix with instant client-side Excel (`.xlsx`) and CSV export.

---

## 🌟 Key Architecture Highlights

- **100% Free Open Discovery**: Queries the **OpenAlex** polite pool (100,000 req/day, 10 req/s with polite email) and **arXiv API** (open preprints). No paid scholarly API keys needed.
- **Deduplication Engine**: Normalizes DOIs and alphanumeric title hashes to eliminate duplicates across sources.
- **Two-Stage Cloud LLM Evaluation**:
  - **Stage 1 (Batch Triage)**: Evaluates 15–25 candidate abstracts (capped at 250 words) in a single ultra-fast cloud LLM call via **Groq Cloud (`llama-3.1-8b-instant`)**. Scores each paper 1–5 with a 1-sentence rationale.
  - **Stage 2 (Deep Extraction)**: Takes top-filtered papers ($\ge 4$ relevance score) and extracts core problems, methodology, key findings, research gaps, and actionable synthesis remarks via **Google AI Studio (`gemini-1.5-flash-8b`)**.
- **No Local Resource Burden**: Zero local models (no Ollama). Eliminates laptop memory, CPU, and battery drain. Runs completely over cloud-hosted free tiers.
- **Smart Section Slicing**: Slices legal Open Access PDFs using **PyMuPDF (`pymupdf`)** to extract only the Title, Introduction (pages 1–2), and Discussion/Conclusion (last 2 pages), keeping context lean and saving 80–90% of token overhead. Gracefully falls back to abstracts if paywalled.
- **Client-Side Export**: Uses **SheetJS (`xlsx`)** to generate formatted Excel spreadsheets directly in the browser with zero server load.
- **Netlify SPA Ready**: Configured with `netlify.toml` for static hosting and seamless backend proxying.

---

## 📁 Repository Structure

```text
d:\litbuddy/
├── .agents/
│   └── skills/                  # AutoLit AI Agent Skills
│       ├── autolit-memory/      # Project state & token conservation
│       ├── academic-apis/       # OpenAlex polite pool & arXiv protocols
│       ├── llm-pipeline/        # Two-stage evaluation & JSON validation
│       ├── pdf-extraction/      # Streaming OA PDFs & PyMuPDF slicing
│       └── fullstack-deployment/# Netlify SPA & FastAPI contracts
├── GEMINI.md                    # Project-level anti-hallucination rules
├── PROJECT_MEMORY.md            # Persistent architecture register
├── netlify.toml                 # Netlify build & proxy configuration
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app with CORS & routers
│   │   ├── config.py            # Settings (Groq & Gemini cloud keys)
│   │   ├── models/schemas.py    # Pydantic schemas (SearchRequest, ReviewPaper)
│   │   ├── services/
│   │   │   ├── academic_search.py # OpenAlex polite pool + arXiv + dedup
│   │   │   ├── pdf_service.py     # Unpaywall, streaming PDF, PyMuPDF slice
│   │   │   ├── llm_provider.py    # Groq Llama 3.1 8B + Gemini Flash 8B
│   │   │   └── pipeline.py        # Stage 1 Triage & Stage 2 Deep Extraction
│   │   └── routers/
│   │       ├── review.py        # /api/pipeline, /api/health
│   │       └── export.py        # /api/export/excel fallback
│   ├── requirements.txt
│   ├── .env.example
│   └── test_backend.py          # Comprehensive test suite
└── frontend/
    ├── package.json
    ├── vite.config.ts           # Vite with /api proxy to FastAPI
    ├── tailwind.config.js       # Academic emerald/slate styling
    └── src/
        ├── App.tsx              # Main application orchestrator
        ├── components/
        │   ├── Header.tsx       # Status badge & API key modal toggle
        │   ├── SearchForm.tsx   # Topic query, filters, suggestions
        │   ├── PipelineProgress.tsx # Real-time execution indicators
        │   ├── LiteratureTable.tsx  # TanStack Table v8 with sort & filter
        │   ├── PaperDetailModal.tsx # Full structured synthesis view
        │   └── ExportBar.tsx        # SheetJS Excel & CSV export buttons
        ├── services/
        │   ├── api.ts           # Backend HTTP client
        │   └── exportUtils.ts   # SheetJS (.xlsx/.csv) generation
        └── types/index.ts       # TypeScript interfaces
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup (FastAPI)
Open a terminal window and run:
```cmd
cd d:\litbuddy\backend

# Option A: Direct execution (Works in Command Prompt & PowerShell without script errors)
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000

# Option B (Command Prompt cmd.exe):
.\.venv\Scripts\activate.bat
uvicorn app.main:app --reload --port 8000

# Option C (PowerShell):
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup (React + Vite)
```powershell
cd d:\litbuddy\frontend

# Install dependencies (already initialized)
npm install

# Start Vite development server (Runs on http://localhost:5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Running Tests
To verify all backend components (discovery, deduplication, PDF slicing, and pipeline):
```powershell
cd d:\litbuddy\backend
.\.venv\Scripts\python test_backend.py
```

---

## 🌐 Netlify Deployment
AutoLit AI is configured for Netlify out of the box:
1. Connect your repository to Netlify.
2. Build Settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. In `netlify.toml`, update the proxy redirect to point to your hosted FastAPI backend (e.g., Render, Railway, or Fly.io):
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://your-backend-service.onrender.com/api/:splat"
     status = 200
   ```
