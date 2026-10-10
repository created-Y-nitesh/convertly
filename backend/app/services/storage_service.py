import os
import shutil
import time
import uuid
from pathlib import Path
from typing import Tuple
from app.core.config import settings
from app.core.security import validate_safe_storage_path, sanitize_filename
from app.core.logging import logger

class StorageService:
    def __init__(self):
        self.base_dir = Path(settings.TEMP_STORAGE_DIR)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def create_job_directory(self, job_id: str) -> Path:
        job_dir = self.base_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        return job_dir

    async def save_uploaded_file(self, job_id: str, filename: str, content: bytes) -> Tuple[Path, str]:
        job_dir = self.create_job_directory(job_id)
        sanitized = sanitize_filename(filename)
        dest_path = job_dir / f"input_{sanitized}"
        validated_path = validate_safe_storage_path(str(self.base_dir), str(dest_path))
        
        with open(validated_path, "wb") as f:
            f.write(content)
            
        return validated_path, sanitized

    def get_output_path(self, job_id: str, filename: str) -> Path:
        job_dir = self.create_job_directory(job_id)
        sanitized = sanitize_filename(filename)
        dest_path = job_dir / f"output_{sanitized}"
        return validate_safe_storage_path(str(self.base_dir), str(dest_path))

    def cleanup_job(self, job_id: str) -> bool:
        job_dir = self.base_dir / job_id
        if job_dir.exists() and job_dir.is_dir():
            shutil.rmtree(job_dir, ignore_errors=True)
            logger.info(f"Cleaned up ephemeral files for job {job_id}")
            return True
        return False

    def purge_expired_files(self, max_age_seconds: int = None) -> int:
        if max_age_seconds is None:
            max_age_seconds = settings.FILE_RETENTION_SECONDS
        now = time.time()
        purged = 0
        try:
            for item in self.base_dir.iterdir():
                if item.is_dir():
                    try:
                        mtime = item.stat().st_mtime
                        if (now - mtime) > max_age_seconds:
                            shutil.rmtree(item, ignore_errors=True)
                            purged += 1
                    except Exception:
                        pass
            if purged > 0:
                logger.info(f"Purged {purged} expired ephemeral job directory(ies).")
        except Exception as e:
            logger.warning(f"Error during ephemeral directory purge: {str(e)}")
        return purged

storage_service = StorageService()

