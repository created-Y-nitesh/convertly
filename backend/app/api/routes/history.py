import secrets
from fastapi import APIRouter, Query, Header
from typing import List, Optional
from app.schemas.conversion import ConversionHistoryItem
from app.repositories.conversion_repository import conversion_repo
from app.core.config import settings

router = APIRouter(prefix="/api/v1/history", tags=["History"])

@router.get("", response_model=List[ConversionHistoryItem])
async def get_conversion_history(
    limit: int = Query(default=20, ge=1, le=100),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")
):
    """
    Returns recent conversion events.
    To prevent cross-user document leakage, original filenames are masked
    unless authenticated with the administrative X-Admin-Key header.
    """
    is_admin = False
    if settings.ADMIN_API_KEY and x_admin_key:
        is_admin = secrets.compare_digest(settings.ADMIN_API_KEY, x_admin_key)

    jobs = await conversion_repo.list_recent_jobs(limit=limit)
    items = []
    for j in jobs:
        raw_name = j.get("original_filename", "document")
        if not is_admin:
            ext = ("." + raw_name.rsplit(".", 1)[-1]) if "." in raw_name else ""
            display_name = f"document_{j['job_id'][-6:]}{ext}"
        else:
            display_name = raw_name

        items.append(
            ConversionHistoryItem(
                job_id=j["job_id"],
                original_filename=display_name,
                source_format=j["source_format"],
                target_format=j["target_format"],
                original_file_size=j.get("original_file_size", 0),
                status=j.get("status", "completed"),
                created_at=j["created_at"],
                completed_at=j.get("completed_at"),
                duration_ms=j.get("processing_duration_ms"),
                error_code=j.get("error_code")
            )
        )
    return items
