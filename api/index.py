import sys
import os
from pathlib import Path

# Add project root and backend to python path for Vercel Serverless runtime
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
backend_dir = root_dir / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Import the FastAPI application
from app.main import app
