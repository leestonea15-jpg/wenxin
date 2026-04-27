from fastapi import APIRouter
from .daily_speed import router as daily_speed_router
from .guanyin import router as guanyin_router
from .metrics import router as metrics_router

api_router = APIRouter(prefix="/api")

api_router.include_router(daily_speed_router)
api_router.include_router(guanyin_router)
api_router.include_router(metrics_router)

__all__ = ["api_router"]
