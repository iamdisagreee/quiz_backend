from redis.asyncio import Redis

from backend.database.redis_db import redis_client


async def get_redis() -> Redis:
    return redis_client