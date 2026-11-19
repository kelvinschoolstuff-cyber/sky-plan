import os

import httpx


async def send_sms(to: str, message: str) -> str:
    """Africa's Talking SMS. Without AT_API_KEY this is a dry run that only prints the message."""
    key = os.getenv("AT_API_KEY")
    if not key:
        print(f"[dry-run SMS to {to}] {message}")
        return "dry-run"
    user = os.getenv("AT_USERNAME", "sandbox")
    host = "api.sandbox.africastalking.com" if user == "sandbox" else "api.africastalking.com"
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(f"https://{host}/version1/messaging", headers={"apiKey": key, "Accept": "application/json"},
                         data={"username": user, "to": to, "message": message[:300]})
        r.raise_for_status()
    return "sent"
