"""Send a short alert digest by SMS to users who opted in. Run daily from cron: python -m app.send_alerts"""
import asyncio

from sqlalchemy import select

from .db import SessionLocal, User
from .main import build_alerts
from .notify import send_sms


async def main():
    with SessionLocal() as db:
        for u in db.scalars(select(User).where(User.sms_alerts.is_(True), User.phone.is_not(None))):
            items = await build_alerts(u, db)
            if items:
                text = "AgriCast: " + " | ".join(f"{a['farm_crop']}: {a['message']}" for a in items[:3])
                print(u.email, await send_sms(u.phone, text + " General info only."))


if __name__ == "__main__":
    asyncio.run(main())
