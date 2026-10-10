import re
import os
import time
from pathlib import Path
from collections import defaultdict
from fastapi import HTTPException, status, Request
from app.core.config import settings

MAGIC_BYTES_MAP = {
    "pdf": b"%PDF",
    "png": b"\x89PNG\r\n\x1a\n",
    "jpg": b"\xff\xd8\xff",
    "jpeg": b"\xff\xd8\xff",
    "webp": b"RIFF",
    "docx": b"PK\x03\x04",
    "xlsx": b"PK\x03\x04",
}

# Sliding-window IP rate limiter store
_rate_limit_records = defaultdict(list)

def sanitize_filename(filename: str) -> str:
    """
    Prevents path traversal and strips unsafe characters from input filenames
    """
    base = os.path.basename(filename)
    clean = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", base)
    if not clean:
        clean = "document"
    return clean[:120]

def validate_safe_storage_path(base_dir: str, file_path: str) -> Path:
    """
    Guarantees the target path cannot escape the base temporary directory
    """
    resolved_base = Path(base_dir).resolve()
    resolved_target = Path(file_path).resolve()
    
    if not str(resolved_target).startswith(str(resolved_base)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Path traversal detected. Access denied."
        )
    return resolved_target

def verify_file_magic_header(content: bytes, expected_format: str) -> bool:
    """
    Verifies that the initial bytes match the expected file signature
    """
    fmt = expected_format.lower()
    if fmt in MAGIC_BYTES_MAP:
        header = MAGIC_BYTES_MAP[fmt]
        return content.startswith(header)
    return True

def check_rate_limit(client_ip: str, max_requests: int = 60, window_seconds: int = 60) -> bool:
    """
    Sliding-window IP rate limiter. Returns True if request is allowed, False if exceeded.
    """
    now = time.time()
    timestamps = _rate_limit_records[client_ip]
    # Prune timestamps older than window
    _rate_limit_records[client_ip] = [t for t in timestamps if now - t < window_seconds]
    if len(_rate_limit_records[client_ip]) >= max_requests:
        return False
    _rate_limit_records[client_ip].append(now)
    return True

async def rate_limit_dependency(request: Request):
    """
    FastAPI dependency enforcing per-IP rate limit.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    if not check_rate_limit(client_ip, max_requests=settings.RATE_LIMIT_PER_MINUTE, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum conversion requests reached. Please wait 60 seconds."
        )
