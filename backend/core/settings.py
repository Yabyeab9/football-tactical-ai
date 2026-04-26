import os
from dataclasses import dataclass, field


def _split_csv(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Football Intelligence Platform")
    api_schema_version: str = os.getenv("API_SCHEMA_VERSION", "2026-04-20")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: _split_csv(
            os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
        )
    )
    request_timeout_seconds: float = float(os.getenv("SPORTS_REQUEST_TIMEOUT", "12"))
    provider_retry_attempts: int = int(os.getenv("PROVIDER_RETRY_ATTEMPTS", "1"))
    live_cache_ttl_seconds: int = int(os.getenv("LIVE_CACHE_TTL_SECONDS", "30"))
    history_cache_ttl_seconds: int = int(os.getenv("HISTORY_CACHE_TTL_SECONDS", "180"))
    analytics_cache_ttl_seconds: int = int(os.getenv("ANALYTICS_CACHE_TTL_SECONDS", "240"))
    dashboard_cache_ttl_seconds: int = int(os.getenv("DASHBOARD_CACHE_TTL_SECONDS", "45"))
    thesportsdb_api_key: str = os.getenv("SPORTSDB_KEY", "")
    football_data_token: str = os.getenv("FOOTBALL_DATA_TOKEN", "")
    sportsdb_base_url: str = os.getenv("SPORTSDB_BASE_URL", "https://www.thesportsdb.com/api/v1/json")
    football_data_base_url: str = os.getenv("FOOTBALL_DATA_BASE_URL", "https://api.football-data.org/v4")
    openligadb_base_url: str = os.getenv("OPENLIGADB_BASE_URL", "https://api.openligadb.de")
    openligadb_leagues: tuple[str, ...] = field(
        default_factory=lambda: _split_csv(os.getenv("OPENLIGADB_LEAGUES", "bl1,bl2"))
    )
    tracked_competitions: tuple[str, ...] = field(
        default_factory=lambda: _split_csv(os.getenv("TRACKED_COMPETITIONS", "PL,PD,BL1,SA,CL"))
    )
    dashboard_featured_team_limit: int = int(os.getenv("DASHBOARD_FEATURED_TEAM_LIMIT", "6"))
    injury_watch_teams: tuple[str, ...] = field(
        default_factory=lambda: _split_csv(os.getenv("INJURY_WATCH_TEAMS", "64,65,66,67"))
    )
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-5-mini")


settings = Settings()
