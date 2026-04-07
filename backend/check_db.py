import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

# 手動讀取根目錄的 .env
load_dotenv("../.env")

async def check_db():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("錯誤：找不到 DATABASE_URL，請確認 .env 檔案路徑。")
        return
        
    # 移除 URL 中的參數，改由 connect_args 傳入
    base_url = db_url.split("?")[0]
    print(f"正在連線至資料庫: {base_url.split('@')[-1]}")
    
    # 強制關閉語句快取，以相容 Supavisor Transaction mode
    engine = create_async_engine(
        base_url, 
        connect_args={"statement_cache_size": 0}
    )
    
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT id, username, avatar_url FROM profiles"))
            profiles = result.fetchall()
            print(f"\n目前資料庫共有 {len(profiles)} 筆資料：")
            if not profiles:
                print("資料庫目前是空的。")
            for p in profiles:
                # 只印出前 10 個字元避免洗版
                print(f"ID: {p[0]} | Username: {p[1]} | Avatar: {p[2][:40] if p[2] else 'None'}...")
    except Exception as e:
        print(f"查詢出錯: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
