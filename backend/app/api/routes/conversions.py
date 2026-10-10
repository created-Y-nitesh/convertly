import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends, Query
from typing import Optional
from app.schemas.conversion import ConversionJobResponse
from app.services.conversion_service import conversion_service
from app.repositories.conversion_repository import conversion_repo
from app.core.security import rate_limit_dependency

router = APIRouter(prefix="/api/v1/conversions", tags=["Conversions"])

@router.post("", response_model=ConversionJobResponse, dependencies=[Depends(rate_limit_dependency)])
async def create_conversion(
    file: UploadFile = File(...),
    source_format: str = Form(...),
    target_format: str = Form(...),
    options: Optional[str] = Form(None)
):
    parsed_options = {}
    if options:
        try:
            parsed_options = json.loads(options)
        except Exception:
            pass

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    job = await conversion_service.process_conversion(
        file_bytes=content,
        original_filename=file.filename or "uploaded_document",
        source_format=source_format,
        target_format=target_format,
        options=parsed_options
    )
    
    return ConversionJobResponse(
        job_id=job["job_id"],
        original_filename=job["original_filename"],
        source_format=job["source_format"],
        target_format=job["target_format"],
        original_file_size=job["original_file_size"],
        status=job["status"],
        created_at=job["created_at"],
        completed_at=job.get("completed_at"),
        processing_duration_ms=job.get("processing_duration_ms"),
        result_filename=job.get("result_filename"),
        result_file_size=job.get("result_file_size"),
        error_code=job.get("error_code"),
        safe_error_description=job.get("safe_error_description"),
        download_url=job.get("download_url"),
        access_token=job.get("access_token"),
        expires_at=job["expires_at"]
    )

@router.get("/{job_id}", response_model=ConversionJobResponse)
async def get_conversion_job(
    job_id: str,
    token: Optional[str] = Query(None, description="Optional capability token to reveal private download URL")
):
    job = await conversion_repo.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Conversion job not found.")

    # Only disclose download_url and access_token if caller provides matching token
    is_owner = False
    stored_token = job.get("access_token")
    if token and stored_token:
        is_owner = await conversion_repo.validate_job_token(job_id, token)

    return ConversionJobResponse(
        job_id=job["job_id"],
        original_filename=job["original_filename"],
        source_format=job["source_format"],
        target_format=job["target_format"],
        original_file_size=job["original_file_size"],
        status=job["status"],
        created_at=job["created_at"],
        completed_at=job.get("completed_at"),
        processing_duration_ms=job.get("processing_duration_ms"),
        result_filename=job.get("result_filename"),
        result_file_size=job.get("result_file_size"),
        error_code=job.get("error_code"),
        safe_error_description=job.get("safe_error_description"),
        download_url=job.get("download_url") if is_owner else None,
        access_token=job.get("access_token") if is_owner else None,
        expires_at=job["expires_at"]
    )

@router.delete("/{job_id}")
async def cancel_or_delete_job(
    job_id: str,
    token: Optional[str] = Query(None, description="Capability token required to cancel or delete job")
):
    job = await conversion_repo.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or already deleted.")
        
    expected_token = job.get("access_token")
    if expected_token:
        if not token or not await conversion_repo.validate_job_token(job_id, token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Valid capability token required to delete this job."
            )

    success = await conversion_repo.delete_job(job_id)
    return {"success": success, "message": f"Job {job_id} deleted."}
