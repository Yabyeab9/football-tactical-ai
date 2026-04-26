from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime
from typing import Any

import httpx

from backend.core.settings import settings

from .data_normalizer import (
    build_entity_id,
    coerce_int,
    ensure_bool,
    ensure_dict,
    ensure_list,
    ensure_str,
    normalize_match_record,
    normalize_name,
    normalize_team_ref,
    parse_minute,
    split_entity_id,
    to_iso,
    today_iso,
    utc_now_iso,
)
from .provider_manager import ProviderStatus, provider_manager

logger = logging.getLogger(__name__)


class ProviderConfigurationError(RuntimeError):
    pass


class ProviderResponseError(RuntimeError):
    pass


class BaseApiClient:
    provider_name = "base"
    base_url = ""

    def __init__(self) -> None:
        self.timeout = httpx.Timeout(settings.request_timeout_seconds)

    async def _get_json(
        self,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> Any:
        if not self.base_url:
            raise ProviderConfigurationError(f"{self.provider_name} base URL is not configured")
        url = f"{self.base_url.rstrip('/')}/{path.lstrip('/')}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(url, params=params or {}, headers=headers or {})
            if response.status_code >= 400:
                raise ProviderResponseError(
                    f"{self.provider_name} returned {response.status_code} for {path}"
                )
            try:
                return response.json()
            except ValueError as exc:
                raise ProviderResponseError(f"{self.provider_name} returned invalid JSON for {path}") from exc

    async def _get_optional_json(
        self,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        fallback: Any = None,
    ) -> Any:
        try:
            payload = await self._get_json(path, params=params, headers=headers)
            return payload if payload is not None else fallback
        except Exception:
            logger.warning("Optional provider request failed for %s %s", self.provider_name, path)
            return fallback


class TheSportsDBClient(BaseApiClient):
    provider_name = "thesportsdb"

    def __init__(self) -> None:
        super().__init__()
        self.base_url = settings.sportsdb_base_url
        self.api_key = ensure_str(settings.thesportsdb_api_key)

    def _require_key(self) -> None:
        if not self.api_key:
            raise ProviderConfigurationError("SPORTSDB_KEY is not configured")

    async def get_live_matches(self) -> list[dict[str, Any]]:
        self._require_key()
        payload = ensure_dict(await self._get_json(f"{self.api_key}/livescore.php", params={"s": "Soccer"}))
        events = ensure_list(payload.get("events"))
        return [self._normalize_live_match(event) for event in events if isinstance(event, dict)]

    async def get_team_history(self, team_id: str) -> list[dict[str, Any]]:
        self._require_key()
        payload = ensure_dict(await self._get_json(f"{self.api_key}/eventslast.php", params={"id": team_id}))
        events = ensure_list(payload.get("results"))
        return [self._normalize_history_match(event, team_id) for event in events if isinstance(event, dict)]

    async def get_match_details(self, match_id: str) -> dict[str, Any]:
        self._require_key()
        event_payload, timeline_payload, stats_payload, lineup_payload = await asyncio.gather(
            self._get_optional_json(f"{self.api_key}/lookupevent.php", params={"id": match_id}, fallback={}),
            self._get_optional_json(f"{self.api_key}/lookuptimeline.php", params={"id": match_id}, fallback={}),
            self._get_optional_json(f"{self.api_key}/lookupeventstats.php", params={"id": match_id}, fallback={}),
            self._get_optional_json(f"{self.api_key}/lookuplineup.php", params={"id": match_id}, fallback={}),
        )
        event = ensure_list(ensure_dict(event_payload).get("events"))
        return {
            "event": ensure_dict(event[0]) if event else {},
            "timeline": ensure_list(ensure_dict(timeline_payload).get("timeline")) or ensure_list(ensure_dict(timeline_payload).get("events")),
            "statistics": ensure_list(ensure_dict(stats_payload).get("statistics")) or ensure_list(ensure_dict(stats_payload).get("teams")),
            "lineups": ensure_list(ensure_dict(lineup_payload).get("lineup")) or ensure_list(ensure_dict(lineup_payload).get("lineups")),
        }

    async def get_team_details(self, team_id: str) -> dict[str, Any]:
        self._require_key()
        payload = ensure_dict(await self._get_json(f"{self.api_key}/lookupteam.php", params={"id": team_id}))
        teams = ensure_list(payload.get("teams"))
        return ensure_dict(teams[0]) if teams else {}

    async def get_team_players(self, team_id: str) -> list[dict[str, Any]]:
        self._require_key()
        payload = ensure_dict(await self._get_json(f"{self.api_key}/lookup_all_players.php", params={"id": team_id}))
        return [ensure_dict(player) for player in ensure_list(payload.get("player"))]

    async def search_team(self, team_name: str) -> dict[str, Any]:
        self._require_key()
        payload = ensure_dict(await self._get_json(f"{self.api_key}/searchteams.php", params={"t": team_name}))
        teams = ensure_list(payload.get("teams"))
        return ensure_dict(teams[0]) if teams else {}

    def _normalize_live_match(self, event: dict[str, Any]) -> dict[str, Any]:
        event = ensure_dict(event)
        return normalize_match_record(
            provider=self.provider_name,
            raw_id=event.get("idEvent"),
            home_team=normalize_team_ref(
                provider=self.provider_name,
                raw_id=event.get("idHomeTeam"),
                name=event.get("strHomeTeam"),
                short_name=event.get("strHomeTeam"),
                provider_ids={self.provider_name: event.get("idHomeTeam")},
            ),
            away_team=normalize_team_ref(
                provider=self.provider_name,
                raw_id=event.get("idAwayTeam"),
                name=event.get("strAwayTeam"),
                short_name=event.get("strAwayTeam"),
                provider_ids={self.provider_name: event.get("idAwayTeam")},
            ),
            status=event.get("strStatus") or "LIVE",
            kickoff=event.get("strTimestamp") or event.get("dateEvent"),
            score_home=event.get("intHomeScore"),
            score_away=event.get("intAwayScore"),
            venue=event.get("strVenue"),
            competition={
                "id": build_entity_id(self.provider_name, event.get("idLeague") or event.get("strLeague") or "unknown"),
                "name": event.get("strLeague") or "Unknown competition",
                "country": event.get("strCountry"),
            },
            minute=parse_minute(event.get("strProgress"), event.get("strStatus")),
            external_ids={self.provider_name: event.get("idEvent")},
            providers=[self.provider_name],
        )

    def _normalize_history_match(self, event: dict[str, Any], team_id: str) -> dict[str, Any]:
        event = ensure_dict(event)
        is_home = ensure_str(event.get("idHomeTeam")) == ensure_str(team_id)
        home_score = coerce_int(event.get("intHomeScore"))
        away_score = coerce_int(event.get("intAwayScore"))
        goals_for = home_score if is_home else away_score
        goals_against = away_score if is_home else home_score
        result = "W" if goals_for > goals_against else "L" if goals_for < goals_against else "D"
        return {
            "id": build_entity_id(self.provider_name, event.get("idEvent")),
            "date": to_iso(event.get("strTimestamp") or event.get("dateEvent")) or utc_now_iso(),
            "competition": ensure_str(event.get("strLeague"), "Unknown competition"),
            "status": "FINISHED",
            "venue": "HOME" if is_home else "AWAY",
            "opponent": ensure_str(event.get("strAwayTeam") if is_home else event.get("strHomeTeam"), "Unknown opponent"),
            "score": {"for": goals_for, "against": goals_against},
            "outcome": result,
            "metrics": {
                "shots": coerce_int(event.get("intHomeShots") if is_home else event.get("intAwayShots")),
                "shotsOnTarget": coerce_int(event.get("intHomeShotsOnGoal") if is_home else event.get("intAwayShotsOnGoal")),
                "possession": coerce_int(event.get("intHomePossession") if is_home else event.get("intAwayPossession")),
                "passes": coerce_int(event.get("intHomePasses") if is_home else event.get("intAwayPasses")),
            },
        }


class FootballDataClient(BaseApiClient):
    provider_name = "football-data"

    def __init__(self) -> None:
        super().__init__()
        self.base_url = settings.football_data_base_url
        self.token = ensure_str(settings.football_data_token)

    @property
    def headers(self) -> dict[str, str]:
        if not self.token:
            raise ProviderConfigurationError("FOOTBALL_DATA_TOKEN is not configured")
        return {"X-Auth-Token": self.token}

    async def get_matches(self, match_date: str | None = None) -> list[dict[str, Any]]:
        target_date = ensure_str(match_date) or today_iso()
        params: dict[str, Any] = {"dateFrom": target_date, "dateTo": target_date}
        competitions = ",".join(settings.tracked_competitions)
        if competitions:
            params["competitions"] = competitions
        payload = ensure_dict(await self._get_json("matches", params=params, headers=self.headers))
        return [self._normalize_match(match) for match in ensure_list(payload.get("matches")) if isinstance(match, dict)]

    async def get_team_matches(self, team_id: str, limit: int = 10) -> dict[str, Any]:
        payload = await self._get_json(
            f"teams/{team_id}/matches",
            params={"status": "FINISHED", "limit": limit},
            headers=self.headers,
        )
        return ensure_dict(payload)

    async def get_match(self, match_id: str) -> dict[str, Any]:
        return ensure_dict(await self._get_json(f"matches/{match_id}", headers=self.headers))

    async def get_team(self, team_id: str) -> dict[str, Any]:
        return ensure_dict(await self._get_json(f"teams/{team_id}", headers=self.headers))

    async def get_person(self, person_id: str) -> dict[str, Any]:
        return ensure_dict(await self._get_json(f"persons/{person_id}", headers=self.headers))

    async def get_person_matches(self, person_id: str, limit: int = 10) -> dict[str, Any]:
        payload = await self._get_json(f"persons/{person_id}/matches", params={"limit": limit}, headers=self.headers)
        return ensure_dict(payload)

    def _normalize_match(self, match: dict[str, Any]) -> dict[str, Any]:
        match = ensure_dict(match)
        competition = ensure_dict(match.get("competition"))
        score = ensure_dict(match.get("score"))
        full_time = ensure_dict(score.get("fullTime"))
        home_team_payload = ensure_dict(match.get("homeTeam"))
        away_team_payload = ensure_dict(match.get("awayTeam"))
        return normalize_match_record(
            provider=self.provider_name,
            raw_id=match.get("id"),
            home_team=normalize_team_ref(
                provider=self.provider_name,
                raw_id=home_team_payload.get("id"),
                name=home_team_payload.get("name"),
                short_name=home_team_payload.get("shortName") or home_team_payload.get("tla"),
                crest=home_team_payload.get("crest"),
                provider_ids={self.provider_name: home_team_payload.get("id")},
            ),
            away_team=normalize_team_ref(
                provider=self.provider_name,
                raw_id=away_team_payload.get("id"),
                name=away_team_payload.get("name"),
                short_name=away_team_payload.get("shortName") or away_team_payload.get("tla"),
                crest=away_team_payload.get("crest"),
                provider_ids={self.provider_name: away_team_payload.get("id")},
            ),
            status=match.get("status") or "SCHEDULED",
            kickoff=match.get("utcDate"),
            score_home=full_time.get("home"),
            score_away=full_time.get("away"),
            venue=match.get("venue"),
            competition={
                "id": build_entity_id(self.provider_name, competition.get("id")),
                "name": competition.get("name") or "Unknown competition",
                "code": competition.get("code"),
            },
            minute=match.get("minute"),
            external_ids={self.provider_name: match.get("id")},
            providers=[self.provider_name],
        )


class OpenLigaDBClient(BaseApiClient):
    provider_name = "openligadb"

    def __init__(self) -> None:
        super().__init__()
        self.base_url = settings.openligadb_base_url

    async def get_current_matches(self) -> list[dict[str, Any]]:
        matches: list[dict[str, Any]] = []
        for shortcut in settings.openligadb_leagues:
            payload = await self._get_optional_json(f"getmatchdata/{shortcut}", fallback=[])
            for match in ensure_list(payload):
                if isinstance(match, dict):
                    matches.append(self._normalize_match(match, shortcut))
        return matches

    async def get_match(self, match_id: str) -> dict[str, Any]:
        return ensure_dict(await self._get_json(f"getmatchdata/{match_id}"))

    def _normalize_match(self, match: dict[str, Any], shortcut: str) -> dict[str, Any]:
        match = ensure_dict(match)
        results = [ensure_dict(result) for result in ensure_list(match.get("matchResults"))]
        latest_result = results[-1] if results else {}
        location = ensure_dict(match.get("location"))
        home_team_payload = ensure_dict(match.get("team1"))
        away_team_payload = ensure_dict(match.get("team2"))
        return normalize_match_record(
            provider=self.provider_name,
            raw_id=match.get("matchID"),
            home_team=normalize_team_ref(
                provider=self.provider_name,
                raw_id=home_team_payload.get("teamId"),
                name=home_team_payload.get("teamName"),
                short_name=home_team_payload.get("shortName") or home_team_payload.get("teamName"),
                provider_ids={self.provider_name: home_team_payload.get("teamId")},
            ),
            away_team=normalize_team_ref(
                provider=self.provider_name,
                raw_id=away_team_payload.get("teamId"),
                name=away_team_payload.get("teamName"),
                short_name=away_team_payload.get("shortName") or away_team_payload.get("teamName"),
                provider_ids={self.provider_name: away_team_payload.get("teamId")},
            ),
            status="FINISHED"
            if ensure_bool(match.get("matchIsFinished"))
            else "IN_PLAY"
            if ensure_bool(match.get("matchIsRunning"))
            else "SCHEDULED",
            kickoff=match.get("matchDateTimeUTC") or match.get("matchDateTime"),
            score_home=latest_result.get("pointsTeam1"),
            score_away=latest_result.get("pointsTeam2"),
            venue=location.get("locationStadium"),
            competition={
                "id": build_entity_id(self.provider_name, match.get("leagueId") or shortcut),
                "name": match.get("leagueName") or shortcut.upper(),
                "code": match.get("leagueShortcut") or shortcut.upper(),
            },
            minute=90 if ensure_bool(match.get("matchIsFinished")) else 65 if ensure_bool(match.get("matchIsRunning")) else 0,
            external_ids={self.provider_name: match.get("matchID")},
            providers=[self.provider_name],
        )


async def measure_provider_call(
    provider: str,
    operation: Any,
    *,
    default_factory: Any | None = None,
    expected: str = "any",
) -> tuple[Any, ProviderStatus]:
    if callable(operation):
        return await provider_manager.safe_request(
            provider,
            operation,
            default_factory=default_factory,
            expected=expected,
        )

    async def operation_factory() -> Any:
        return await operation

    return await provider_manager.safe_request(
        provider,
        operation_factory,
        default_factory=default_factory,
        expected=expected,
    )


__all__ = [
    "BaseApiClient",
    "FootballDataClient",
    "OpenLigaDBClient",
    "ProviderConfigurationError",
    "ProviderResponseError",
    "ProviderStatus",
    "TheSportsDBClient",
    "build_entity_id",
    "coerce_int",
    "measure_provider_call",
    "normalize_name",
    "parse_minute",
    "split_entity_id",
    "to_iso",
    "utc_now_iso",
]
