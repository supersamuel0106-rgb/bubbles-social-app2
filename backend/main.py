import logging
import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 確保在 Vercel 生產環境中能正確找到 app 資料夾
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.api.router import api_router
from app.core.config import settings
from app.api.deps import engine
from app.model.profile import Base

# 設定日誌
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

# 允許我們的前端 Vite Dev Server 可以跨網域存取
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "*"
    ], # 在正式環境請限縮 origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 可選：在開發環境啟動時自動建立資料庫表結構 (如果不使用 alembic)
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing database...")
    async with engine.begin() as conn:
        # 請注意，這不會運作資料遷移 (Migration)
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Application starting up.")

app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
