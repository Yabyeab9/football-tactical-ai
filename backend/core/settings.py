from __future__ import annotations

from pydantic_settings import BaseSettings
from pydantic import ConfigDict, Field
from typing import List
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
ENV_LOCATIONS = [BASE_DIR / ".env", ROOT_DIR / ".env"]

def get_env_path() -> str | None:
    for path in ENV_LOCATIONS:
        if path.exists():
            return str(path)
    return None

class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=get_env_path(),
        env_file_encoding="utf-8",
        frozen=True,
        extra="ignore"
    )

    # Core App Settings
    app_name: str = Field("Football Tactical Intelligence", env="APP_NAME")
    api_schema_version: str = Field("2026-05-04", env="API_SCHEMA_VERSION")
    environment: str = Field("development", env="ENVIRONMENT")
    log_level: str = Field("INFO", env="LOG_LEVEL")
    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"], 
        env="CORS_ORIGINS"
    )

    # Infrastructure
    database_url: str = Field("sqlite+aiosqlite:///./backend/db/football.db", env="DATABASE_URL")
    redis_url: str = Field("redis://localhost:6379/0", env="REDIS_URL")
    request_timeout_seconds: float = Field(30.0, env="REQUEST_TIMEOUT_SECONDS")

    # Cache TTLs (Seconds)
    analytics_cache_ttl_seconds: int = Field(240, env="ANALYTICS_CACHE_TTL_SECONDS")
    dashboard_cache_ttl_seconds: int = Field(300, env="DASHBOARD_CACHE_TTL_SECONDS")
    live_cache_ttl_seconds: int = Field(120, env="LIVE_CACHE_TTL_SECONDS")
    match_cache_ttl_seconds: int = Field(120, env="MATCH_CACHE_TTL_SECONDS")
    team_cache_ttl_seconds: int = Field(120, env="TEAM_CACHE_TTL_SECONDS")
    player_cache_ttl_seconds: int = Field(120, env="PLAYER_CACHE_TTL_SECONDS")
    event_cache_ttl_seconds: int = Field(60, env="EVENT_CACHE_TTL_SECONDS")
    history_cache_ttl_seconds: int = Field(86400, env="HISTORY_CACHE_TTL_SECONDS")

    # AI Model Settings
    openai_api_key: str = Field("", env="OPENAI_API_KEY")
    openai_model: str = Field("gpt-5-mini", env="OPENAI_MODEL")
    gemini_api_key: str = Field("", env="GEMINI_API_KEY")
    gemini_model: str = Field("gemini-pro", env="GEMINI_MODEL")

    # External Data Providers
    provider_retry_attempts: int = Field(2, env="PROVIDER_RETRY_ATTEMPTS")
    
    sportsdb_base_url: str = Field("https://www.thesportsdb.com/api/v1/json", env="SPORTSDB_BASE_URL")
    thesportsdb_api_key: str = Field("123", env="SPORTSDB_KEY")
    
    football_data_base_url: str = Field("https://api.football-data.org/v4", env="FOOTBALL_DATA_BASE_URL")
    football_data_token: str = Field("", env="FOOTBALL_DATA_TOKEN")
    
    rapidapi_key: str = Field("8719d06bd3mshb05d5e399b7ab65p1bf45fjsn1108c6cb0bb", env="RAPIDAPI_KEY")
    api_football_host: str = Field("api-football-v1.p.rapidapi.com", env="API_FOOTBALL_HOST")
    api_football_base_url: str = Field("https://api-football-v1.p.rapidapi.com/v3", env="API_FOOTBALL_BASE_URL")

    openligadb_base_url: str = Field("https://api.openligadb.de", env="OPENLIGADB_BASE_URL")
    openligadb_leagues: List[str] = Field(default_factory=lambda: ["bl1", "bl2"], env="OPENLIGADB_LEAGUES")
    
    # Business Logic Config
    tracked_competitions: List[str] = Field(default_factory=lambda: ["PL", "PD", "BL1", "SA", "CL"], env="TRACKED_COMPETITIONS")
    injury_watch_teams: List[str] = Field(default_factory=lambda: ["64", "65", "66", "67"], env="INJURY_WATCH_TEAMS")
    dashboard_featured_team_limit: int = Field(5, env="DASHBOARD_FEATURED_TEAM_LIMIT")


settings = Settings()
