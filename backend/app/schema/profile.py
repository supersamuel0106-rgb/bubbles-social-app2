from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProfileCreate(BaseModel):
    """建立 Profile 的請求結構"""
    id: str = Field(..., description="Supabase Auth 生成的使用者 ID")
    username: str = Field(..., description="使用者名稱")
    avatar_url: Optional[str] = Field(None, description="上傳到儲存桶的大頭貼路徑")

class ProfileUpdateMessage(BaseModel):
    """更新最新留言的請求結構"""
    message: str = Field(..., description="要顯示在漂浮泡泡上方的訊息")

class ProfileResponse(BaseModel):
    """回傳 Profile 的結構"""
    id: str
    username: str
    avatar_url: Optional[str]
    latest_message: Optional[str]
    updated_at: Optional[datetime]

    model_config = {
        "from_attributes": True
    }
