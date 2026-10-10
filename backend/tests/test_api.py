import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert data["active_converters"] > 0

def test_list_formats():
    response = client.get("/api/v1/formats")
    assert response.status_code == 200
    formats = response.json()
    assert "pdf" in formats
    assert "docx" in formats
    assert "xlsx" in formats

def test_list_supported_routes():
    response = client.get("/api/v1/conversions/supported")
    assert response.status_code == 200
    routes = response.json()
    assert len(routes) > 5
    assert any(r["id"] == "pdf-to-docx" for r in routes)

def test_reject_unsupported_conversion():
    response = client.post(
        "/api/v1/conversions",
        data={"source_format": "unsupported", "target_format": "format"},
        files={"file": ("test.bin", b"binarycontent", "application/octet-stream")}
    )
    assert response.status_code in [400, 422]
