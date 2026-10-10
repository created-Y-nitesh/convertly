from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import HealthResponse
from app.db.mongodb import get_database
from app.converters.registry import SUPPORTED_ROUTES

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
@router.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    db = get_database()
    mongo_ok = db is not None
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        active_converters=len(SUPPORTED_ROUTES),
        mongodb_connected=mongo_ok
    )
