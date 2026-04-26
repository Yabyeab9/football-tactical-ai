import asyncio
import time
from dataclasses import dataclass
from typing import Any


@dataclass
class CacheEntry:
    value: Any
    expires_at: float | None
    created_at: float

    @property
    def is_expired(self) -> bool:
        return self.expires_at is not None and self.expires_at <= time.time()


class AsyncTTLCache:
    def __init__(self) -> None:
        self._store: dict[str, CacheEntry] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str, allow_stale: bool = False) -> Any | None:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None

            if entry.is_expired and not allow_stale:
                self._store.pop(key, None)
                return None

            return entry.value

    async def set(self, key: str, value: Any, ttl: int | None = 60) -> None:
        async with self._lock:
            expires_at = time.time() + ttl if ttl else None
            self._store[key] = CacheEntry(value=value, expires_at=expires_at, created_at=time.time())

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._store.pop(key, None)


cache = AsyncTTLCache()
