from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime

class ApiResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Any] = None

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str
    environment: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    active_converters: int
    mongodb_connected: bool
