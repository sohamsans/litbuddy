import os
import sys
import socket
import logging
import threading
import subprocess
import re
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tablet", tags=["Wireless Tablet Stylus & Remote Control Bridge"])

# Global tunnel state
tunnel_state = {
    "public_url": None,
    "active": False,
    "process": None
}

# In-memory store for last submitted drawing/annotation from tablet
latest_drawing = {
    "image_data": None,
    "svg_data": None,
    "timestamp": None
}

class SubmitDrawingRequest(BaseModel):
    image_data: Optional[str] = None # Base64 PNG
    svg_data: Optional[str] = None

def _start_public_tunnel(port: int = 8000):
    """
    Launch an encrypted public internet tunnel using localhost.run or serveo via OpenSSH.
    Allows remote phone/tablet access anywhere across mobile data and cellular networks.
    """
    global tunnel_state
    if tunnel_state["active"] and tunnel_state["public_url"]:
        return

    def run_tunnel():
        try:
            # -o StrictHostKeyChecking=no bypasses prompt
            cmd = [
                "ssh",
                "-o", "StrictHostKeyChecking=no",
                "-o", "UserKnownHostsFile=/dev/null",
                "-R", f"80:127.0.0.1:{port}",
                "nokey@localhost.run"
            ]
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            tunnel_state["process"] = proc
            tunnel_state["active"] = True

            for line in iter(proc.stdout.readline, ""):
                if not line:
                    break
                # Look for assigned https URL
                match = re.search(r"https://[a-zA-Z0-9.\-]+\.lhr\.life", line) or re.search(r"https://[a-zA-Z0-9.\-]+\.localhost\.run", line)
                if match:
                    assigned_url = match.group(0)
                    tunnel_state["public_url"] = assigned_url
                    logger.info(f"[Remote Public Tunnel Active]: {assigned_url}")
                    break

            proc.wait()
        except Exception as e:
            logger.warning(f"Public tunnel startup error: {e}")
        finally:
            tunnel_state["active"] = False

    t = threading.Thread(target=run_tunnel, daemon=True)
    t.start()

@router.get("/info")
def get_tablet_bridge_info():
    """Retrieve LAN IP address and direct URL for iPad / Android tablet pairing."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "127.0.0.1"

    port = int(os.environ.get("PORT", 8000))
    local_tablet_url = f"http://{local_ip}:{port}/tablet-pad"

    # Start public tunnel in background if not already started
    _start_public_tunnel(port)

    # If public URL is ready, construct public link
    public_url = tunnel_state.get("public_url")
    public_tablet_url = f"{public_url}/tablet-pad" if public_url else None
    public_app_url = public_url if public_url else None

    return {
        "local_ip": local_ip,
        "port": port,
        "tablet_url": local_tablet_url,
        "public_url": public_app_url,
        "public_tablet_url": public_tablet_url,
        "instructions": "Open on iPad (Apple Pencil) or Android tablet (S-Pen). Works on local Wi-Fi and remote cellular data!"
    }

@router.post("/tunnel/start")
def trigger_public_tunnel():
    """Explicitly trigger or restart the public internet port tunnel."""
    port = int(os.environ.get("PORT", 8000))
    _start_public_tunnel(port)
    return {"status": "starting", "tunnel_url": tunnel_state.get("public_url")}

@router.post("/submit")
def submit_tablet_drawing(req: SubmitDrawingRequest):
    """Receive handwritten math or diagram drawing from wireless tablet."""
    import time
    latest_drawing["image_data"] = req.image_data
    latest_drawing["svg_data"] = req.svg_data
    latest_drawing["timestamp"] = time.time()
    return {"status": "success", "received": bool(req.image_data or req.svg_data)}

@router.get("/latest")
def get_latest_drawing():
    """Fetch the latest drawing received from tablet."""
    return latest_drawing
