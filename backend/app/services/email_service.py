import os
import smtplib
import secrets
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from typing import Dict, Any

def generate_verification_code() -> str:
    """Generate secure 6-digit numeric verification code."""
    return str(secrets.randbelow(900000) + 100000)

def _build_email_contents(username: str, code: str) -> tuple[str, str]:
    text_content = f"""Hi {username},

Welcome to LitBuddy! Your 6-digit account verification code is:

{code}

This code will expire in 15 minutes.
If you did not request this account, please ignore this email.

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
    return text_content, html_content

async def send_verification_email(to_email: str, username: str, code: str) -> Dict[str, Any]:
    """
    Send verification email containing the 6-digit code directly to user's inbox.
    Supports:
    1. Resend API (RESEND_API_KEY) - Fast HTTP email API (100 free emails/day)
    2. Standard SMTP (Gmail App Password, Brevo, SendGrid, etc.)
    """
    text_content, html_content = _build_email_contents(username, code)
    subject = f"Your LitBuddy Verification Code: {code}"

    # Method 1: Resend HTTP API (Fastest and highest delivery rate)
    resend_api_key = os.getenv("RESEND_API_KEY")
    if resend_api_key and resend_api_key.startswith("re_"):
        try:
            from_email = os.getenv("EMAIL_FROM", "LitBuddy <onboarding@resend.dev>")
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": from_email,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                        "text": text_content
                    }
                )
                if res.status_code in (200, 201):
                    return {"sent": True, "message": f"Verification email sent to {to_email}"}
                else:
                    err_json = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
                    err_msg = err_json.get("message", res.text)
                    print(f"[Resend API Error] {res.status_code}: {err_msg}")
                    return {"sent": False, "error": f"Resend API error: {err_msg}"}
        except Exception as e:
            print(f"[Resend Dispatch Exception] {e}")
            return {"sent": False, "error": str(e)}

    # Method 2: Standard SMTP (Gmail, Brevo, custom mail server)
    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")

    if smtp_host and smtp_user and smtp_pass:
        try:
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            smtp_from = os.getenv("SMTP_FROM", smtp_user)

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = to_email

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            if smtp_port == 465:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
                server.starttls()

            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [to_email], msg.as_string())
            server.quit()

            return {"sent": True, "message": f"Verification email sent to {to_email}"}
        except Exception as e:
            print(f"[SMTP Send Error] {e}")
            return {"sent": False, "error": f"SMTP delivery failed: {str(e)}"}

    # If neither is configured
    print(f"\n[ALERT] No email provider configured! Set RESEND_API_KEY or SMTP_HOST/USER/PASSWORD in environment.")
    return {
        "sent": False,
        "error": "Email service is not configured on the backend. Please configure RESEND_API_KEY or SMTP credentials."
    }
