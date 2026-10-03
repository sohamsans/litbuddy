---
name: fullstack-deployment
description: >-
  Full-stack Netlify frontend and FastAPI backend integration skill for AutoLit AI.
  Use when configuring Netlify static export, netlify.toml redirects, TanStack Table UI,
  SheetJS client exports, and FastAPI REST endpoints.
---

# Full-Stack Netlify & FastAPI Integration

This skill defines the contract between the Netlify static frontend and the FastAPI backend service.

## 1. Netlify Architecture & `netlify.toml`
Netlify hosts the Vite React Single Page Application (SPA). To allow seamless communication with the backend without browser mixed-content or CORS issues, configure `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

# Proxy API requests to backend service (Render / Railway / Fly.io / localhost)
[[redirects]]
  from = "/api/*"
  to = "https://your-backend-url.onrender.com/api/:splat"
  status = 200
  force = true

# SPA fallback routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 2. FastAPI Backend Requirements
- **CORS Middleware:**
  ```python
  from fastapi.middleware.cors import CORSMiddleware
  
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"], # Or specific netlify app domains
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
- **Endpoints:**
  - `POST /api/search`: Initiates literature discovery, Stage 1 triage, and returns candidate abstracts with scores.
  - `POST /api/extract`: Runs Stage 2 deep extraction for specified or top-scoring papers.
  - `POST /api/pipeline`: Complete end-to-end flow returning final structured literature review records.
  - `POST /api/export/excel`: Server-side fallback for `.xlsx` generation using `pandas` and `openpyxl`.
  - `GET /api/health`: Health status and active LLM provider check.

## 3. Frontend TanStack Table & SheetJS
- **State Management:** Hold review items in reactive state with column sorting, global text filtering, and OA badges.
- **Client-Side Export:**
  Use `xlsx` (SheetJS) to convert table records into clean `.xlsx` / `.csv` on the client without invoking backend compute:
  ```typescript
  import * as XLSX from 'xlsx';

  export function exportToExcel(data: any[], fileName: string = 'AutoLit_Review.xlsx') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Literature Review');
    XLSX.writeFile(wb, fileName);
  }
  ```
