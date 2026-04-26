from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from backend.core.settings import settings

from .api_clients import FootballDataClient, TheSportsDBClient
from .cache_layer import cache
from .data_normalizer import (
    coerce_int,
    ensure_dict,
    ensure_list,
    ensure_str,
    infer_age,
    normalize_player_brief,
    normalize_team_ref,
    split_entity_id,
)
from .injury_analysis_service import InjuryAnalysisService
from .match_history_service import MatchHistoryService
from .provider_manager import provider_manager


class TeamIntelligenceService:
    def __init__(
        self,
        football_data_client: FootballDataClient | None = None,
        sportsdb_client: TheSportsDBClient | None = None,
        match_history_service: MatchHistoryService | None = None,
        injury_analysis_service: InjuryAnalysisService | None = None,
    ) -> None:
        self.football_data_client = football_data_client or FootballDataClient()
        self.sportsdb_client = sportsdb_client or TheSportsDBClient()
        self.match_history_service = match_history_service or MatchHistoryService()
        self.injury_analysis_service = injury_analysis_service or InjuryAnalysisService()

    async def get_team_details(self, team_id: str) -> dict[str, Any]:
        cache_key = f"platform:team:{team_id}"
        cached_payload = await cache.get(cache_key)
        if cached_payload is not None:
            return cached_payload

        provider, raw_id = split_entity_id(team_id)
        if provider == "football-data":
            payload = await self._from_football_data(raw_id)
        elif provider == "thesportsdb":
            payload = await self._from_sportsdb(raw_id)
        else:
            payload = self._empty_payload(team_id, provider, "Team provider is not supported.")

        generated_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        wrapped = {
            "data": payload,
            "meta": {
                "generatedAt": generated_at,
                "generated_at": generated_at,
                "schemaVersion": settings.api_schema_version,
                "schema_version": settings.api_schema_version,
                "stale": False,
            },
        }
        await cache.set(cache_key, wrapped, ttl=settings.analytics_cache_ttl_seconds)
        return wrapped

    async def get_team_squad(self, team_id: str) -> dict[str, Any]:
        cache_key = f"platform:team-squad:{team_id}"
        cached_payload = await cache.get(cache_key)
        if cached_payload is not None:
            return cached_payload

        team_details = await self.get_team_details(team_id)
        base_team = ensure_dict(team_details.get("data", {}).get("team"))
        squad = [ensure_dict(player) for player in ensure_list(team_details.get("data", {}).get("squad"))]
        lineup = self._project_lineup(squad)
        payload = {
            "team": base_team,
            "squad": squad,
            "startingXI": lineup["startingXI"],
            "starting_xi": lineup["startingXI"],
            "bench": lineup["bench"],
            "availabilitySummary": lineup["availabilitySummary"],
            "availability_summary": lineup["availabilitySummary"],
            "providerStatus": ensure_list(team_details.get("data", {}).get("providerStatus")) or ensure_list(team_details.get("data", {}).get("provider_status")),
            "provider_status": ensure_list(team_details.get("data", {}).get("providerStatus")) or ensure_list(team_details.get("data", {}).get("provider_status")),
        }
        generated_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        wrapped = {
            "data": payload,
            "meta": {
                "generatedAt": generated_at,
                "generated_at": generated_at,
                "schemaVersion": settings.api_schema_version,
                "schema_version": settings.api_schema_version,
                "stale": False,
            },
        }
        await cache.set(cache_key, wrapped, ttl=settings.analytics_cache_ttl_seconds)
        return wrapped

    async def _from_football_data(self, team_id: str) -> dict[str, Any]:
        team_payload, team_status = await provider_manager.safe_request(
            "football-data",
            lambda: self.football_data_client.get_team(team_id),
            default_factory=dict,
            expected="dict",
        )
        history_payload = await self.match_history_service.get_team_history(f"football-data__{team_id}")
        injury_payload = await self.injury_analysis_service.get_injury_watch(team_id=f"football-data__{team_id}")

        team_payload = ensure_dict(team_payload)
        active_competitions = [ensure_dict(item) for item in ensure_list(team_payload.get("runningCompetitions"))]
        coach = ensure_dict(team_payload.get("coach"))
        squad_players = [ensure_dict(player) for player in ensure_list(team_payload.get("squad"))]
        injury_lookup = {
            ensure_str(player.get("player_id")): player
            for player in ensure_list(injury_payload.get("data", {}).get("watchlist"))
            if isinstance(player, dict)
        }
        squad = [self._normalize_football_data_squad_player(player, team_payload, injury_lookup) for player in squad_players]
        trends = ensure_dict(history_payload.get("data", {}).get("trends"))

        team = {
            "id": f"football-data__{team_id}",
            "name": ensure_str(team_payload.get("name"), "Unknown team"),
            "shortName": ensure_str(team_payload.get("shortName")) or ensure_str(team_payload.get("tla")) or ensure_str(team_payload.get("name")),
            "logo": ensure_str(team_payload.get("crest")) or None,
            "crest": ensure_str(team_payload.get("crest")) or None,
            "venue": ensure_str(team_payload.get("venue")) or None,
            "address": ensure_str(team_payload.get("address")) or None,
            "website": ensure_str(team_payload.get("website")) or None,
            "clubColors": ensure_str(team_payload.get("clubColors")) or None,
            "club_colors": ensure_str(team_payload.get("clubColors")) or None,
            "founded": coerce_int(team_payload.get("founded")) or None,
            "league": self._normalize_league(active_competitions),
            "manager": {
                "id": f"football-data__manager__{team_id}",
                "name": ensure_str(coach.get("name"), "Unknown coach"),
                "nationality": ensure_str(coach.get("nationality")) or None,
                "dateOfBirth": ensure_str(coach.get("dateOfBirth")) or None,
                "date_of_birth": ensure_str(coach.get("dateOfBirth")) or None,
            },
        }

        squad_summary = {
            "totalPlayers": len(squad),
            "total_players": len(squad),
            "goalkeepers": sum(1 for player in squad if player.get("position") == "Goalkeeper"),
            "defenders": sum(1 for player in squad if player.get("position") == "Defence"),
            "midfielders": sum(1 for player in squad if player.get("position") == "Midfield"),
            "attackers": sum(1 for player in squad if player.get("position") == "Offence"),
            "available": sum(1 for player in squad if player.get("availability", {}).get("status") == "AVAILABLE"),
            "monitor": sum(1 for player in squad if player.get("availability", {}).get("status") == "MONITOR"),
            "highRisk": sum(1 for player in squad if player.get("availability", {}).get("status") == "HIGH_RISK"),
            "high_risk": sum(1 for player in squad if player.get("availability", {}).get("status") == "HIGH_RISK"),
        }

        return {
            "team": team,
            "stats": {
                "wins": trends.get("wins", 0),
                "draws": trends.get("draws", 0),
                "losses": trends.get("losses", 0),
                "goalsFor": trends.get("goalsFor", 0),
                "goals_for": trends.get("goalsFor", 0),
                "goalsAgainst": trends.get("goalsAgainst", 0),
                "goals_against": trends.get("goalsAgainst", 0),
                "pointsPerMatch": trends.get("pointsPerMatch", 0.0),
                "points_per_match": trends.get("pointsPerMatch", 0.0),
                "attackStrength": trends.get("attackStrength", 0.0),
                "attack_strength": trends.get("attackStrength", 0.0),
                "defenseStrength": trends.get("defenseStrength", 0.0),
                "defense_strength": trends.get("defenseStrength", 0.0),
                "estimatedPossessionTrend": trends.get("estimatedPossessionTrend", 50.0),
                "estimated_possession_trend": trends.get("estimatedPossessionTrend", 50.0),
            },
            "recentForm": trends,
            "recent_form": trends,
            "squadSummary": squad_summary,
            "squad_summary": squad_summary,
            "squad": squad,
            "providerStatus": [team_status.as_dict()] + ensure_list(history_payload.get("data", {}).get("providerStatus")) + ensure_list(injury_payload.get("data", {}).get("providerStatus")),
            "provider_status": [team_status.as_dict()] + ensure_list(history_payload.get("data", {}).get("providerStatus")) + ensure_list(injury_payload.get("data", {}).get("providerStatus")),
        }

    async def _from_sportsdb(self, team_id: str) -> dict[str, Any]:
        team_payload, team_status = await provider_manager.safe_request(
            "thesportsdb",
            lambda: self.sportsdb_client.get_team_details(team_id),
            default_factory=dict,
            expected="dict",
        )
        player_payload, player_status = await provider_manager.safe_request(
            "thesportsdb",
            lambda: self.sportsdb_client.get_team_players(team_id),
            default_factory=list,
            expected="list",
        )

        team_payload = ensure_dict(team_payload)
        squad = [self._normalize_sportsdb_player(player, team_id, team_payload) for player in ensure_list(player_payload)]
        team = {
            "id": f"thesportsdb__{team_id}",
            "name": ensure_str(team_payload.get("strTeam"), "Unknown team"),
            "shortName": ensure_str(team_payload.get("strTeamShort")) or ensure_str(team_payload.get("strTeam")),
            "logo": ensure_str(team_payload.get("strBadge")) or None,
            "crest": ensure_str(team_payload.get("strBadge")) or None,
            "venue": ensure_str(team_payload.get("strStadium")) or None,
            "league": {
                "name": ensure_str(team_payload.get("strLeague")) or None,
                "country": ensure_str(team_payload.get("strCountry")) or None,
            },
            "manager": {
                "id": f"thesportsdb__manager__{team_id}",
                "name": ensure_str(team_payload.get("strManager"), "Unknown coach"),
                "nationality": ensure_str(team_payload.get("strCountry")) or None,
            },
        }
        trends = ensure_dict((await self.match_history_service.get_team_history(f"thesportsdb__{team_id}")).get("data", {}).get("trends"))
        squad_summary = {
            "totalPlayers": len(squad),
            "total_players": len(squad),
            "available": len(squad),
            "monitor": 0,
            "highRisk": 0,
            "high_risk": 0,
        }
        return {
            "team": team,
            "stats": {
                "wins": trends.get("wins", 0),
                "draws": trends.get("draws", 0),
                "losses": trends.get("losses", 0),
                "goalsFor": trends.get("goalsFor", 0),
                "goals_for": trends.get("goalsFor", 0),
                "goalsAgainst": trends.get("goalsAgainst", 0),
                "goals_against": trends.get("goalsAgainst", 0),
                "pointsPerMatch": trends.get("pointsPerMatch", 0.0),
                "points_per_match": trends.get("pointsPerMatch", 0.0),
                "attackStrength": trends.get("attackStrength", 0.0),
                "attack_strength": trends.get("attackStrength", 0.0),
                "defenseStrength": trends.get("defenseStrength", 0.0),
                "defense_strength": trends.get("defenseStrength", 0.0),
                "estimatedPossessionTrend": trends.get("estimatedPossessionTrend", 50.0),
                "estimated_possession_trend": trends.get("estimatedPossessionTrend", 50.0),
            },
            "recentForm": trends,
            "recent_form": trends,
            "squadSummary": squad_summary,
            "squad_summary": squad_summary,
            "squad": squad,
            "providerStatus": [team_status.as_dict(), player_status.as_dict()],
            "provider_status": [team_status.as_dict(), player_status.as_dict()],
        }

    def _normalize_football_data_squad_player(
        self,
        player: dict[str, Any],
        team_payload: dict[str, Any],
        injury_lookup: dict[str, dict[str, Any]],
    ) -> dict[str, Any]:
        team_ref = normalize_team_ref(
            provider="football-data",
            raw_id=team_payload.get("id"),
            name=team_payload.get("name"),
            short_name=team_payload.get("shortName") or team_payload.get("tla"),
            crest=team_payload.get("crest"),
            provider_ids={"football-data": team_payload.get("id")},
        )
        player_ref = normalize_player_brief(
            provider="football-data",
            raw_id=player.get("id"),
            name=player.get("name"),
            position=player.get("position"),
            shirt_number=player.get("shirtNumber"),
            nationality=player.get("nationality"),
            current_team=team_ref,
        )
        risk = injury_lookup.get(player_ref["id"], {})
        availability = {
            "status": ensure_str(risk.get("status"), "AVAILABLE"),
            "riskScore": coerce_int(risk.get("risk_score")),
            "risk_score": coerce_int(risk.get("risk_score")),
            "label": ensure_str(risk.get("status"), "AVAILABLE").replace("_", " ").title(),
        }
        player_ref["age"] = infer_age(player.get("dateOfBirth"))
        player_ref["availability"] = availability
        player_ref["roleCategory"] = self._role_category(player_ref.get("position"))
        player_ref["role_category"] = player_ref["roleCategory"]
        return player_ref

    def _normalize_sportsdb_player(self, player: dict[str, Any], team_id: str, team_payload: dict[str, Any]) -> dict[str, Any]:
        team_ref = normalize_team_ref(
            provider="thesportsdb",
            raw_id=team_id,
            name=team_payload.get("strTeam"),
            short_name=team_payload.get("strTeamShort"),
            crest=team_payload.get("strBadge"),
            provider_ids={"thesportsdb": team_id},
        )
        player_ref = normalize_player_brief(
            provider="thesportsdb",
            raw_id=player.get("idPlayer"),
            name=player.get("strPlayer"),
            position=player.get("strPosition"),
            shirt_number=player.get("strNumber"),
            nationality=player.get("strNationality"),
            current_team=team_ref,
        )
        player_ref["age"] = infer_age(player.get("dateBorn"))
        player_ref["availability"] = {"status": "AVAILABLE", "riskScore": 0, "risk_score": 0, "label": "Available"}
        player_ref["roleCategory"] = self._role_category(player_ref.get("position"))
        player_ref["role_category"] = player_ref["roleCategory"]
        return player_ref

    def _normalize_league(self, active_competitions: list[dict[str, Any]]) -> dict[str, Any]:
        primary = active_competitions[0] if active_competitions else {}
        return {
            "name": ensure_str(primary.get("name")) or None,
            "code": ensure_str(primary.get("code")) or None,
            "type": ensure_str(primary.get("type")) or None,
            "emblem": ensure_str(primary.get("emblem")) or None,
        }

    def _project_lineup(self, squad: list[dict[str, Any]]) -> dict[str, Any]:
        ordering = {"Goalkeeper": 0, "Defence": 1, "Defender": 1, "Midfield": 2, "Offence": 3, "Forward": 3}
        available_first = sorted(
            squad,
            key=lambda player: (
                0 if ensure_dict(player.get("availability")).get("status") == "AVAILABLE" else 1,
                ordering.get(ensure_str(player.get("position")), 4),
                coerce_int(player.get("shirtNumber"), 99),
            ),
        )
        starting_xi = available_first[:11]
        bench = available_first[11:18]
        availability_summary = {
            "available": sum(1 for player in squad if ensure_dict(player.get("availability")).get("status") == "AVAILABLE"),
            "monitor": sum(1 for player in squad if ensure_dict(player.get("availability")).get("status") == "MONITOR"),
            "highRisk": sum(1 for player in squad if ensure_dict(player.get("availability")).get("status") == "HIGH_RISK"),
            "high_risk": sum(1 for player in squad if ensure_dict(player.get("availability")).get("status") == "HIGH_RISK"),
        }
        return {"startingXI": starting_xi, "bench": bench, "availabilitySummary": availability_summary}

    def _role_category(self, position: Any) -> str:
        value = ensure_str(position).lower()
        if "goal" in value:
            return "Last line"
        if "def" in value:
            return "Back line"
        if "mid" in value:
            return "Control line"
        if "off" in value or "forw" in value or "strik" in value:
            return "Final-third line"
        return "Utility"

    def _empty_payload(self, team_id: str, provider: str, message: str) -> dict[str, Any]:
        status = {
            "provider": provider,
            "success": False,
            "latencyMs": None,
            "latency_ms": None,
            "itemCount": 0,
            "item_count": 0,
            "error": message,
            "stale": False,
        }
        return {
            "team": {"id": team_id, "name": "Unknown team", "league": {}, "manager": {}},
            "stats": {},
            "recentForm": {},
            "recent_form": {},
            "squadSummary": {"totalPlayers": 0, "total_players": 0},
            "squad_summary": {"totalPlayers": 0, "total_players": 0},
            "squad": [],
            "providerStatus": [status],
            "provider_status": [status],
        }
