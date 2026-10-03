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
      background: linear-gradient(135deg, #1a1b2e 0%, #0d1117 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 52px;
      box-shadow: 0 0 48px rgba(138,180,248,0.25), 0 0 16px rgba(138,180,248,0.12);
      animation: pulse 2s ease-in-out infinite;
    }}
    @keyframes pulse {{
      0%,100% {{ box-shadow: 0 0 48px rgba(138,180,248,0.25), 0 0 16px rgba(138,180,248,0.12); }}
      50%  {{ box-shadow: 0 0 72px rgba(138,180,248,0.45), 0 0 32px rgba(138,180,248,0.22); }}
    }}
    h1 {{
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
      background: linear-gradient(90deg, #8ab4f8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}
    .sub {{
      font-size: 13px;
      color: #5f6368;
      letter-spacing: 0.3px;
    }}
    .dots {{
      display: flex;
      gap: 8px;
    }}
    .dot {{
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #8ab4f8;
      animation: bounce 1.4s ease-in-out infinite;
    }}
    .dot:nth-child(2) {{ animation-delay: 0.16s; }}
    .dot:nth-child(3) {{ animation-delay: 0.32s; }}
    @keyframes bounce {{
      0%,80%,100% {{ transform: scale(0.7); opacity: 0.4; }}
      40% {{ transform: scale(1.0); opacity: 1; }}
    }}
    .status {{ font-size: 12px; color: #3c4043; margin-top: -16px; }}
  </style>
</head>
<body>
  <div class="logo">📚</div>
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
