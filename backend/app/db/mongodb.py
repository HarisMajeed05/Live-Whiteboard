from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

client = AsyncIOMotorClient(settings.mongodb_uri)
db = client[settings.mongodb_db_name]

users_collection = db["users"]
boards_collection = db["boards"]
elements_collection = db["elements"]
