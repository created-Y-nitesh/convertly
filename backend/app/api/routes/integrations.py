from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.sheets_service import sheets_service

router = APIRouter(prefix="/api/v1/integrations", tags=["Integrations"])

class SheetsTestRequest(BaseModel):
    webhook_url: Optional[str] = None
    shared_secret: Optional[str] = None

@router.post("/google-sheets/test")
async def test_google_sheets_integration(payload: Optional[SheetsTestRequest] = None):
    """
    Tests connectivity and authorization with the Google Apps Script Web App.
    Uses backend environment secrets by default so secrets are never exposed on the client.
    """
    url = payload.webhook_url if payload else None
    secret = payload.shared_secret if payload else None
    result = await sheets_service.test_connection(webhook_url=url, shared_secret=secret)
    return result
