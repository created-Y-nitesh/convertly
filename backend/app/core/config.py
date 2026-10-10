from typing import List, Union
from pydantic import ConfigDict, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Convertly Document Conversion API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://convertly.vercel.app"
    ]

    @field_validator("ALLOWED_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("["):
                import json
                return json.loads(v)
            return [i.strip() for i in v.split(",") if i.strip()]
        return v
    
    TEMP_STORAGE_DIR: str = "/tmp/convertly_storage"
    MAX_FILE_SIZE_BYTES: int = 50 * 1024 * 1024 # 50 MB
    FILE_RETENTION_SECONDS: int = 3600 # 1 hour
    
    # MongoDB & Persistence
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "convertly_production"
    MONGODB_COLLECTION: str = "conversion_jobs"
    ALLOW_IN_MEMORY_FALLBACK: bool = True # Allowed in dev/test; strictly rejected in production if false
    
    # Engines & External Services
    LIBREOFFICE_PATH: str = ""
    GOTENBERG_URL: str = ""
    
    # Google Sheets Integration
    GOOGLE_SHEETS_WEBHOOK_URL: str = ""
    GOOGLE_SHEETS_SHARED_SECRET: str = ""
    GOOGLE_SHEETS_AUTO_SYNC: bool = False
    
    # Security & Capabilities
    ADMIN_API_KEY: str = ""
    RATE_LIMIT_PER_MINUTE: int = 60

    model_config = ConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
