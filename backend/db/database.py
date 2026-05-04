from __future__ import annotations

import json
import logging
from typing import AsyncGenerator

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from backend.core.settings import settings

logger = logging.getLogger(__name__)

Base = declarative_base()
_engine: AsyncEngine | None = None
_session_maker: async_sessionmaker[AsyncSession] | None = None
_redis_client: Redis | None = None


def get_engine() -> AsyncEngine:
    global _engine, _session_maker
    if _engine is None:
        _engine = create_async_engine(
            settings.database_url,
            echo=False,
            future=True,
            pool_pre_ping=True,
            connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
        )
        _session_maker = async_sessionmaker(_engine, expire_on_commit=False, class_=AsyncSession)
    assert _engine is not None
    assert _session_maker is not None
    return _engine


def get_session_maker() -> async_sessionmaker[AsyncSession]:
    if _session_maker is None:
        get_engine()
    assert _session_maker is not None
    return _session_maker


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async_session = get_session_maker()
    async with async_session() as session:
        yield session


async def get_redis_client() -> Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = Redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
        await _redis_client.ping()
    return _redis_client


async def initialize_data_store() -> None:
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await get_redis_client()


async def read_cache(key: str) -> object | None:
    client = await get_redis_client()
    raw = await client.get(key)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("Failed to decode cache payload for key=%s", key)
        return None


async def write_cache(key: str, payload: object, ttl: int) -> None:
    client = await get_redis_client()
    await client.set(key, json.dumps(payload, default=str), ex=ttl)
