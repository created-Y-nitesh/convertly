import asyncio
import httpx
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger

class GoogleSheetsService:
    def __init__(self):
        self.webhook_url = settings.GOOGLE_SHEETS_WEBHOOK_URL
        self.shared_secret = settings.GOOGLE_SHEETS_SHARED_SECRET
        self.auto_sync = settings.GOOGLE_SHEETS_AUTO_SYNC

    async def log_conversion_event(self, job_dict: Dict[str, Any], max_retries: int = 2) -> bool:
        """
        Dispatches structured conversion audit metrics to the Google Apps Script Web App.
        Performs up to max_retries on transient network disconnects.
        Logging failures are completely non-fatal to the conversion operation.
        """
        url = self.webhook_url or settings.GOOGLE_SHEETS_WEBHOOK_URL
        if not url or not (self.auto_sync or settings.GOOGLE_SHEETS_AUTO_SYNC):
            return False

        secret = self.shared_secret or settings.GOOGLE_SHEETS_SHARED_SECRET
        event_id = f"evt_{uuid.uuid4().hex[:12]}"
        created_str = str(job_dict.get("created_at") or datetime.now(timezone.utc).isoformat())

        payload = {
            "action": "log_conversion",
            "shared_secret": secret,
            "event": {
                "event_id": event_id,
                "job_id": job_dict.get("job_id", ""),
                "created_at": created_str,
                "source_format": job_dict.get("source_format", ""),
                "target_format": job_dict.get("target_format", ""),
                "original_file_size": job_dict.get("original_file_size", 0),
                "status": job_dict.get("status", "unknown"),
                "processing_duration_ms": job_dict.get("processing_duration_ms", 0),
                "error_code": job_dict.get("error_code") or "NONE",
                "result_file_size": job_dict.get("result_file_size", 0),
            },
        }

        # Attempt transmission with retries
        for attempt in range(max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                    res = await client.post(
                        url,
                        json=payload,
                        headers={"Content-Type": "text/plain;charset=utf-8"},
                    )
                    if res.status_code in [200, 201]:
                        logger.info(f"Successfully transmitted telemetry for job {job_dict.get('job_id')} to Google Sheets.")
                        return True
                    else:
                        logger.warning(
                            f"Google Sheets webhook attempt {attempt + 1} returned status {res.status_code}: {res.text[:150]}"
                        )
            except Exception as e:
                logger.warning(f"Google Sheets webhook attempt {attempt + 1} failed: {str(e)}")

            if attempt < max_retries:
                await asyncio.sleep(0.5 * (attempt + 1))

        logger.error(f"Failed to record event for job {job_dict.get('job_id')} to Google Sheets after {max_retries + 1} attempts.")
        return False

    async def test_connection(
        self,
        webhook_url: Optional[str] = None,
        shared_secret: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Tests the Google Apps Script Web App connection using an authenticated ping action.
        Uses server-side configured secret if not explicitly overridden.
        """
        target_url = webhook_url or self.webhook_url or settings.GOOGLE_SHEETS_WEBHOOK_URL
        if not target_url:
            return {
                "success": False,
                "status_code": 400,
                "message": "No Google Sheets Webhook URL configured in backend environment or request payload.",
            }

        target_secret = shared_secret if shared_secret is not None else (self.shared_secret or settings.GOOGLE_SHEETS_SHARED_SECRET)

        test_payload = {
            "action": "ping",
            "shared_secret": target_secret or "",
            "test_id": f"test_{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                res = await client.post(
                    target_url,
                    json=test_payload,
                    headers={"Content-Type": "text/plain;charset=utf-8"},
                )

                response_body: Any = {}
                try:
                    response_body = res.json()
                except Exception:
                    response_body = {"text": res.text[:200]}

                is_ok = res.status_code in [200, 201] and (
                    response_body.get("status") == "success"
                    or response_body.get("ping") == "pong"
                    or response_body.get("authenticated") is True
                )

                if response_body.get("status") == "unauthorized":
                    return {
                        "success": False,
                        "status_code": 401,
                        "message": "Authentication failed. The shared secret did not match the Script Property in Google Apps Script.",
                        "details": response_body,
                    }

                return {
                    "success": is_ok,
                    "status_code": res.status_code,
                    "message": "Connection verified successfully with Google Apps Script!" if is_ok else f"Target returned status {res.status_code}",
                    "details": response_body,
                }
        except Exception as e:
            logger.error(f"Google Sheets test connection failed: {str(e)}")
            return {
                "success": False,
                "status_code": 500,
                "message": f"Network error reaching Google Apps Script: {str(e)}",
            }

sheets_service = GoogleSheetsService()
