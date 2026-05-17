from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any


@dataclass
class RedisStreamPublisher:
    url: str

    async def publish(self, stream: str, payload: dict[str, Any]) -> str:
        try:
            import redis.asyncio as redis  # type: ignore
        except ImportError as exc:  # pragma: no cover - scaffold import
            raise RuntimeError("redis package is required for runtime messaging") from exc

        client = redis.from_url(self.url, decode_responses=True)
        try:
            return await client.xadd(stream, {"payload": json.dumps(payload)})
        finally:
            await client.aclose()
