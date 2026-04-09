from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import NoResultFound
from app.model.profile import Profile
from app.schema.profile import ProfileCreate
from datetime import datetime

class ProfileRepository:
    """操作 Profile 表的具體實作"""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, profile_data: ProfileCreate) -> Profile:
        """建立新的 Profile"""
        new_profile = Profile(
            id=profile_data.id,
            username=profile_data.username,
            avatar_url=profile_data.avatar_url,
            latest_message="Just joined Bubbles!"
        )
        self.session.add(new_profile)
        await self.session.commit()
        await self.session.refresh(new_profile)
        return new_profile

    async def get_by_id(self, user_id: str) -> Profile | None:
        """根據 ID 取得 Profile"""
        result = await self.session.execute(select(Profile).where(Profile.id == user_id))
        return result.scalars().first()

    async def get_all_profiles(self) -> list[Profile]:
        """取得所有 Profile"""
        result = await self.session.execute(select(Profile))
        return list(result.scalars().all())

    async def update_message(self, user_id: str, new_message: str) -> Profile | None:
        """更新最新的留言內容"""
        profile = await self.get_by_id(user_id)
        if profile:
            profile.latest_message = new_message
            profile.updated_at = datetime.utcnow()
            await self.session.commit()
            await self.session.refresh(profile)
            return profile
        return None
