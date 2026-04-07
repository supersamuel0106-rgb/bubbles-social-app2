
import asyncio
from sqlalchemy import text
from app.api.deps import engine

async def query_db():
    async with engine.connect() as conn:
        print("Checking profiles in DB...")
        result = await conn.execute(text("SELECT id, username, avatar_url, latest_message FROM profiles;"))
        rows = result.fetchall()
        print(f"Total rows: {len(rows)}")
        for r in rows:
            print(r)

if __name__ == "__main__":
    asyncio.run(query_db())
