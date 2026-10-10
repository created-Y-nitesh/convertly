import secrets
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from app.db.mongodb import get_database
from app.core.config import settings
from app.core.logging import logger

# In-memory storage cache for resilient development/testing fallback
_memory_store: Dict[str, Dict[str, Any]] = {}

class ConversionRepository:
    def __init__(self):
        self.collection_name = settings.MONGODB_COLLECTION

    async def save_job(self, job_dict: Dict[str, Any]) -> bool:
        """
        Saves or updates conversion job in MongoDB Atlas.
        Falls back to in-memory only when explicitly permitted.
        """
        job_id = job_dict["job_id"]
        _memory_store[job_id] = job_dict
        
        db = get_database()
        if db is not None:
            try:
                collection = db[self.collection_name]
                await collection.update_one(
                    {"job_id": job_id},
                    {"$set": job_dict},
                    upsert=True
                )
                return True
            except Exception as e:
                is_prod = settings.ENVIRONMENT.lower() == "production"
                if is_prod and not settings.ALLOW_IN_MEMORY_FALLBACK:
                    logger.error(f"MongoDB write failed in production: {str(e)}")
                    raise RuntimeError(f"Database write failure in production: {str(e)}")
                logger.warning(f"MongoDB write fell back to memory cache: {str(e)}")
                return True

        is_prod = settings.ENVIRONMENT.lower() == "production"
        if is_prod and not settings.ALLOW_IN_MEMORY_FALLBACK:
            raise RuntimeError("Database unavailable: In-memory fallback is disabled in production.")
        return True

    async def get_job_by_id(self, job_id: str) -> Optional[Dict[str, Any]]:
        db = get_database()
        if db is not None:
            try:
                collection = db[self.collection_name]
                doc = await collection.find_one({"job_id": job_id})
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                logger.warning(f"MongoDB read fell back to memory: {str(e)}")
        
        return _memory_store.get(job_id)

    async def validate_job_token(self, job_id: str, candidate_token: str) -> bool:
        """
        Cryptographically validates that candidate_token matches the job's access_token.
        Uses secrets.compare_digest to prevent timing attacks.
        """
        if not candidate_token:
            return False
        job = await self.get_job_by_id(job_id)
        if not job:
            return False
        stored_token = job.get("access_token")
        if not stored_token:
            return False
        return secrets.compare_digest(stored_token, candidate_token)

    async def list_recent_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        db = get_database()
        if db is not None:
            try:
                collection = db[self.collection_name]
                cursor = collection.find().sort("created_at", -1).limit(limit)
                docs = await cursor.to_list(length=limit)
                for d in docs:
                    d.pop("_id", None)
                return docs
            except Exception as e:
                logger.warning(f"MongoDB list fell back to memory: {str(e)}")
        
        items = list(_memory_store.values())
        items.sort(key=lambda x: x.get("created_at", datetime.now(timezone.utc)), reverse=True)
        return items[:limit]

    async def delete_job(self, job_id: str) -> bool:
        _memory_store.pop(job_id, None)
        db = get_database()
        if db is not None:
            try:
                collection = db[self.collection_name]
                res = await collection.delete_one({"job_id": job_id})
                return res.deleted_count > 0
            except Exception as e:
                logger.warning(f"MongoDB delete error: {str(e)}")
        return True

conversion_repo = ConversionRepository()
