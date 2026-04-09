import asyncio
from app.api.deps import engine
from sqlalchemy import text

async def check():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT id, username, latest_message FROM profiles"))
        profiles = res.fetchall()
        for p in profiles:
            print(f"User: {p.username}, Message: {p.latest_message}")

if __name__ == "__main__":
    asyncio.run(check())
