from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from backend.core.settings import settings

from .api_clients import FootballDataClient, TheSportsDBClient
from .cache_layer import cache
from .data_normalizer import coerce_int, ensure_dict, ensure_list, ensure_str, split_entity_id, utc_now_iso
from .provider_manager import provider_manager


class MatchHistoryService:
    def __init__(
        self,
        football_data_client: FootballDataClient | None = None,
        sportsdb_client: TheSportsDBClient | None = None,
    ) -> None:
        self.football_data_client = football_data_client or FootballDataClient()
        self.sportsdb_client = sportsdb_client or TheSportsDBClient()

    async def get_team_history(self, team_id: str) -> dict[str, Any]:
        cache_key = f"platform:history:{team_id}"
        cached_payload = await cache.get(cache_key)
        if cached_payload is not None:
            return cached_payload

        provider, raw_id = split_entity_id(team_id)
        if provider == "football-data":
            payload = await self._from_football_data(raw_id)
        elif provider == "thesportsdb":
            payload = await self._from_sportsdb(raw_id)
        else:
            payload = self._empty_payload(team_id, provider, "Provider history lookup is not supported for this team id.")

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
        await cache.set(cache_key, wrapped, ttl=settings.history_cache_ttl_seconds)
        return wrapped

    async def _from_football_data(self, team_id: str) -> dict[str, Any]:
        team_payload, team_status = await provider_manager.safe_request(
            "football-data",
            lambda: self.football_data_client.get_team(team_id),
            default_factory=dict,
            expected="dict",
        )
        matches_payload, matches_status = await provider_manager.safe_request(
            "football-data",
            lambda: self.football_data_client.get_team_matches(team_id),
            default_factory=dict,
            expected="dict",
        )

        team_payload = ensure_dict(team_payload)
        matches_payload = ensure_dict(matches_payload)
        team = {
            "id": f"football-data__{team_id}",
            "name": ensure_str(team_payload.get("name"), "Unknown team"),
            "shortName": ensure_str(team_payload.get("shortName")) or ensure_str(team_payload.get("tla")) or ensure_str(team_payload.get("name")),
            "crest": ensure_str(team_payload.get("crest")) or None,
            "venue": ensure_str(team_payload.get("venue")) or None,
        }

        matches = []
        for match in ensure_list(matches_payload.get("matches")):
            match_payload = ensure_dict(match)
            home_team = ensure_dict(match_payload.get("homeTeam"))
            away_team = ensure_dict(match_payload.get("awayTeam"))
            score = ensure_dict(match_payload.get("score"))
            full_time = ensure_dict(score.get("fullTime"))
            is_home = ensure_str(home_team.get("id")) == ensure_str(team_id)
            goals_for = coerce_int(full_time.get("home")) if is_home else coerce_int(full_time.get("away"))
            goals_against = coerce_int(full_time.get("away")) if is_home else coerce_int(full_time.get("home"))
            match_metrics = self._derive_match_metrics(match_payload, goals_for=goals_for, goals_against=goals_against)
            matches.append(
                {
                    "id": f"football-data__{match_payload.get('id')}",
                    "date": match_payload.get("utcDate") or utc_now_iso(),
                    "competition": ensure_str(ensure_dict(match_payload.get("competition")).get("name"), "Unknown competition"),
                    "venue": "HOME" if is_home else "AWAY",
                    "opponent": ensure_str(away_team.get("name") if is_home else home_team.get("name"), "Unknown opponent"),
                    "status": ensure_str(match_payload.get("status"), "FINISHED"),
                    "score": {"for": goals_for, "against": goals_against},
                    "outcome": "W" if goals_for > goals_against else "L" if goals_for < goals_against else "D",
                    "metrics": match_metrics,
                }
            )

        trends = self._build_trends(matches)
        return {
            "team": team,
            "matches": matches,
            "trends": trends,
            "teamStats": {
                "formIndex": trends["formIndex"],
                "attackStrength": trends["attackStrength"],
                "defenseStrength": trends["defenseStrength"],
                "estimatedPossessionTrend": trends["estimatedPossessionTrend"],
            },
            "team_stats": {
                "form_index": trends["formIndex"],
                "attack_strength": trends["attackStrength"],
                "defense_strength": trends["defenseStrength"],
                "estimated_possession_trend": trends["estimatedPossessionTrend"],
            },
            "providerStatus": [team_status.as_dict(), matches_status.as_dict()],
            "provider_status": [team_status.as_dict(), matches_status.as_dict()],
        }

    async def _from_sportsdb(self, team_id: str) -> dict[str, Any]:
        matches_payload, matches_status = await provider_manager.safe_request(
            "thesportsdb",
            lambda: self.sportsdb_client.get_team_history(team_id),
            default_factory=list,
            expected="list",
        )
        matches = [ensure_dict(match) for match in ensure_list(matches_payload)]
        trends = self._build_trends(matches)
        return {
            "team": {"id": f"thesportsdb__{team_id}", "name": f"TheSportsDB team {team_id}", "crest": None},
            "matches": matches,
            "trends": trends,
            "teamStats": {
                "formIndex": trends["formIndex"],
                "attackStrength": trends["attackStrength"],
                "defenseStrength": trends["defenseStrength"],
                "estimatedPossessionTrend": trends["estimatedPossessionTrend"],
            },
            "team_stats": {
                "form_index": trends["formIndex"],
                "attack_strength": trends["attackStrength"],
                "defense_strength": trends["defenseStrength"],
                "estimated_possession_trend": trends["estimatedPossessionTrend"],
            },
            "providerStatus": [matches_status.as_dict()],
            "provider_status": [matches_status.as_dict()],
        }

    def _empty_payload(self, team_id: str, provider: str, message: str) -> dict[str, Any]:
        trends = self._build_trends([])
        return {
            "team": {"id": team_id, "name": "Unknown team", "crest": None},
            "matches": [],
            "trends": trends,
            "teamStats": {
                "formIndex": trends["formIndex"],
                "attackStrength": trends["attackStrength"],
                "defenseStrength": trends["defenseStrength"],
                "estimatedPossessionTrend": trends["estimatedPossessionTrend"],
            },
            "team_stats": {
                "form_index": trends["formIndex"],
                "attack_strength": trends["attackStrength"],
                "defense_strength": trends["defenseStrength"],
                "estimated_possession_trend": trends["estimatedPossessionTrend"],
            },
            "providerStatus": [{"provider": provider, "success": False, "latencyMs": None, "latency_ms": None, "itemCount": 0, "item_count": 0, "error": message, "stale": False}],
            "provider_status": [{"provider": provider, "success": False, "latencyMs": None, "latency_ms": None, "itemCount": 0, "item_count": 0, "error": message, "stale": False}],
        }

    def _derive_match_metrics(self, match_payload: dict[str, Any], *, goals_for: int, goals_against: int) -> dict[str, Any]:
        score_margin = goals_for - goals_against
        shots = max((goals_for * 3) + 4, 1)
        shots_on_target = max(goals_for + 2, 1)
        possession = min(65, max(38, 50 + (score_margin * 4)))
        passes = max(280, 380 + (score_margin * 35))
        return {
            "shots": shots,
            "shotsOnTarget": shots_on_target,
            "possession": possession,
            "passes": passes,
            "xMomentum": round((shots_on_target * 1.4) + (possession * 0.25), 2),
            "matchId": f"football-data__{match_payload.get('id')}",
        }

    def _build_trends(self, matches: list[dict[str, Any]]) -> dict[str, Any]:
        if not matches:
            return {
                "form": [],
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "goalsFor": 0,
                "goalsAgainst": 0,
                "goals_for": 0,
                "goals_against": 0,
                "pointsPerMatch": 0.0,
                "points_per_match": 0.0,
                "formIndex": 0.0,
                "attackStrength": 0.0,
                "attack_strength": 0.0,
                "defenseStrength": 0.0,
                "defense_strength": 0.0,
                "estimatedPossessionTrend": 50.0,
                "estimated_possession_trend": 50.0,
            }

        wins = sum(1 for match in matches if match.get("outcome") == "W")
        draws = sum(1 for match in matches if match.get("outcome") == "D")
        losses = sum(1 for match in matches if match.get("outcome") == "L")
        goals_for = sum(coerce_int(ensure_dict(match.get("score")).get("for")) for match in matches)
        goals_against = sum(coerce_int(ensure_dict(match.get("score")).get("against")) for match in matches)
        possession_values = [coerce_int(ensure_dict(match.get("metrics")).get("possession"), 50) for match in matches]
        points = wins * 3 + draws
        attack_strength = round(goals_for / max(len(matches), 1), 2)
        defense_strength = round(max(0.0, 2.4 - (goals_against / max(len(matches), 1))), 2)
        form_index = round((points / (len(matches) * 3)) * 100, 2)
        estimated_possession = round(sum(possession_values) / max(len(possession_values), 1), 2)
        return {
            "form": [ensure_str(match.get("outcome")) for match in matches[:5]],
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "goalsFor": goals_for,
            "goals_for": goals_for,
            "goalsAgainst": goals_against,
            "goals_against": goals_against,
            "pointsPerMatch": round(points / len(matches), 2),
            "points_per_match": round(points / len(matches), 2),
            "formIndex": form_index,
            "attackStrength": attack_strength,
            "attack_strength": attack_strength,
            "defenseStrength": defense_strength,
            "defense_strength": defense_strength,
            "estimatedPossessionTrend": estimated_possession,
            "estimated_possession_trend": estimated_possession,
        }
