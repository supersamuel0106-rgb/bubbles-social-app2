from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Atelier Social API"
    # Postgres 連線字串 (Async版)
    DATABASE_URL: str
    # 用於驗證來自 Supabase 發出的 JWT token
    SUPABASE_JWT_SECRET: str
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
