from fastapi import APIRouter
from typing import List, Dict
from app.converters.registry import SUPPORTED_FORMATS, SUPPORTED_ROUTES
from app.schemas.file import FormatDefinitionResponse, SupportedRouteResponse

router = APIRouter(prefix="/api/v1", tags=["Formats"])

@router.get("/formats", response_model=Dict[str, FormatDefinitionResponse])
async def list_formats():
    response = {}
    for fmt_id, meta in SUPPORTED_FORMATS.items():
        response[fmt_id] = FormatDefinitionResponse(
            id=meta.id,
            name=meta.name,
            extension=meta.extension,
            category=meta.category,
            max_size_bytes=meta.max_size_bytes,
            allowed_mime_types=meta.allowed_mime_types,
            description=meta.description
        )
    return response

@router.get("/conversions/supported", response_model=List[SupportedRouteResponse])
async def list_supported_conversions():
    return [
        SupportedRouteResponse(
            id=r.id,
            source_format=r.source_format,
            target_format=r.target_format,
            label=r.label,
            engine=r.engine,
            is_available=r.is_available,
            notes=r.notes
        )
        for r in SUPPORTED_ROUTES
    ]
