import os
from motor.motor_asyncio import AsyncIOMotorClient
from mongomock_motor import AsyncMongoMockClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "jewellery_erp")

client = None
db = None


async def connect_to_mongo():
    """Connect to MongoDB on startup. Uses Mock if real Mongo fails."""
    global client, db
    
    try:
        # Attempt real connection with a short 2-second timeout
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
        db = client[DATABASE_NAME]
        print(f"[OK] Connected to REAL MongoDB: {DATABASE_NAME}")
    except Exception as e:
        print(f"[WARN] Failed to connect to REAL MongoDB. Using In-Memory Mock MongoDB instead.")
        # Fallback to in-memory mongomock
        client = AsyncMongoMockClient()
        db = client[DATABASE_NAME]
        print(f"[OK] Connected to Mock MongoDB: {DATABASE_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection on shutdown."""
    global client
    if client and hasattr(client, 'close'):
        client.close()
        print("[CLOSE] MongoDB connection closed")


def get_db():
    """Get the database instance."""
    return db
