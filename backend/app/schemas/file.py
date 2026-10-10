from pydantic import BaseModel, Field
from typing import List, Optional

class FormatDefinitionResponse(BaseModel):
    id: str
    name: str
    extension: str
    category: str
    max_size_bytes: int
    allowed_mime_types: List[str]
    description: str

class SupportedRouteResponse(BaseModel):
    id: str
    source_format: str
    target_format: str
    label: str
    engine: str
    is_available: bool
    notes: Optional[str] = None
