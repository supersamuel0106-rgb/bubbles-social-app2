from fastapi import APIRouter
from app.api.endpoints import profile

api_router = APIRouter()
api_router.include_router(profile.router, prefix="/profiles", tags=["profiles"])
