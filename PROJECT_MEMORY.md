# AutoLit AI - Project Memory & State Register

## 1. Project Identity & Architecture
- **Name:** AutoLit AI (Autonomous Literature Review Engine v3.0)
- **Objective:** Automated academic discovery, two-stage cloud LLM evaluation, OA PDF section extraction, tabular synthesis matrix, and multi-user BYOK isolation.
- **Frontend Target:** React 18 + Vite + TypeScript + Tailwind CSS (Craft Glassmorphism, Dark/Light mode, 5 accent themes: Emerald, Sapphire, Amethyst, Amber, Titanium) + Lucide Icons + TanStack Table v8 + SheetJS (Netlify hosted).
- **Backend Target:** Python 3.12 + FastAPI + SQLite + SQLAlchemy Async (`aiosqlite`) + Cryptography AES-256 (`Fernet`) + PyJWT + PyMuPDF (`pymupdf`) + httpx + openpyxl.
- **Universal LLM Hub:** Multi-provider cloud engine supporting:
  - Groq Cloud: `openai/gpt-oss-20b`, `llama-3.1-8b-instant` (14.4k req/day free, sub-second latency)
  - Google Gemini: `gemini-3.5-flash-lite`, `gemini-2.0-flash` (1,500 req/day free)
  - OpenRouter: `:free` models (`meta-llama/llama-3.3-70b-instruct:free`, `google/gemini-2.0-flash-exp:free`) & frontier models
  - DeepSeek: `deepseek-chat` (V3), `deepseek-reasoner` (R1) ($0.14 / 1M tokens)
  - NVIDIA NIM: `meta/llama-3.1-8b-instruct` (1,000 free developer credits)
  - Custom OpenAI-compatible endpoints (`custom_base_url` + `custom_api_key`)
- **Dual-Layer Database Caching:**
  - *Tier 1 (`discovery_cache`):* Raw discovered paper pool (50–200+ candidates) keyed by SHA-256 query hash. Replays in 0ms with zero external API calls.
  - *Tier 2 (`papers_cache`):* Synthesized literature reviews keyed by normalized DOI / Title hash. Reuses existing analyses with zero LLM calls.
- **Academic Search Engines:**
  - OpenAlex (100k req/day polite pool)
  - Crossref REST API
  - Europe PMC (OA full text & PMCID)
  - arXiv API (Open preprints)
  - Semantic Scholar (Academic graph)
- **Model Context Protocol (MCP) Server:**
  - Protocol Version: `2024-11-05` stdio JSON-RPC.
  - Exposed Tools: `autolit_search_literature`, `autolit_triage_candidates`, `autolit_deep_extract`, `autolit_export_matrix`.

## 2. API & Data Contracts
- **Stage 1 Triage Contract:**
  - Input: List of `{ id, title, year, authors, abstract }` (hyper-lean cap at 180 words, copyright boilerplate stripped).
  - Output: `{ evaluations: [ { id, score: 1..5, rationale: str } ] }`
- **Stage 2 Deep Extraction Contract:**
  - Input: Title, Authors, Year, DOI, Abstract, and compressed PDF text slices (up to 8,000 chars, bibliography stripped).
  - Output: Strict JSON matching `ReviewPaper` Pydantic model (`core_problem`, `methodology`, `key_findings`, `research_gaps`, `critical_remarks`, `doi_link`, `pdf_downloaded`).

## 3. Milestones & Progress Tracker
- [x] Workspace Skills Created (`autolit-memory`, `academic-apis`, `llm-pipeline`, `pdf-extraction`, `fullstack-deployment`)
- [x] Milestone 1: Backend Architecture & Cloud LLM Provider (Groq `openai/gpt-oss-20b` + Gemini `gemini-3.5-flash-lite`)
- [x] Milestone 2: Multi-Source Academic Discovery Engine (OpenAlex, Crossref, Europe PMC, arXiv, Semantic Scholar)
- [x] Milestone 3: PDF Downloader & PyMuPDF Slicer with Graceful Fallback
- [x] Milestone 4: Two-Stage Pipeline Orchestrator & FastAPI Endpoints
- [x] Milestone 5: Frontend UI (React + Vite + Tailwind + TanStack Table + SheetJS Excel/CSV export)
- [x] Milestone 6: Netlify Configuration (`netlify.toml`) & Build Verification (Passed)
- [x] Milestone 7 (v2.0): Deep Paper Pool (50–200+ candidates) with Rate-Limit Shield (`rate_shield.py`)
- [x] Milestone 8 (v2.0): AI Research Assistant Mode (`assistant_service.py` & `AssistantChatDrawer.tsx`)
- [x] Milestone 9 (v2.0): Interactive 2-Step Literature Flow (Candidate preview table -> Selective synthesis)
- [x] Milestone 10 (v2.0): Start/End Year Timeline Controls with All-Time toggle
- [x] Milestone 11 (v3.0): UI Craft Overhaul (/ui-design-guidelines compliant) - Gemini-style unified search bar, micro-pills dock, dark mode glassmorphism, 5 selectable accent themes.
- [x] Milestone 12 (v3.0): Multi-User Isolation & Encrypted BYOK - PBKDF2 hashing, JWT sessions, AES-256 Fernet key encryption at rest, masked key security, zero-knowledge privacy assurance.
- [x] Milestone 13 (v3.0): Universal LLM Provider Hub - Groq, Gemini, OpenRouter, DeepSeek, NVIDIA NIM, Custom endpoints + Quota & pricing estimator directory.
- [x] Milestone 14 (v3.0): Dual-Layer SQLite Cache - Tier 1 raw candidate pool cache (0ms instant replay) and Tier 2 review synthesis cache (0 LLM tokens).
- [x] Milestone 15 (v3.0): Hyper-Engineered Lean Prompts - 180-word abstract cap, boilerplate regex stripping, 8,000 char context clamp saving 50–70% tokens.
- [x] Milestone 16 (v3.0): Model Context Protocol (MCP) Server - stdio JSON-RPC server (`backend/app/mcp_server.py`) exposing 4 tools for Claude Desktop, Cursor, and agent integration.
- [x] Milestone 17 (LitBuddy v4.0): Google Gemini Atmospheric Dark Mode - Locked to `#131314` base with radial atmospheric glow; light mode & theme toggles cleanly removed.
- [x] Milestone 18 (LitBuddy v4.0): NotebookLM-Style Dual Sidebar Layout:
  - *Left Sidebar:* Session reviews, + New review pill, and user profile drawer.
  - *Right Sidebar (`SourcesSidebar.tsx`):* 3-tab hub (Synthesized Sources with relevance & tags, Raw Candidate Pool, Reference Manager in BibTeX/APA/MLA/RIS with 1-click copy & `.bib` download) + Mini Paper Searcher to fetch and append papers dynamically.
- [x] Milestone 19 (LitBuddy v4.0): Grounded Paper Q&A with LaTeX Math (`PaperChatArea.tsx` & `LatexRenderer.tsx`):
  - Interactive hero-to-chat transition once papers are synthesized.
  - KaTeX rendering of inline formulas ($...$) and display equations ($$...$$).
  - Grounded citations (`[1]`, `[2]`) linked directly to the sources sidebar.
  - Context compression (`compress_paper_context`) keeping token overhead minimal.
- [x] Milestone 20 (LitBuddy v4.0): Search Pagination Offset & Non-Repetition (`academic_search.py`):
  - Paginated bunch retrieval (offset tracking across OpenAlex, Crossref, Europe PMC, arXiv, and Semantic Scholar).
  - Deduplication and exclusion of previously fetched DOIs/IDs so queries fetch fresh batches instead of duplicate papers.
- [x] Milestone 21 (LitBuddy v4.0): SEO, Legal Compliance & 100% Free Resources Directory:
  - `robots.txt`, `CookieBanner.tsx` local-storage consent banner, `LegalModal.tsx` (Terms & Conditions, Privacy & Security guarantee).
  - Curated Free APIs and GitHub Repositories tab inside `OnboardingKeyModal.tsx` linking free tiers (Groq, Gemini, OpenRouter `:free`, public-apis).
- [x] Milestone 22 (LitBuddy v4.1): Document Vault, High-Yield Scrapers, Standalone Exe & Research Mode:
  - Robust Multi-Source PDF Scraper: HTML `<meta name="citation_pdf_url">` tag scraper resolving publisher landing pages (Nature, Springer, ScienceDirect, Wiley, MDPI), Crossref direct works, Semantic Scholar OA, Internet Archive / Wayback, Dokumen.pub, and expanded Sci-Hub mirrors.
  - Full-Text Document Vault (`PaperDocumentVault`): Local zero-ms PDF storage, PyMuPDF figure extraction, and bulk ZIP download.
  - Data Retention Guarantee: Chat and search deletion (`DELETE /api/auth/history`, `DELETE /api/auth/saved-searches/{hash}`) removes user conversation records while permanently preserving cached vault papers, figures, and reference metadata.
  - Objective Research Framing: Unbiased scholarly system prompts across engineering, aerospace, materials, and defense tech literature without didactic lecturing or arbitrary refusal.
  - Standalone Windows Executable: Complete single-file `LitBuddy.exe` packaged with PyInstaller, bundling the React SPA, FastAPI backend, SQLite auto-migrations, and PyMuPDF engine.
- [x] Milestone 23 (LitBuddy v4.2): Conversational AI Overhaul, Master Reference Manager & Downloads Manager:
  - Smart Model Auto-Failover: Automatic cascade across configured providers (Groq -> Gemini -> OpenRouter -> DeepSeek) when rate limits (429) or quota bounds are reached, maintaining complete context and conversational memory continuity.
  - Conversational AI & Anti-Truncation: Paper Chat and Copilot overhauled into natural, conversational, in-depth academic partners; honest error reporting if quotas run out without canned robotic templates.
  - Query Concatenation Loop Elimination: Decoupled Research Topic from chat inquiries and sanitized suggested searches.
  - Master Reference Manager (`/api/references/all`): Global out-of-chat library aggregating all pooled, synthesized, and vaulted papers with multi-format citation export (BibTeX, APA, MLA, Chicago, IEEE, RIS) and batch download.
  - Dedicated Downloads Manager (`/api/vault/downloads`): Visual view of all vaulted PDFs, file sizes, resolved sources, Windows Explorer folder reveal (`/api/vault/open-folder`), and bulk ZIP export.
  - In-App PDF Viewer Modal (`PdfViewerModal.tsx`): Fullscreen viewer for instant 0ms reading of vaulted PDFs.
  - Interactive First-Run Onboarding Tutorial (`OnboardingTourModal.tsx`): 6-step guided walkthrough for first-time visitors with persistent replay button.
  - Zero-Knowledge Key Privacy: Sanitized `.env` credentials in production builds ensuring zero personal keys are leaked.
- [x] Milestone 24 (LitBuddy v4.3): Bug Analysis and Fix Engine, State Persistence & Resilient Bulk Downloads:
  - Full Chat State Persistence (`PaperChatArea.tsx` & `AssistantChatDrawer.tsx`): Conversations saved into deterministic `localStorage` topics and synchronized to cloud `/api/auth/history` when authenticated. Added explicit reset/clear confirmations.
  - Active Review Session Continuity (`App.tsx`): Entire active review matrix, candidate pool, and selection state survive browser refresh (F5) and tab closures via `litbuddy_active_session`.
  - Instant Review Replay (`Sidebar.tsx`): Clicking past reviews loads synthesis in 0ms directly from cached topic state without re-discovery roundtrips.
  - Browser Direct PDF Downloader (`SourcesSidebar.tsx`): Single downloads vault to server and immediately trigger browser file download to user's computer, with graceful external publisher fallback if paywalled.
  - Resilient Bulk ZIP Bundler (`bulk_download_service.py` & `SourcesSidebar.tsx`): Concurrent 6-worker download bounded by strict 18.0s overall deadline, completely eliminating Netlify 26s proxy 504 timeouts. Always bundles full `references.bib`, `manifest.json`, and all resolved PDFs.
  - Unified Auth Identifier Resolution (`backend/app/routers/auth.py`): Email verification (`/api/auth/verify-code`) and resend (`/api/auth/resend-code`) transparently resolve users by either email OR username, eliminating the unverified account lock.

## 4. Bug Register & Diagnostic Ledger

| Bug ID | Domain | Symptom | Root Cause (reasons-to-error) | Status |
|---|---|---|---|---|
| **BUG-101** | Chat Persistence | Conversations in Paper Chat and Copilot wipe out upon browser refresh (F5). | React memory-only state (`useState`) without synchronization to `localStorage` or backend `/api/auth/history`. | **Verified & Fixed** |
| **BUG-102** | Active Review Session | Active synthesized review matrix, discovered candidates, and topic reset to blank on refresh. | `reviewResults` and `discoveredPapers` not persisted in `localStorage` session state. | **Verified & Fixed** |
| **BUG-103** | PDF Downloader | Single paper download in `SourcesSidebar` vaults PDF on server but does not download to user browser. | `handleDownloadSingle` calls `vaultSinglePaper` but never triggers browser download link / blob download. | **Verified & Fixed** |
| **BUG-104** | Bulk Downloader | Bulk download in `SourcesSidebar` calls `batchVaultPapers` (server-only) instead of downloading ZIP. | UI action mismatch: server batch-vault called instead of browser-triggered ZIP download stream. | **Verified & Fixed** |
| **BUG-105** | Bulk ZIP Timeout | Bulk download on website times out with 504 Gateway Timeout when downloading 20-50 papers. | Sequential bounded fetch across 50 papers with 12s timeout exceeds Netlify 26s proxy limit. | **Verified & Fixed** |
| **BUG-106** | Auth / OTP Verification | Unverified users logging in with username fail verification with `404: Account not found`. | `verify-code` and `resend-code` endpoints only queried `User.email` and failed when passed username identifier. | **Verified & Fixed** |
| **BUG-107** | Sidebar Topic Replay | Clicking a past review in the left sidebar triggers candidate discovery, wiping existing synthesis. | `onSelectTopic` forces `mode: 'discover'` rather than checking and restoring cached synthesis. | **Verified & Fixed** |
| **BUG-108** | Desktop Cross-Device Auth | Desktop app reports "account isn't verified yet" for accounts registered/verified on the cloud website. | Desktop runs local SQLite (`autolit.db`) disconnected from cloud; local entry was unverified with no local SMTP service; old `LitBuddy.exe` pre-dated cloud auth fallback; non-deterministic relative db path. Implemented cloud auth probe fallback, local password auto-verification, deterministic DB path resolution, and rebuilt `LitBuddy.exe`. | **Verified & Fixed** |



