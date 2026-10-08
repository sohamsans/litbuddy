# LitBuddy

LitBuddy is an autonomous academic literature synthesis engine and interactive research assistant. It discovers scientific literature across open academic indexes, deduplicates candidate records, executes a two-stage relevance triage and extraction pipeline, archives full-text PDFs into a local document vault, and provides an interactive research chatbot with KaTeX mathematical formula rendering.

---

## Architecture Overview

```
                                  [ User Query ]
                                         |
                                         v
   +--------------------------------------------------------------------------+
   |                       Academic Discovery Cascade                         |
   |   OpenAlex Polite Pool | arXiv API | Crossref | Europe PMC | DOAJ        |
   +--------------------------------------------------------------------------+
                                         |
                                         v
   +--------------------------------------------------------------------------+
   |                      Deduplication & Pre-Filtering                       |
   |              Normalized DOI matching & Alphanumeric Hashing              |
   +--------------------------------------------------------------------------+
                                         |
                                         v
   +--------------------------------------------------------------------------+
   |                      Two-Stage Synthesis Pipeline                        |
   |   Stage 1: Batch Abstract Triage (Relevance scoring 1-5 & rationale)     |
   |   Stage 2: Section Slicing & Deep Extraction (Problems, methods, gaps)   |
   +--------------------------------------------------------------------------+
                                         |
                    +--------------------+--------------------+
                    |                                         |
                    v                                         v
   +----------------------------------+     +----------------------------------+
   |      Local Document Vault        |     |     Interactive Chat Assistant   |
   |  In-app PDF retrieval & viewer   |     |  Grounded Q&A, KaTeX rendering,  |
   |  Saved to 'LitBuddy Papers'      |     |  clickable citation pill badges  |
   +----------------------------------+     +----------------------------------+
```

---

## Features

- **Multi-Engine Academic Discovery**: Searches OpenAlex (100,000 requests/day polite pool), arXiv API, Crossref, Europe PMC, and DOAJ without requiring paid academic subscriptions.
- **Two-Stage LLM Evaluation**:
  - **Stage 1 (Batch Triage)**: Evaluates batches of candidate abstracts simultaneously using lightweight, fast models (Groq Llama 3.1 8B or Gemini Flash 8B).
  - **Stage 2 (Deep Extraction)**: Extracts core research questions, methodologies, empirical benchmarks, and research limitations into structured schemas.
- **Local Document Vault (`LitBuddy Papers`)**: Downloads and caches full-text papers directly inside a local folder on your computer. Includes an inline in-app PDF reader.
- **Interactive Research Chatbot**: Context-grounded conversational interface for asking detailed questions across the synthesized paper collection, with dynamic KaTeX LaTeX rendering and clickable citation badges.
- **Reference Manager**: Exports formatted references across BibTeX, APA, MLA, and RIS formats, as well as Excel (`.xlsx`) and CSV tables.
- **Bring Your Own Key (BYOK) Security**: API keys are encrypted locally using AES-256 via Fernet cryptography in SQLite. No keys are hardcoded or shared.

---

## Project Structure

```text
litbuddy/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint and middleware configuration
│   │   ├── config.py            # Environment configuration and settings
│   │   ├── db/                  # SQLite schema and session lifecycle
│   │   ├── models/schemas.py    # Pydantic data models and validation contracts
│   │   ├── services/            # Search cascades, PDF slicing, LLM drivers, vault
│   │   └── routers/             # API endpoints (review, vault, assistant, auth)
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Container build definition
│   └── litbuddy_app.py          # Native desktop application entrypoint (pywebview)
├── frontend/
│   ├── src/                     # React 18 + TypeScript user interface
│   │   ├── components/          # Tables, sidebars, PDF viewer, chat drawer
│   │   ├── services/            # API client and client-side Excel exporters
│   │   └── types/               # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── netlify.toml                 # Production Netlify routing and deployment config
└── build_windows_exe.bat        # Automated Windows desktop build script
```

---

## Beta Release & Standalone Downloads

LitBuddy is distributed as a lightweight, 100% offline-ready standalone executable for Windows 10/11:

### 📥 Download the Latest Beta
- **Release Version**: `v4.2.0-beta.1`
- **File**: `LitBuddy.exe` (~173 MB, self-contained single file)
- **Direct GitHub Releases**: [https://github.com/sohamsans/litbuddy/releases](https://github.com/sohamsans/litbuddy/releases)
- **Requirements**: Windows 10 or 11 (64-bit). No Python, Node.js, or complex command-line installation required. Simply double-click `LitBuddy.exe` to launch.

---

## ⚠️ Academic Downloading & Polite Pool Advisory

LitBuddy makes research collection straightforward by querying open academic indexes (OpenAlex, arXiv, Crossref, Europe PMC, Unpaywall, IPFS, Project Gutenberg, and decentralized mirrors). However, please note:

1. **Academic Publisher Paywalls & Captchas**: Major commercial publishers frequently update bot detection and paywalls. While LitBuddy exhaustively rotates across mirrors, some closed-access or copyright-restricted papers cannot be retrieved automatically. In these instances, researchers can obtain the document through their university library proxy or preferred repository and drag/import the PDF directly into LitBuddy's local vault.
2. **API Polite Pools & Rate Limits**:
   - Services like OpenAlex and Unpaywall provide generous free access through a **Polite Pool** when a contact email is attached.
   - LitBuddy uses a generic local identifier (`autolit@research.local`) by default so your personal email is never distributed to other users.
   - If you run intensive queries or distribute LitBuddy widely, each user can supply their own contact email in their environment or settings without rate limit conflicts.

---

## 🐛 Bug Reports & Community Feedback

We welcome your feedback, ideas, and bug reports!

If you encounter any issues, layout glitches, or unexpected behavior:
1. Head over to the **[GitHub Issues](https://github.com/sohamsans/litbuddy/issues)** page.
2. Click **New Issue**.
3. **Attach screenshots** of the window or relevant panels (Flow Maps, Writing Studio, Reference Manager, etc.).
4. Describe what you were trying to do and what happened.
5. You can also click the **"Report Issue"** or **"GitHub"** buttons directly inside LitBuddy's top header bar or sidebar footer to open this page instantly.

---

## Running Locally

### Option 1: Standalone Windows Application (`LitBuddy.exe`)

You can run LitBuddy as a native desktop application without installing Python or Node.js.

1. Compile the executable using the provided build script:
   ```cmd
   build_windows_exe.bat
   ```
2. The compiled binary will be placed at `dist/LitBuddy.exe`.
3. Launch `LitBuddy.exe`. It boots the local backend service and opens a dedicated native desktop window.
4. Downloaded papers are automatically saved to `LitBuddy Papers/` in the same directory.

---

### Option 2: Running from Source

#### Prerequisites
- Python 3.11 or 3.12
- Node.js 18+ and npm

#### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```

The API service runs at `http://127.0.0.1:8000`. OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

#### 2. Frontend Setup

In a separate terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Configuration

Copy `.env.example` in the `backend/` directory if you wish to configure default server settings:

```ini
DATABASE_URL=sqlite+aiosqlite:///./autolit.db
OPENALEX_EMAIL=your-email@example.com
LITBUDDY_VAULT_DIR=./LitBuddy Papers
```

API keys for LLM providers (Groq, Google Gemini, OpenRouter) can be entered directly in the application settings dialog upon startup. Keys are stored locally in an encrypted database.

---

## License

MIT License. See `LICENSE` for details.
