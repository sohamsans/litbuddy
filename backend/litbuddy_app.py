"""
LitBuddy Standalone Desktop Application — Native Windows Window (pywebview).
Launches FastAPI backend as a local server thread, then opens a dedicated native
application window using pywebview (WebView2 / Edge Chromium — built into Windows 10/11).

FIX: Shows an animated HTML splash screen while the backend initialises.
     The splash page polls /api/health every 800ms and navigates once the server is up.
     This eliminates the "can't reach this page" error on first launch.
"""
import os
import sys
import time
import threading
import socket
import uvicorn

# ── Path Resolution ──────────────────────────────────────────────────────────
if getattr(sys, "frozen", False):
    BASE_DIR = os.path.dirname(sys.executable)
    MEIPASS_DIR = getattr(sys, "_MEIPASS", BASE_DIR)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    MEIPASS_DIR = BASE_DIR

if MEIPASS_DIR not in sys.path:
    sys.path.insert(0, MEIPASS_DIR)

# ── Persistent data directories (next to the .exe) ───────────────────────────
APP_DATA_DIR = os.path.join(BASE_DIR, "app_data")
PAPERS_DIR = os.path.join(BASE_DIR, "LitBuddy Papers")
os.makedirs(APP_DATA_DIR, exist_ok=True)
os.makedirs(PAPERS_DIR, exist_ok=True)
os.makedirs(os.path.join(APP_DATA_DIR, "figures"), exist_ok=True)

PORT = 8000
ICON_PATH = os.path.join(BASE_DIR, "icon.ico") if getattr(sys, "frozen", False) \
    else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icon.ico")


# ── Splash HTML — shown while backend is starting ───────────────────────────
SPLASH_HTML = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LitBuddy — Starting...</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      background: #131314;
      color: #e3e3e3;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 32px;
      user-select: none;
    }}
    .logo {{
      width: 96px;
      height: 96px;
      border-radius: 22px;
      background: #0c0d10;
      border: 1.5px solid #23262d;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
      animation: pulse 2.5s ease-in-out infinite;
    }}
    @keyframes pulse {{
      0%,100% {{ transform: scale(1); box-shadow: 0 16px 40px rgba(0,0,0,0.6); }}
      50%  {{ transform: scale(1.02); box-shadow: 0 20px 48px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.06); }}
    }}
    h1 {{
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.5px;
      color: #f8fafc;
    }}
    .sub {{
      font-size: 13px;
      color: #64748b;
      letter-spacing: 0.2px;
    }}
    .dots {{
      display: flex;
      gap: 8px;
    }}
    .dot {{
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #94a3b8;
      animation: bounce 1.4s ease-in-out infinite;
    }}
    .dot:nth-child(2) {{ animation-delay: 0.16s; }}
    .dot:nth-child(3) {{ animation-delay: 0.32s; }}
    @keyframes bounce {{
      0%,80%,100% {{ transform: scale(0.7); opacity: 0.3; }}
      40% {{ transform: scale(1.0); opacity: 1; }}
    }}
    .status {{ font-size: 12px; color: #475569; margin-top: -16px; }}
  </style>
</head>
<body>
  <div class="logo">
    <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="splash-silver" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="50%" stop-color="#E2E8F0" />
          <stop offset="100%" stop-color="#94A3B8" />
        </linearGradient>
      </defs>
      <path d="M13 21L32 27.5L51 21V43.5L32 50L13 43.5V21Z" stroke="#334155" stroke-width="2" stroke-linejoin="round" fill="#13161C"/>
      <path d="M17 18L32 24.5L47 18V41L32 47.5L17 41V18Z" stroke="url(#splash-silver)" stroke-width="2.5" stroke-linejoin="round" fill="#181B22"/>
      <path d="M32 24.5V47.5" stroke="url(#splash-silver)" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M22 23V36.5H29" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M35 24.5L43 32L35 39.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M35 32H41.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  </div>
  <div style="text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center">
    <h1>LitBuddy</h1>
    <p class="sub">Autonomous Literature Review &amp; Vault</p>
  </div>
  <div class="dots">
    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
  </div>
  <p class="status" id="msg">Initializing backend...</p>
  <script>
    var attempts = 0;
    var maxAttempts = 60;  // 60 × 800ms = 48 seconds max
    function checkReady() {{
      attempts++;
      document.getElementById('msg').textContent =
        'Starting services... (' + attempts + 's)';
      fetch('http://127.0.0.1:{PORT}/api/health')
        .then(function(r) {{
          if (r.ok || r.status === 200 || r.status === 404) {{
            // Server is up — navigate to the app
            document.getElementById('msg').textContent = 'Ready! Loading app...';
            setTimeout(function() {{
              window.location = 'http://127.0.0.1:{PORT}/';
            }}, 300);
          }} else {{
            if (attempts < maxAttempts) setTimeout(checkReady, 800);
          }}
        }})
        .catch(function() {{
          if (attempts < maxAttempts) setTimeout(checkReady, 800);
          else document.getElementById('msg').textContent = 'Backend failed to start. Please restart.';
        }});
    }}
    // Start polling after 1s initial delay
    setTimeout(checkReady, 1000);
  </script>
</body>
</html>"""


def _start_backend():
    """Start the FastAPI/Uvicorn server in a background daemon thread with logging."""
    log_path = os.path.join(APP_DATA_DIR, "backend_startup.log")
    try:
        with open(log_path, "w", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Starting LitBuddy backend on port {PORT}...\n")
        from app.main import app as fastapi_app
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] app.main imported successfully. Launching uvicorn...\n")
        uvicorn.run(
            fastapi_app,
            host="127.0.0.1",
            port=PORT,
            log_level="warning",
            access_log=False
        )
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        print(f"[Backend Fatal Error]: {err_msg}")
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] FATAL STARTUP ERROR:\n{err_msg}\n")


def _is_port_open(port: int, timeout: float = 0.5) -> bool:
    """Fast TCP socket check — much faster than HTTP polling."""
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=timeout):
            return True
    except OSError:
        return False


def main():
    print("=" * 65)
    print("  LitBuddy — Autonomous Academic Literature Review & Vault")
    print("  Version: 4.1.0 (Native Desktop Edition)")
    print(f"  Backend: http://127.0.0.1:{PORT}")
    print(f"  Data:    {APP_DATA_DIR}")
    print("=" * 65)

    # ── Start backend in daemon thread ───────────────────────────────────────
    backend_thread = threading.Thread(target=_start_backend, daemon=True)
    backend_thread.start()

    # ── Open native desktop window via pywebview ─────────────────────────────
    try:
        import webview

        # Resolve icon path — look next to exe first, then source tree
        icon = None
        for candidate in [
            ICON_PATH,
            os.path.join(BASE_DIR, "icon.ico"),
            os.path.join(MEIPASS_DIR, "icon.ico"),
        ]:
            if os.path.exists(candidate):
                icon = candidate
                break

        window = webview.create_window(
            title="LitBuddy",
            html=SPLASH_HTML,          # ← Show splash immediately (no network needed)
            width=1360,
            height=860,
            resizable=True,
            min_size=(960, 640),
            background_color="#131314",
            text_select=True,
        )

        # pywebview start — blocks until user closes window
        webview.start(
            debug=False,
            private_mode=False,
            storage_path=os.path.join(APP_DATA_DIR, "webview_storage"),
            **({"icon": icon} if icon else {}),
        )

    except ImportError:
        # Fallback: open in system browser if pywebview is unavailable
        print("[LitBuddy] pywebview not available — opening in system browser.")
        # Wait for server synchronously before opening browser
        for _ in range(60):
            if _is_port_open(PORT):
                break
            time.sleep(0.5)
        import webbrowser
        webbrowser.open(f"http://127.0.0.1:{PORT}/")
        backend_thread.join()


if __name__ == "__main__":
    main()
