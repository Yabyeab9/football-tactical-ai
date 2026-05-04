from __future__ import annotations

import json
import logging
from typing import Any, Optional

from backend.db.database import get_redis_client

logger = logging.getLogger(__name__)


class RedisCacheAdapter:
    def __init__(self, namespace: str = "football-ai"):
        self.namespace = namespace

    def _key(self, key: str) -> str:
        return f"{self.namespace}:{key}"

    async def get(self, key: str) -> Optional[Any]:
        client = await get_redis_client()
        raw = await client.get(self._key(key))
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Redis payload decode failed for %s", key)
            return None

    async def set(self, key: str, value: Any, ttl: int = 120) -> None:
        client = await get_redis_client()
        await client.set(self._key(key), json.dumps(value, default=str), ex=ttl)

    async def delete(self, key: str) -> None:
        client = await get_redis_client()
        await client.delete(self._key(key))
