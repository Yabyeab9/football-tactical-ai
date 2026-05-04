from __future__ import annotations

from pydantic import BaseSettings, ConfigDict, Field
from typing import List


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", frozen=True, extra="ignore")

    app_name: str = Field("Football Tactical Intelligence", env="APP_NAME")
    api_schema_version: str = Field("2026-05-04", env="API_SCHEMA_VERSION")
    environment: str = Field("development", env="ENVIRONMENT")
    log_level: str = Field("INFO", env="LOG_LEVEL")
    cors_origins: List[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"], env="CORS_ORIGINS")

    database_url: str = Field("sqlite+aiosqlite:///./backend/db/football.db", env="DATABASE_URL")
    redis_url: str = Field("redis://localhost:6379/0", env="REDIS_URL")

    analytics_cache_ttl_seconds: int = Field(240, env="ANALYTICS_CACHE_TTL_SECONDS")
    match_cache_ttl_seconds: int = Field(120, env="MATCH_CACHE_TTL_SECONDS")
    team_cache_ttl_seconds: int = Field(120, env="TEAM_CACHE_TTL_SECONDS")
    player_cache_ttl_seconds: int = Field(120, env="PLAYER_CACHE_TTL_SECONDS")
    event_cache_ttl_seconds: int = Field(60, env="EVENT_CACHE_TTL_SECONDS")

    openai_api_key: str = Field("", env="OPENAI_API_KEY")
    openai_model: str = Field("gpt-5-mini", env="OPENAI_MODEL")

    gemini_api_key: str = Field("", env="GEMINI_API_KEY")
    gemini_model: str = Field("gemini-pro", env="GEMINI_MODEL")


settings = Settings()
