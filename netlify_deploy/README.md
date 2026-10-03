# LitBuddy AI — Netlify Cloud Deployment Guide

This directory (`netlify_deploy/`) contains the complete production-ready bundle of **LitBuddy AI** prepared for immediate deployment to **Netlify**.

---

## 🚀 1-Minute Quick Deploy Options

### Option A: Drag & Drop (Zero Install)
1. Log in to [Netlify Dashboard](https://app.netlify.com/).
2. Navigate to **Sites** -> **Add new site** -> **Deploy manually**.
3. Drag and drop the `dist/` folder inside `netlify_deploy/` (or the entire `netlify_deploy/` folder) directly onto the Netlify drop zone.
4. Your website is instantly live with a free `*.netlify.app` domain and HTTPS!

### Option B: Netlify CLI
Run the following from `d:\litbuddy\netlify_deploy`:
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

---

## ☁️ Connecting the Cloud Frontend to Your Cloud Backend

Netlify hosts static assets (HTML, CSS, JS, fonts, KaTeX formulas). All backend requests (`/api/*`) are proxied through Netlify's high-speed edge redirects configured in `netlify.toml` and `_redirects`.

### 1. Deploy the Backend (Render / Railway / Fly.io)
You can deploy `backend/` as a free web service on [Render.com](https://render.com) or [Railway.app](https://railway.app):
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
- **Environment Variables**:
  - `DATABASE_URL` (SQLite default `sqlite+aiosqlite:///./autolit.db` or PostgreSQL `postgresql+asyncpg://...`)
  - `ENCRYPTION_KEY` (32-byte Fernet key for encrypting user BYOK keys)
  - `OPENALEX_EMAIL` (your contact email for OpenAlex polite pool)
  - `LITBUDDY_VAULT_DIR` (path for stored PDF papers, e.g. `/data/LitBuddy_Papers`)

### 2. Update the Proxy URL in Netlify
Once your backend is live (e.g., `https://litbuddy-backend.onrender.com`):
Edit `netlify.toml` and `_redirects`:
```toml
[[redirects]]
  from = "/api/*"
  to = "https://litbuddy-backend.onrender.com/api/:splat"
  status = 200
  force = false
```
Push or re-drop to Netlify. Now all API requests from the browser automatically route securely to your cloud backend with no CORS issues!

---

## 🔗 Connecting Local Desktop App (`LitBuddy.exe`) with Netlify & Cloud

LitBuddy supports a dual-mode hybrid architecture:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│       LitBuddy Desktop App      │       │     Netlify Cloud Web App       │
│      (Local LitBuddy.exe)       │       │    (https://*.netlify.app)      │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
       Embedded Local FastAPI                    Netlify Edge Proxy
                 │                                         │
        Local SQLite & Cache                     Cloud Backend (Render)
                 │                                         │
                 └───────────────► Cloud Sync ◄────────────┘
                            (Public Synthesis Cache &
                             PostgreSQL / SQLite Mirror)
```

1. **Standalone Offline/Local Mode (Default)**:
   - When running `LitBuddy.exe`, it runs an embedded, ultra-fast FastAPI server at `127.0.0.1:8000`.
   - Papers are stored locally in the `LitBuddy Papers` folder right next to `LitBuddy.exe`.
   - API keys and search histories are stored in `autolit.db`.

2. **Connecting Local App to Cloud Backend**:
   - In `LitBuddy.exe`, users can set the environment variable or BYOK custom URL:
     `LITBUDDY_API_BASE=https://litbuddy-backend.onrender.com`
   - This routes the desktop app's queries through the cloud backend while keeping downloads saved to the local `LitBuddy Papers` folder.

3. **Shared Public Cache**:
   - Both the Netlify web app and Desktop app share the hashed paper metadata cache. If a topic has already been triaged or synthesized, results are returned in 0ms without re-querying or consuming model quotas.

4. **Zero-API-Leak Security**:
   - Neither the Netlify frontend nor the compiled `LitBuddy.exe` contains any embedded API keys.
   - Users bring their own free keys (Groq, Gemini, OpenRouter) or enter them in the Onboarding Key Modal.
   - Keys are encrypted with Fernet AES-128 before saving and are only held in memory during search sessions.
