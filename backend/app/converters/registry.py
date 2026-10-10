from typing import Dict, List, Optional
from pydantic import BaseModel

class FormatMetadata(BaseModel):
    id: str
    name: str
    extension: str
    category: str
    max_size_bytes: int
    allowed_mime_types: List[str]
    description: str

class RouteMetadata(BaseModel):
    id: str
    source_format: str
    target_format: str
    label: str
    engine: str
    is_available: bool
    notes: Optional[str] = None

SUPPORTED_FORMATS: Dict[str, FormatMetadata] = {
    "pdf": FormatMetadata(
        id="pdf",
        name="Portable Document Format",
        extension=".pdf",
        category="pdf",
        max_size_bytes=50 * 1024 * 1024,
        allowed_mime_types=["application/pdf"],
        description="Universal document format preserving exact formatting"
    ),
    "docx": FormatMetadata(
        id="docx",
        name="Microsoft Word Document",
        extension=".docx",
        category="office",
        max_size_bytes=30 * 1024 * 1024,
        allowed_mime_types=["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        description="Standard editable word processing document"
    ),
    "txt": FormatMetadata(
        id="txt",
        name="Plain Text File",
        extension=".txt",
        category="data",
        max_size_bytes=20 * 1024 * 1024,
        allowed_mime_types=["text/plain"],
        description="Unformatted universal text readable across platforms"
    ),
    "png": FormatMetadata(
        id="png",
        name="Portable Network Graphics",
        extension=".png",
        category="images",
        max_size_bytes=25 * 1024 * 1024,
        allowed_mime_types=["image/png"],
        description="Lossless raster image with transparency"
    ),
    "jpg": FormatMetadata(
        id="jpg",
        name="JPEG Image",
        extension=".jpg",
        category="images",
        max_size_bytes=25 * 1024 * 1024,
        allowed_mime_types=["image/jpeg"],
        description="Compressed photograph format"
    ),
    "webp": FormatMetadata(
        id="webp",
        name="WebP Image",
        extension=".webp",
        category="images",
        max_size_bytes=25 * 1024 * 1024,
        allowed_mime_types=["image/webp"],
        description="Modern high efficiency web image"
    ),
    "csv": FormatMetadata(
        id="csv",
        name="Comma-Separated Values",
        extension=".csv",
        category="data",
        max_size_bytes=25 * 1024 * 1024,
        allowed_mime_types=["text/csv", "text/plain"],
        description="Tabular plain text records"
    ),
    "xlsx": FormatMetadata(
        id="xlsx",
        name="Microsoft Excel Spreadsheet",
        extension=".xlsx",
        category="data",
        max_size_bytes=30 * 1024 * 1024,
        allowed_mime_types=["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        description="Structured multi-sheet workbook"
    )
}

SUPPORTED_ROUTES: List[RouteMetadata] = [
    RouteMetadata(
        id="pdf-to-docx",
        source_format="pdf",
        target_format="docx",
        label="PDF to Word (.docx)",
        engine="PyMuPDF + python-docx",
        is_available=True,
        notes="Extracts structured paragraphs, font sizing, and page breaks from text streams. Inherent limitations: Fixed coordinate (x,y) positioning in PDFs does not map 1:1 to reflowable Word flows; table borders and multi-column streams may require post-formatting; scanned/raster PDFs without OCR produce empty text."
    ),
    RouteMetadata(
        id="docx-to-pdf",
        source_format="docx",
        target_format="pdf",
        label="Word (.docx) to PDF",
        engine="LibreOffice Headless / Gotenberg",
        is_available=True,
        notes="Production engine using headless LibreOffice or Gotenberg. Accurately preserves margins, pagination, embedded images, tables, and typography."
    ),
    RouteMetadata(id="pdf-to-png", source_format="pdf", target_format="png", label="PDF to PNG Images", engine="PyMuPDF", is_available=True),
    RouteMetadata(id="pdf-to-jpg", source_format="pdf", target_format="jpg", label="PDF to JPG Images", engine="PyMuPDF", is_available=True),
    RouteMetadata(id="pdf-to-txt", source_format="pdf", target_format="txt", label="PDF to Plain Text", engine="PyMuPDF", is_available=True),
    RouteMetadata(id="docx-to-txt", source_format="docx", target_format="txt", label="Word (.docx) to Plain Text", engine="python-docx", is_available=True),
    RouteMetadata(id="png-to-jpg", source_format="png", target_format="jpg", label="PNG to JPG", engine="Pillow", is_available=True),
    RouteMetadata(id="jpg-to-png", source_format="jpg", target_format="png", label="JPG to PNG", engine="Pillow", is_available=True),
    RouteMetadata(id="png-to-webp", source_format="png", target_format="webp", label="PNG to WebP", engine="Pillow", is_available=True),
    RouteMetadata(id="webp-to-png", source_format="webp", target_format="png", label="WebP to PNG", engine="Pillow", is_available=True),
    RouteMetadata(id="png-to-pdf", source_format="png", target_format="pdf", label="PNG to PDF", engine="Pillow + PyMuPDF", is_available=True),
    RouteMetadata(id="jpg-to-pdf", source_format="jpg", target_format="pdf", label="JPG to PDF", engine="Pillow + PyMuPDF", is_available=True),
    RouteMetadata(id="csv-to-xlsx", source_format="csv", target_format="xlsx", label="CSV to Excel (.xlsx)", engine="openpyxl", is_available=True),
    RouteMetadata(id="xlsx-to-csv", source_format="xlsx", target_format="csv", label="Excel (.xlsx) to CSV", engine="openpyxl", is_available=True),
    RouteMetadata(id="txt-to-pdf", source_format="txt", target_format="pdf", label="Text to PDF", engine="PyMuPDF", is_available=True),
]

def get_route(source: str, target: str) -> Optional[RouteMetadata]:
    for r in SUPPORTED_ROUTES:
        if r.source_format == source.lower() and r.target_format == target.lower() and r.is_available:
            return r
    return None
