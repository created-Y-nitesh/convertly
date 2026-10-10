from pathlib import Path
from PIL import Image
from typing import Dict, Any

def convert_raster_image(input_path: Path, output_path: Path, target_format: str, options: Dict[str, Any]) -> None:
    quality = int(options.get("image_quality", 0.92) * 100)
    
    with Image.open(input_path) as img:
        fmt = target_format.lower()
        
        if fmt in ["jpg", "jpeg"]:
            # Convert RGBA/P to RGB before saving to JPEG
            if img.mode in ("RGBA", "LA", "P"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                background.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
                background.save(output_path, "JPEG", quality=quality)
            else:
                img.convert("RGB").save(output_path, "JPEG", quality=quality)
                
        elif fmt == "png":
            img.save(output_path, "PNG", optimize=True)
            
        elif fmt == "webp":
            img.save(output_path, "WEBP", quality=quality, method=6)
            
        elif fmt == "pdf":
            if img.mode in ("RGBA", "LA", "P"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                background.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
                background.save(output_path, "PDF", resolution=100.0)
            else:
                img.convert("RGB").save(output_path, "PDF", resolution=100.0)
        else:
            raise ValueError(f"Unsupported image target format: {target_format}")
