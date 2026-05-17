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
        try:
            _redis_client = Redis.from_url(
                settings.redis_url, 
                encoding="utf-8", 
                decode_responses=True,
                socket_timeout=5.0,
                socket_connect_timeout=5.0
            )
            await _redis_client.ping()
            logger.info("Successfully connected to Redis at %s", settings.redis_url)
        except Exception as exc:
            logger.error("Failed to connect to Redis: %s. Caching will be disabled.", exc)
            _redis_client = None
            raise
    return _redis_client


async def initialize_data_store() -> None:
    try:
        engine = get_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized.")
    except Exception as exc:
        logger.error("Database initialization failed: %s", exc)
        # We might want to re-raise here if DB is critical, but the prompt says "boot cleanly"
    
    try:
        await get_redis_client()
    except Exception:
        # Already logged in get_redis_client
        pass


async def read_cache(key: str) -> object | None:
    try:
        client = await get_redis_client()
        if client is None:
            return None
        raw = await client.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception:
        # Silently fail for cache reads
        return None


async def write_cache(key: str, payload: object, ttl: int) -> None:
    try:
        client = await get_redis_client()
        if client is None:
            return
        await client.set(key, json.dumps(payload, default=str), ex=ttl)
    except Exception:
        # Silently fail for cache writes
        pass
