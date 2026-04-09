import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import engine
from app.service.profile_service import ProfileService

async def verify():
    async with AsyncSession(engine) as session:
        service = ProfileService(session)
        profiles = await service.get_all_profiles()
        print(f"Total profiles fetched: {len(profiles)}")
        for p in profiles:
            print(f"User: {p.username}")
            print(f"  ID: {p.id}")
            print(f"  Latest Message: '{p.latest_message}'")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(verify())
