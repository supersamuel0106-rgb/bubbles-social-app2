from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Profile(Base):
    """
    Profile ORM 模型，對應 Supabase 的 profiles 資料表。
    """
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, index=True) # 與 Auth User ID 相同 (UUID)
    username = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    latest_message = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
