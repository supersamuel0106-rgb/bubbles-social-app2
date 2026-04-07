from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schema.profile import ProfileCreate, ProfileResponse, ProfileUpdateMessage
from app.service.profile_service import ProfileService
from app.api.deps import get_db
from app.core.security import get_current_user_id

router = APIRouter()

@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: ProfileCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    建立新的使用者 Profile，需攜帶驗證通過的 token。
    """
    service = ProfileService(db)
    return await service.create_profile(profile_data, current_user_id)

@router.get("/", response_model=list[ProfileResponse])
async def get_all_profiles(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取所有使用者的 Profile (供多人互動畫面使用)。
    """
    service = ProfileService(db)
    return await service.get_all_profiles()

@router.get("/{user_id}", response_model=ProfileResponse)
async def get_profile(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    取得使用者的 Profile。
    (目前開放登入者皆可觀看)
    """
    service = ProfileService(db)
    return await service.get_profile(user_id)

@router.patch("/{user_id}/message", response_model=ProfileResponse)
async def update_profile_message(
    user_id: str,
    data: ProfileUpdateMessage,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    更新使用者的漂浮泡泡最新留言內容。
    """
    service = ProfileService(db)
    return await service.update_message(user_id, data, current_user_id)
