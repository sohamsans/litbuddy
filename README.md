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
├── litbuddy.spec                # PyInstaller standalone executable specification
└── build_windows_exe.bat        # Automated Windows build script
```

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
