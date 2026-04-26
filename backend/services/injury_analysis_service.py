from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from backend.core.settings import settings

from .api_clients import FootballDataClient
from .cache_layer import cache
from .data_normalizer import coerce_int, days_between, ensure_dict, ensure_list, ensure_str, split_entity_id
from .live_data_service import LiveDataService
from .provider_manager import provider_manager


class InjuryAnalysisService:
    def __init__(
        self,
        football_data_client: FootballDataClient | None = None,
        live_data_service: LiveDataService | None = None,
    ) -> None:
        self.football_data_client = football_data_client or FootballDataClient()
        self.live_data_service = live_data_service or LiveDataService()

    async def get_injury_watch(self, team_id: str | None = None, match_id: str | None = None) -> dict[str, Any]:
        cache_key = f"platform:injury-watch:{team_id or 'all'}:{match_id or 'none'}"
        cached_payload = await cache.get(cache_key)
        if cached_payload is not None:
            return cached_payload

        resolved_team_ids = await self._resolve_team_ids(team_id=team_id, match_id=match_id)
        watchlist: list[dict[str, Any]] = []
        provider_status: list[dict[str, Any]] = []

        for resolved_team_id in resolved_team_ids[:3]:
            team_payload, team_status = await provider_manager.safe_request(
                "football-data",
                lambda resolved_id=resolved_team_id: self.football_data_client.get_team(resolved_id),
                default_factory=dict,
                expected="dict",
            )
            provider_status.append(team_status.as_dict())
            team_payload = ensure_dict(team_payload)
            squad = [ensure_dict(player) for player in ensure_list(team_payload.get("squad"))]
            squad_limit = len(squad) if team_id else min(len(squad), 6)

            for player in squad[:squad_limit]:
                person_id = ensure_str(player.get("id"))
                if not person_id:
                    continue
                matches_payload, matches_status = await provider_manager.safe_request(
                    "football-data",
                    lambda person_value=person_id: self.football_data_client.get_person_matches(person_value, limit=6),
                    default_factory=dict,
                    expected="dict",
                )
                provider_status.append(matches_status.as_dict())
                watchlist.append(self._build_risk_profile(team_payload, player, ensure_dict(matches_payload)))

        watchlist = sorted(watchlist, key=lambda item: item.get("riskScore", 0), reverse=True)
        top_watchlist = watchlist[:18] if team_id else watchlist[:12]
        summary = {
            "highRisk": sum(1 for player in top_watchlist if player.get("status") == "HIGH_RISK"),
            "high_risk": sum(1 for player in top_watchlist if player.get("status") == "HIGH_RISK"),
            "monitor": sum(1 for player in top_watchlist if player.get("status") == "MONITOR"),
            "available": sum(1 for player in top_watchlist if player.get("status") == "AVAILABLE"),
        }
        payload = {
            "watchlist": top_watchlist,
            "summary": summary,
            "providerStatus": provider_status[:20],
            "provider_status": provider_status[:20],
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

    async def _resolve_team_ids(self, team_id: str | None, match_id: str | None) -> list[str]:
        if team_id:
            provider, raw_id = split_entity_id(team_id)
            return [raw_id] if provider == "football-data" else []

        if match_id:
            provider, raw_id = split_entity_id(match_id)
            if provider == "football-data":
                match_payload, _ = await provider_manager.safe_request(
                    "football-data",
                    lambda: self.football_data_client.get_match(raw_id),
                    default_factory=dict,
                    expected="dict",
                )
                match_payload = ensure_dict(match_payload)
                home_team = ensure_dict(match_payload.get("homeTeam"))
                away_team = ensure_dict(match_payload.get("awayTeam"))
                return [ensure_str(home_team.get("id")), ensure_str(away_team.get("id"))]

        live_payload = await self.live_data_service.get_live_matches()
        live_matches = ensure_list(live_payload.get("data", {}).get("matches"))
        resolved: list[str] = []
        for match in live_matches:
            home_team = ensure_dict(ensure_dict(match).get("homeTeamRef")) or ensure_dict(ensure_dict(match).get("home_team"))
            away_team = ensure_dict(ensure_dict(match).get("awayTeamRef")) or ensure_dict(ensure_dict(match).get("away_team"))
            home_provider_ids = ensure_dict(home_team.get("providerIds")) or ensure_dict(home_team.get("provider_ids"))
            away_provider_ids = ensure_dict(away_team.get("providerIds")) or ensure_dict(away_team.get("provider_ids"))
            if home_provider_ids.get("football-data"):
                resolved.append(ensure_str(home_provider_ids.get("football-data")))
            if away_provider_ids.get("football-data"):
                resolved.append(ensure_str(away_provider_ids.get("football-data")))
        if resolved:
            return list(dict.fromkeys([item for item in resolved if item]))
        return list(settings.injury_watch_teams)

    def _build_risk_profile(self, team_payload: dict[str, Any], player: dict[str, Any], matches_payload: dict[str, Any]) -> dict[str, Any]:
        aggregations = ensure_dict(matches_payload.get("aggregations"))
        recent_matches = [ensure_dict(match) for match in ensure_list(matches_payload.get("matches"))]
        matches_on_pitch = coerce_int(aggregations.get("matchesOnPitch"))
        minutes_played = coerce_int(aggregations.get("minutesPlayed"))
        starts = coerce_int(aggregations.get("startingXI"))
        subbed_out = coerce_int(aggregations.get("subbedOut"))
        yellow_cards = coerce_int(aggregations.get("yellowCards"))
        avg_minutes = round(minutes_played / matches_on_pitch, 2) if matches_on_pitch else 0.0

        risk_score = 12
        reasons: list[str] = []
        if matches_on_pitch == 0:
            risk_score += 48
            reasons.append("No recent match load was available, so the availability signal is uncertain.")
        if avg_minutes >= 84:
            risk_score += 30
            reasons.append("The player is carrying a heavy recent minute load.")
        elif avg_minutes >= 72:
            risk_score += 18
            reasons.append("Recent usage is above the ideal recovery band.")
        if starts >= 5:
            risk_score += 12
            reasons.append("The player has started almost every recent match.")
        if subbed_out >= 3:
            risk_score += 10
            reasons.append("Repeated early withdrawals suggest active load management.")
        if yellow_cards >= 3:
            risk_score += 6
            reasons.append("High duel intensity adds physical stress.")
        if self._has_congested_schedule(recent_matches):
            risk_score += 14
            reasons.append("Fixture congestion is compressing recovery windows.")

        fatigue_index = min(100, round((avg_minutes * 0.72) + (starts * 4.5) + (8 if self._has_congested_schedule(recent_matches) else 0)))
        overload_detected = avg_minutes >= 82 or starts >= 5
        risk_score = min(risk_score, 100)
        status = "HIGH_RISK" if risk_score >= 70 else "MONITOR" if risk_score >= 45 else "AVAILABLE"
        fatigue_level = "HIGH" if fatigue_index >= 70 else "MEDIUM" if fatigue_index >= 40 else "LOW"

        team_name = ensure_str(team_payload.get("name"), "Unknown team")
        team_crest = ensure_str(team_payload.get("crest")) or None
        player_id = f"football-data__{player.get('id')}"
        return {
            "playerId": player_id,
            "player_id": player_id,
            "playerName": ensure_str(player.get("name"), "Unknown player"),
            "player_name": ensure_str(player.get("name"), "Unknown player"),
            "position": ensure_str(player.get("position")) or None,
            "shirtNumber": coerce_int(player.get("shirtNumber")) if player.get("shirtNumber") not in (None, "") else None,
            "shirt_number": coerce_int(player.get("shirtNumber")) if player.get("shirtNumber") not in (None, "") else None,
            "team": {
                "id": f"football-data__{team_payload.get('id')}",
                "name": team_name,
                "crest": team_crest,
            },
            "riskScore": risk_score,
            "risk_score": risk_score,
            "status": status,
            "fatigueIndex": fatigue_index,
            "fatigue_index": fatigue_index,
            "fatigueLevel": fatigue_level,
            "fatigue_level": fatigue_level,
            "minutesPlayedRecent": minutes_played,
            "minutes_played_recent": minutes_played,
            "averageMinutes": avg_minutes,
            "average_minutes": avg_minutes,
            "startsRecent": starts,
            "starts_recent": starts,
            "overloadDetected": overload_detected,
            "overload_detected": overload_detected,
            "reasons": reasons or ["No major workload red flags were detected."],
        }

    def _has_congested_schedule(self, recent_matches: list[dict[str, Any]]) -> bool:
        recent_dates = [ensure_str(match.get("utcDate")) for match in recent_matches[:4] if ensure_str(match.get("utcDate"))]
        if len(recent_dates) < 2:
            return False
        for index in range(len(recent_dates) - 1):
            gap = days_between(recent_dates[index], recent_dates[index + 1])
            if gap is not None and gap <= 3:
                return True
        return False
