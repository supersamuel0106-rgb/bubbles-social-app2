
import asyncio
from sqlalchemy import text
from app.api.deps import engine

async def inspect():
    async with engine.connect() as conn:
        print("正在讀取 profiles 資料表欄位資訊...")
        result = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profiles';
        """))
        columns = result.fetchall()
        if not columns:
            print("找不到 profiles 資料表。")
        else:
            print("profiles 資料表欄位：")
            for col in columns:
                print(f"- {col[0]} ({col[1]})")

if __name__ == "__main__":
    asyncio.run(inspect())
