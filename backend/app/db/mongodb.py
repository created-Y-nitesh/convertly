from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from app.core.config import settings
from app.core.logging import logger

client: Optional[AsyncIOMotorClient] = None
db = None

async def connect_to_mongodb():
    """
    Connects to MongoDB Atlas and verifies live connectivity and index schemas.
    Fails startup in production if MongoDB is unavailable and fallback is disallowed.
    """
    global client, db
    try:
        masked_host = settings.MONGODB_URI.split('@')[-1] if '@' in settings.MONGODB_URI else 'localhost'
        logger.info(f"Connecting to MongoDB Atlas at {masked_host} (database: {settings.MONGODB_DB_NAME})...")
        
        client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=50,
            minPoolSize=5
        )
        
        # Verify connection reachability via ping
        await client.admin.command('ping')
        
        db = client[settings.MONGODB_DB_NAME]
        
        # Initialize and verify collection indexes
        collection = db[settings.MONGODB_COLLECTION]
        await collection.create_index("job_id", unique=True)
        await collection.create_index("access_token")
        await collection.create_index([("created_at", -1)])
        await collection.create_index([("status", 1), ("created_at", -1)])
        await collection.create_index("expires_at", expireAfterSeconds=0)
        
        logger.info("MongoDB Atlas indexes verified and durable persistence initialized successfully.")
    except Exception as e:
        is_production = settings.ENVIRONMENT.lower() == "production"
        if is_production and not settings.ALLOW_IN_MEMORY_FALLBACK:
            logger.critical(f"Fatal: MongoDB Atlas connection failed in production: {str(e)}")
            raise RuntimeError(
                f"FATAL: Production database connection failed to MongoDB at {masked_host}. "
                "In-memory fallback is disabled in production to guarantee durable persistence. "
                f"Error: {str(e)}"
            )
        
        db = None
        logger.warning(
            f"MongoDB connection initialized in explicit in-memory fallback mode (ALLOW_IN_MEMORY_FALLBACK=True): {str(e)}"
        )

async def close_mongodb_connection():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection pool closed.")

def get_database():
    return db

async def ping_mongodb() -> bool:
    """
    Checks if MongoDB connection is active and responsive.
    """
    global client
    if client is None or db is None:
        return False
    try:
        await client.admin.command('ping')
        return True
    except Exception:
        return False
