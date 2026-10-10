import secrets
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Any, Tuple
from fastapi import HTTPException, status

from app.core.security import verify_file_magic_header, sanitize_filename
from app.core.logging import logger
from app.converters.registry import get_route, SUPPORTED_FORMATS
from app.services.storage_service import storage_service
from app.repositories.conversion_repository import conversion_repo
from app.services.sheets_service import sheets_service

from app.converters.image_converter import convert_raster_image
from app.converters.spreadsheet_converter import convert_csv_to_xlsx, convert_xlsx_to_csv
from app.converters.office_converter import convert_docx_to_txt, convert_docx_to_pdf
from app.converters.pdf_converter import (
    convert_pdf_to_images,
    convert_pdf_to_txt,
    convert_pdf_to_docx,
    convert_txt_to_pdf
)

class ConversionService:
    async def process_conversion(
        self,
        file_bytes: bytes,
        original_filename: str,
        source_format: str,
        target_format: str,
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        start_time = time.time()
        job_id = f"job_{uuid.uuid4().hex[:16]}"
        access_token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=24)
        
        src_fmt = source_format.lower()
        tgt_fmt = target_format.lower()
        
        # 1. Validation
        if src_fmt not in SUPPORTED_FORMATS:
            raise HTTPException(status_code=400, detail=f"Unsupported source format: {src_fmt}")
        if tgt_fmt not in SUPPORTED_FORMATS:
            raise HTTPException(status_code=400, detail=f"Unsupported target format: {tgt_fmt}")
            
        fmt_meta = SUPPORTED_FORMATS[src_fmt]
        if len(file_bytes) > fmt_meta.max_size_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum size limit of {fmt_meta.max_size_bytes // (1024*1024)} MB."
            )
            
        route = get_route(src_fmt, tgt_fmt)
        if not route:
            raise HTTPException(
                status_code=400,
                detail=f"Conversion route from {src_fmt.upper()} to {tgt_fmt.upper()} is not supported."
            )
            
        if not verify_file_magic_header(file_bytes, src_fmt):
            logger.warning(f"File signature mismatch for job {job_id}")
            raise HTTPException(
                status_code=400,
                detail=f"File signature mismatch. The file content does not match the valid {src_fmt.upper()} format header."
            )
            
        # Run opportunistic sweep of expired files
        storage_service.purge_expired_files()
            
        # 2. Ephemeral Storage
        input_path, clean_name = await storage_service.save_uploaded_file(job_id, original_filename, file_bytes)
        base_name = clean_name.rsplit(".", 1)[0]
        out_ext = SUPPORTED_FORMATS[tgt_fmt].extension
        result_filename = f"{base_name}_converted{out_ext}"
        output_path = storage_service.get_output_path(job_id, result_filename)
        
        # Create initial record in MongoDB
        job_dict = {
            "job_id": job_id,
            "access_token": access_token,
            "original_filename": clean_name,
            "source_format": src_fmt,
            "target_format": tgt_fmt,
            "original_file_size": len(file_bytes),
            "status": "processing",
            "created_at": now,
            "expires_at": expires_at,
            "storage_path": str(output_path),
            "result_filename": result_filename
        }
        await conversion_repo.save_job(job_dict)
        
        # 3. Execution
        try:
            if src_fmt in ["png", "jpg", "jpeg", "webp"] and tgt_fmt in ["png", "jpg", "jpeg", "webp", "pdf"]:
                convert_raster_image(input_path, output_path, tgt_fmt, options)
            elif src_fmt == "csv" and tgt_fmt == "xlsx":
                convert_csv_to_xlsx(input_path, output_path, options)
            elif src_fmt == "xlsx" and tgt_fmt == "csv":
                convert_xlsx_to_csv(input_path, output_path, options)
            elif src_fmt == "docx" and tgt_fmt == "txt":
                convert_docx_to_txt(input_path, output_path, options)
            elif src_fmt == "docx" and tgt_fmt == "pdf":
                convert_docx_to_pdf(input_path, output_path, options)
            elif src_fmt == "pdf" and tgt_fmt in ["png", "jpg"]:
                convert_pdf_to_images(input_path, output_path, tgt_fmt, options)
            elif src_fmt == "pdf" and tgt_fmt == "txt":
                convert_pdf_to_txt(input_path, output_path, options)
            elif src_fmt == "pdf" and tgt_fmt == "docx":
                convert_pdf_to_docx(input_path, output_path, options)
            elif src_fmt == "txt" and tgt_fmt == "pdf":
                convert_txt_to_pdf(input_path, output_path, options)
            else:
                raise ValueError(f"Conversion engine not mapped for {src_fmt} -> {tgt_fmt}")
                
            # Verify output file
            if not output_path.exists() or output_path.stat().st_size == 0:
                raise RuntimeError("Conversion produced zero-byte output file.")
                
            duration_ms = int((time.time() - start_time) * 1000)
            result_size = output_path.stat().st_size
            
            job_dict.update({
                "status": "completed",
                "completed_at": datetime.now(timezone.utc),
                "processing_duration_ms": duration_ms,
                "result_file_size": result_size,
                "error_code": None,
                "download_url": f"/api/v1/conversions/{job_id}/download?token={access_token}"
            })
            await conversion_repo.save_job(job_dict)
            
            # Asynchronously send audit log to Google Sheets
            await sheets_service.log_conversion_event(job_dict)
            
            return job_dict
            
        except HTTPException as he:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error(f"Conversion job {job_id} failed with HTTP {he.status_code}: {he.detail}")
            job_dict.update({
                "status": "failed",
                "completed_at": datetime.now(timezone.utc),
                "processing_duration_ms": duration_ms,
                "error_code": "ENGINE_UNAVAILABLE" if he.status_code == 503 else "PROCESSING_ERROR",
                "safe_error_description": str(he.detail)
            })
            await conversion_repo.save_job(job_dict)
            await sheets_service.log_conversion_event(job_dict)
            raise he
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error(f"Conversion job {job_id} failed: {str(e)}")
            job_dict.update({
                "status": "failed",
                "completed_at": datetime.now(timezone.utc),
                "processing_duration_ms": duration_ms,
                "error_code": "PROCESSING_ERROR",
                "safe_error_description": str(e)
            })
            await conversion_repo.save_job(job_dict)
            await sheets_service.log_conversion_event(job_dict)
            raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")


conversion_service = ConversionService()
