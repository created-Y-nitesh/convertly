from fastapi import APIRouter, HTTPException, status, Query, Header
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Optional
from app.repositories.conversion_repository import conversion_repo

router = APIRouter(prefix="/api/v1/conversions", tags=["Downloads"])

@router.get("/{job_id}/download")
async def download_converted_file(
    job_id: str,
    token: Optional[str] = Query(None, description="Cryptographic download capability token"),
    authorization: Optional[str] = Header(None, description="Optional Bearer authorization header")
):
    """
    Downloads the converted binary. Enforces capability-based token authorization.
    Requires the unguessable capability token created during conversion.
    """
    job = await conversion_repo.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Conversion job not found.")

    # Capability Token Extraction
    bearer_token = None
    if authorization and authorization.lower().startswith("bearer "):
        bearer_token = authorization[7:].strip()
    candidate_token = token or bearer_token

    # Verify authorization
    expected_token = job.get("access_token")
    if expected_token:
        if not candidate_token or not await conversion_repo.validate_job_token(job_id, candidate_token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Invalid or missing download capability token."
            )

    if job.get("status") != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not yet converted or conversion failed."
        )

    storage_path = job.get("storage_path")
    if not storage_path or not Path(storage_path).exists():
        raise HTTPException(status_code=410, detail="Requested converted document has expired and was removed.")

    filename = job.get("result_filename") or "converted_document"

    return FileResponse(
        path=storage_path,
        filename=filename,
        media_type="application/octet-stream"
    )
