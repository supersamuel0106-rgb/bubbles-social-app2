from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repository.profile_repo import ProfileRepository
from app.schema.profile import ProfileCreate, ProfileResponse, ProfileUpdateMessage

class ProfileService:
    """
    商業邏輯層：所有的權限判斷或跨表邏輯都在此處理。
    """
    
    def __init__(self, session: AsyncSession):
        self.repo = ProfileRepository(session)

    async def create_profile(self, profile_data: ProfileCreate, current_user_id: str) -> ProfileResponse:
        """
        建立個人資訊
        確認：當前登入者只能替自己建立 Profile。
        """
        if profile_data.id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="沒有權限替其他使用者建立個人資訊"
            )
            
        existing = await self.repo.get_by_id(profile_data.id)
        if existing:
            # 或者回傳已存的 profile
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="使用者資訊已存在"
            )

        profile = await self.repo.create(profile_data)
        return ProfileResponse.model_validate(profile)

    async def get_profile(self, user_id: str) -> ProfileResponse:
        """
        獲取特定用戶的個人資訊
        """
        profile = await self.repo.get_by_id(user_id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="找不到該使用者資訊"
            )
        return ProfileResponse.model_validate(profile)

    async def get_all_profiles(self) -> list[ProfileResponse]:
        """
        獲取所有用戶的個人資訊
        """
        profiles = await self.repo.get_all_profiles()
        return [ProfileResponse.model_validate(profile) for profile in profiles]

    async def update_message(self, user_id: str, data: ProfileUpdateMessage, current_user_id: str) -> ProfileResponse:
        """
        更新留言
        確認：只有使用者本人可以更新自己的留言。
        """
        if user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="只能更新專屬於您個人的泡泡留言"
            )

        updated_profile = await self.repo.update_message(user_id, data.message)
        if not updated_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="找不到該使用者資訊"
            )
        return ProfileResponse.model_validate(updated_profile)
