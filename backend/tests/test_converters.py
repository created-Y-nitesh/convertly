import pytest
from pathlib import Path
from app.converters.registry import get_route, SUPPORTED_FORMATS, SUPPORTED_ROUTES
from app.core.security import sanitize_filename, verify_file_magic_header

def test_registry_coverage():
    assert "pdf" in SUPPORTED_FORMATS
    assert "docx" in SUPPORTED_FORMATS
    assert "xlsx" in SUPPORTED_FORMATS
    assert "csv" in SUPPORTED_FORMATS
    assert "png" in SUPPORTED_FORMATS
    assert "jpg" in SUPPORTED_FORMATS
    assert len(SUPPORTED_ROUTES) >= 10

def test_route_lookup():
    route_pdf_word = get_route("pdf", "docx")
    assert route_pdf_word is not None
    assert route_pdf_word.source_format == "pdf"
    assert route_pdf_word.target_format == "docx"

    route_csv_xlsx = get_route("csv", "xlsx")
    assert route_csv_xlsx is not None

    route_invalid = get_route("unknown", "invalid")
    assert route_invalid is None

def test_filename_sanitization():
    unsafe = "../../../etc/passwd.pdf"
    clean = sanitize_filename(unsafe)
    assert ".." not in clean
    assert "/" not in clean
    assert clean.endswith(".pdf")

def test_magic_header_checks():
    pdf_bytes = b"%PDF-1.4\n..."
    assert verify_file_magic_header(pdf_bytes, "pdf") is True
    assert verify_file_magic_header(b"NOT_A_PDF", "pdf") is False

    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00"
    assert verify_file_magic_header(png_bytes, "png") is True
