import asyncio
import json
import logging
from typing import Any, Optional

from backend.db.database import get_redis_client

logger = logging.getLogger(__name__)

class RedisCache:
    """Production-grade Redis cache wrapper."""
    
    async def get(self, key: str) -> Any | None:
        try:
            client = await get_redis_client()
            raw = await client.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as exc:
            logger.warning("Cache GET failed for key %s: %s", key, exc)
            return None

    async def set(self, key: str, value: Any, ttl: int = 60) -> None:
        try:
            client = await get_redis_client()
            await client.set(
                key, 
                json.dumps(value, default=str), 
                ex=ttl
            )
        except Exception as exc:
            logger.warning("Cache SET failed for key %s: %s", key, exc)

    async def delete(self, key: str) -> None:
        try:
            client = await get_redis_client()
            await client.delete(key)
        except Exception as exc:
            logger.warning("Cache DELETE failed for key %s: %s", key, exc)

cache = RedisCache()
