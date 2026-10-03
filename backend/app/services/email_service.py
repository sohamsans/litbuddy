import os
import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional, Dict, Any

def generate_verification_code() -> str:
    """Generate secure 6-digit numeric verification code."""
    return str(secrets.randbelow(900000) + 100000)

async def send_verification_email(to_email: str, username: str, code: str) -> Dict[str, Any]:
    """
    Send verification email containing 6-digit code.
    If SMTP credentials are provided (SMTP_HOST, SMTP_USER, SMTP_PASSWORD),
    sends via SMTP server. If unconfigured, falls back to logging.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "no-reply@litbuddy.ai")

    print(f"\n==================================================")
    print(f"[LitBuddy Email Verification]")
    print(f"To: {to_email} (User: {username})")
    print(f"Verification Code: {code}")
    print(f"Expires: 15 minutes")
    print(f"==================================================\n")

    if not smtp_host or not smtp_user or not smtp_pass:
        return {
            "sent": False,
            "dev_code": code,
            "message": f"Verification code generated: {code} (SMTP unconfigured; check console or dev code)"
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your LitBuddy Verification Code: {code}"
        msg["From"] = smtp_from
        msg["To"] = to_email

        text_content = f"""Hi {username},

Welcome to LitBuddy! Your 6-digit account verification code is:

{code}

This code will expire in 15 minutes.
If you did not request this account, please ignore this message.

— LitBuddy Team
"""

        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LitBuddy Verification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #131314; color: #e3e3e3; margin: 0; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #1e1f20; border-radius: 16px; border: 1px solid #3c4043; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #8ab4f8; font-size: 24px; margin: 0; font-weight: 600;">LitBuddy</h1>
      <p style="color: #9aa0a6; font-size: 13px; margin-top: 6px;">Autonomous Literature Review &amp; Synthesis</p>
    </div>
    
    <p style="font-size: 14px; line-height: 1.5; color: #e3e3e3;">Hi <strong>{username}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.5; color: #c4c7c5;">
      Use the following 6-digit verification code to complete your LitBuddy account registration and sync your research:
    </p>
    
    <div style="text-align: center; margin: 28px 0;">
      <div style="display: inline-block; padding: 14px 28px; background-color: #282a2c; border: 1px solid #8ab4f8; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #8ab4f8; font-family: monospace;">
        {code}
      </div>
    </div>
    
    <p style="font-size: 12px; color: #9aa0a6; line-height: 1.4;">
      This code is valid for <strong>15 minutes</strong>. If you did not create a LitBuddy account, please ignore this email.
    </p>
    
    <div style="border-top: 1px solid #3c4043; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 11px; color: #5f6368;">
      LitBuddy AI &bull; Client-Isolated Encrypted Literature Engine
    </div>
  </div>
</body>
</html>"""

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            server.starttls()

        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()

        return {
            "sent": True,
            "message": f"Verification code sent to {to_email}"
        }
    except Exception as e:
        print(f"[SMTP Send Error] {e}")
        return {
            "sent": False,
            "dev_code": code,
            "error": str(e),
            "message": f"Could not deliver email: {str(e)}. (Dev code: {code})"
        }
