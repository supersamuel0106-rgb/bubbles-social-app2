import asyncio
from app.api.deps import engine
from sqlalchemy import text
from app.schema.profile import ProfileResponse

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT * FROM profiles"))
        for row in res.mappings():
            print(f"Row Dict: {dict(row)}")

if __name__ == "__main__":
    asyncio.run(check())
