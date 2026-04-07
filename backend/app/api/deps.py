from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator
from app.core.config import settings

# 設定 SQLAlchemy 引擎，並關閉語句快取以相容 Supavisor Transaction 模式
engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=False,
    connect_args={"statement_cache_size": 0}
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """取得資料庫的 AsyncSession"""
    async with AsyncSessionLocal() as session:
        yield session
