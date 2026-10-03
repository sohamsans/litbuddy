from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import review, export, assistant, auth, vault, references
from app.db.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="LitBuddy API",
    description="LitBuddy: Autonomous Literature Review Engine with Dual-Layer Caching, Document Vault, and Multi-Provider BYOK Hub.",
    version="4.2.0",
    lifespan=lifespan
)

# CORS setup for Netlify frontend and local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(review.router)
app.include_router(export.router)
app.include_router(assistant.router)
app.include_router(auth.router)
app.include_router(vault.router)
app.include_router(references.router)

# Mount local frontend production assets if present (for Windows standalone executable & local mode)
import sys

def get_frontend_dist() -> str:
    # 1. PyInstaller bundled temp directory
    if hasattr(sys, "_MEIPASS"):
        meipass_dist = os.path.join(sys._MEIPASS, "frontend_dist")
        if os.path.exists(meipass_dist):
            return meipass_dist
    # 2. Local executable directory
    exe_dist = os.path.join(os.path.dirname(sys.executable), "frontend_dist")
    if os.path.exists(exe_dist):
        return exe_dist
    # 3. Source repository relative directory
    src_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
    if os.path.exists(src_dist):
        return src_dist
    return ""

FRONTEND_DIST = get_frontend_dist()
if FRONTEND_DIST and os.path.exists(os.path.join(FRONTEND_DIST, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

@app.get("/")
def root():
    if FRONTEND_DIST:
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            from fastapi.responses import FileResponse
            return FileResponse(index_file)
    return {
        "app": "LitBuddy",
        "status": "online",
        "docs": "/docs",
        "version": "4.0.0"
    }

@app.get("/api/health")
def health_check():
    """Lightweight health probe used by the desktop splash screen."""
    return {"status": "ok", "version": "4.1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
