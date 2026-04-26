from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from backend.core.settings import settings

from .cache_layer import cache
from .injury_analysis_service import InjuryAnalysisService
from .live_data_service import LiveDataService
from .manager_profile_service import ManagerProfileService
from .player_analytics_service import PlayerAnalyticsService
from .tactical_engine_service import TacticalEngineService
from .team_intelligence_service import TeamIntelligenceService


class DashboardSummaryService:
    def __init__(
        self,
        live_data_service: LiveDataService | None = None,
        tactical_engine_service: TacticalEngineService | None = None,
        injury_analysis_service: InjuryAnalysisService | None = None,
        player_analytics_service: PlayerAnalyticsService | None = None,
        team_intelligence_service: TeamIntelligenceService | None = None,
        manager_profile_service: ManagerProfileService | None = None,
    ) -> None:
        self.live_data_service = live_data_service or LiveDataService()
        self.tactical_engine_service = tactical_engine_service or TacticalEngineService()
        self.injury_analysis_service = injury_analysis_service or InjuryAnalysisService()
        self.player_analytics_service = player_analytics_service or PlayerAnalyticsService()
        self.team_intelligence_service = team_intelligence_service or TeamIntelligenceService()
        self.manager_profile_service = manager_profile_service or ManagerProfileService(
            team_intelligence_service=self.team_intelligence_service
        )

    async def get_summary(self) -> dict[str, Any]:
        cache_key = "platform:dashboard-summary"
        cached_payload = await cache.get(cache_key)
        if cached_payload is not None:
            return cached_payload

        live_payload = await self.live_data_service.get_live_matches()
        live_data = live_payload["data"]
        matches = live_data.get("matches", [])
        featured_match = matches[0] if matches else None

        tactical_task = self.tactical_engine_service.get_tactical_analysis(featured_match["id"]) if featured_match else None
        injury_task = self.injury_analysis_service.get_injury_watch(match_id=featured_match["id"] if featured_match else None)
        prediction_tasks = [self.tactical_engine_service.get_tactical_analysis(match["id"]) for match in matches[:4]]

        tactical_spotlight, injury_watch, prediction_payloads = await asyncio.gather(
            tactical_task if tactical_task is not None else self._empty_async({"data": None}),
            injury_task,
            asyncio.gather(*prediction_tasks) if prediction_tasks else self._empty_async([]),
        )

        featured_players = await self._build_featured_players(injury_watch["data"]["watchlist"])
        featured_teams = await self._build_featured_teams(matches)
        featured_managers = await self._build_featured_managers(featured_teams)

        prediction_board = []
        for match, tactical in zip(matches[:4], prediction_payloads):
            prediction_board.append(
                {
                    "matchId": match["id"],
                    "match_id": match["id"],
                    "matchLabel": f"{match['homeTeam']} vs {match['awayTeam']}",
                    "match_label": f"{match['homeTeam']} vs {match['awayTeam']}",
                    "prediction": tactical["data"]["analysis"]["prediction"],
                }
            )

        payload = {
            "overviewCards": [
                {"label": "Tracked matches", "value": live_data["summary"]["totalMatches"], "tone": "default"},
                {"label": "Live now", "value": live_data["summary"]["liveMatches"], "tone": "highlight"},
                {"label": "Injury alerts", "value": injury_watch["data"]["summary"]["highRisk"], "tone": "warning"},
                {"label": "Predictions ready", "value": len(prediction_board), "tone": "default"},
            ],
            "overview_cards": [
                {"label": "Tracked matches", "value": live_data["summary"]["totalMatches"], "tone": "default"},
                {"label": "Live now", "value": live_data["summary"]["liveMatches"], "tone": "highlight"},
                {"label": "Injury alerts", "value": injury_watch["data"]["summary"]["highRisk"], "tone": "warning"},
                {"label": "Predictions ready", "value": len(prediction_board), "tone": "default"},
            ],
            "systemStatus": live_data.get("providerStatus", []),
            "system_status": live_data.get("providerStatus", []),
            "liveBoard": matches[:8],
            "live_board": matches[:8],
            "featuredMatch": featured_match,
            "featured_match": featured_match,
            "tacticalSpotlight": tactical_spotlight["data"] if tactical_spotlight and tactical_spotlight.get("data") else None,
            "tactical_spotlight": tactical_spotlight["data"] if tactical_spotlight and tactical_spotlight.get("data") else None,
            "injuryWatch": injury_watch["data"]["watchlist"][:6],
            "injury_watch": injury_watch["data"]["watchlist"][:6],
            "featuredPlayers": featured_players,
            "featured_players": featured_players,
            "featuredTeams": featured_teams,
            "featured_teams": featured_teams,
            "featuredManagers": featured_managers,
            "featured_managers": featured_managers,
            "predictionBoard": prediction_board,
            "prediction_board": prediction_board,
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
        await cache.set(cache_key, wrapped, ttl=settings.dashboard_cache_ttl_seconds)
        return wrapped

    async def _build_featured_players(self, watchlist: list[dict[str, Any]]) -> list[dict[str, Any]]:
        tasks = [self.player_analytics_service.get_player_analytics(player["playerId"]) for player in watchlist[:4]]
        analytics_payloads = await asyncio.gather(*tasks) if tasks else []
        featured_players = []
        for player, analytics in zip(watchlist[:4], analytics_payloads):
            featured_players.append(
                {
                    "player": analytics["data"]["player"],
                    "analytics": analytics["data"]["analytics"],
                    "risk": {"score": player["riskScore"], "status": player["status"]},
                }
            )
        return featured_players

    async def _build_featured_teams(self, matches: list[dict[str, Any]]) -> list[dict[str, Any]]:
        team_ids: list[str] = []
        for match in matches:
            for team_key in ("homeTeamRef", "awayTeamRef"):
                team = match.get(team_key) or match.get(team_key.replace("Ref", "").lower())
                team_id = (team or {}).get("id")
                if team_id and team_id not in team_ids:
                    team_ids.append(team_id)
        tasks = [self.team_intelligence_service.get_team_details(team_id) for team_id in team_ids[: settings.dashboard_featured_team_limit]]
        payloads = await asyncio.gather(*tasks) if tasks else []
        return [payload["data"] for payload in payloads]

    async def _build_featured_managers(self, featured_teams: list[dict[str, Any]]) -> list[dict[str, Any]]:
        tasks = [self.manager_profile_service.get_manager_profile(team["team"]["id"]) for team in featured_teams[:4] if team.get("team", {}).get("id")]
        payloads = await asyncio.gather(*tasks) if tasks else []
        return [payload["data"] for payload in payloads]

    async def _empty_async(self, value: Any) -> Any:
        return value
