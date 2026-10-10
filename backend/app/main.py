from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.db.mongodb import connect_to_mongodb, close_mongodb_connection
from app.api.routes import health, formats, conversions, history, downloads, integrations
from fastapi import HTTPException

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Convertly FastAPI Engine...")
    await connect_to_mongodb()
    yield
    # Shutdown
    logger.info("Shutting down Convertly FastAPI Engine...")
    await close_mongodb_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-performance document conversion API with MongoDB metadata and Google Sheets audit tracking.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal conversion error occurred. Check input file integrity."}
    )

# Include Routers
app.include_router(health.router)
app.include_router(formats.router)
app.include_router(conversions.router)
app.include_router(history.router)
app.include_router(downloads.router)
app.include_router(integrations.router)

