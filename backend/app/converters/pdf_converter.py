from pathlib import Path
from typing import Dict, Any
import docx

def convert_pdf_to_images(input_path: Path, output_path: Path, target_format: str, options: Dict[str, Any]) -> None:
    try:
        import fitz # PyMuPDF
        doc = fitz.open(input_path)
        if len(doc) == 0:
            raise ValueError("PDF has no pages.")
        
        # Render first page as primary preview / raster
        page = doc.load_page(0)
        pix = page.get_pixmap(dpi=150)
        pix.save(str(output_path))
        doc.close()
    except ImportError:
        # Fallback if fitz not compiled
        raise RuntimeError("PyMuPDF engine not available in this runtime.")

def convert_pdf_to_txt(input_path: Path, output_path: Path, options: Dict[str, Any]) -> None:
    try:
        import fitz
        doc = fitz.open(input_path)
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(text_parts))
    except ImportError:
        raise RuntimeError("PyMuPDF engine not available.")

def convert_pdf_to_docx(input_path: Path, output_path: Path, options: Dict[str, Any]) -> None:
    try:
        import fitz
        doc = fitz.open(input_path)
        word_doc = docx.Document()
        
        for i, page in enumerate(doc):
            text = page.get_text()
            for line in text.splitlines():
                if line.strip():
                    word_doc.add_paragraph(line.strip())
            if i < len(doc) - 1:
                word_doc.add_page_break()
                
        doc.close()
        word_doc.save(output_path)
    except ImportError:
        raise RuntimeError("PyMuPDF engine not available.")

def convert_txt_to_pdf(input_path: Path, output_path: Path, options: Dict[str, Any]) -> None:
    try:
        import fitz
        doc = fitz.open()
        with open(input_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
            
        page = doc.new_page()
        y = 50
        margin_x = 50
        
        for line in lines:
            if y > 780:
                page = doc.new_page()
                y = 50
            page.insert_text(fitz.Point(margin_x, y), line.rstrip("\n"), fontsize=10)
            y += 14
            
        doc.save(str(output_path))
        doc.close()
    except ImportError:
        raise RuntimeError("PyMuPDF engine not available.")
