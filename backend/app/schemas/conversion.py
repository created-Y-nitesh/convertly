from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ConversionOptionsSchema(BaseModel):
    image_quality: Optional[float] = Field(default=0.92, ge=0.1, le=1.0)
    csv_delimiter: Optional[str] = Field(default=",", max_length=1)
    preserve_formatting: Optional[bool] = True

class CreateConversionJobRequest(BaseModel):
    source_format: str
    target_format: str
    options: Optional[ConversionOptionsSchema] = Field(default_factory=ConversionOptionsSchema)

class ConversionJobResponse(BaseModel):
    job_id: str
    original_filename: str
    source_format: str
    target_format: str
    original_file_size: int
    status: str # idle, validating, processing, completed, failed, cancelled
    created_at: datetime
    completed_at: Optional[datetime] = None
    processing_duration_ms: Optional[int] = None
    result_filename: Optional[str] = None
    result_file_size: Optional[int] = None
    error_code: Optional[str] = None
    safe_error_description: Optional[str] = None
    download_url: Optional[str] = None
    access_token: Optional[str] = None
    expires_at: datetime

class ConversionHistoryItem(BaseModel):
    job_id: str
    original_filename: str
    source_format: str
    target_format: str
    original_file_size: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    error_code: Optional[str] = None
