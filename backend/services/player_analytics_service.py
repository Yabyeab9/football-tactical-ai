from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from backend.core.settings import settings

from .api_clients import FootballDataClient
from .cache_layer import cache
from .data_normalizer import (
    coerce_float,
    coerce_int,
    ensure_dict,
    ensure_list,
    ensure_str,
    normalize_player_brief,
    normalize_team_ref,
    split_entity_id,
)
from .provider_manager import provider_manager


class PlayerAnalyticsService:
    def __init__(self, football_data_client: FootballDataClient | None = None) -> None:
        self.football_data_client = football_data_client or FootballDataClient()

    async def get_player_analytics(self, player_id: str) -> dict[str, Any]:
        cache_key = f"platform:player:{player_id}"
        cached_payload = await cache.get(cache_key)
        if cached_payload is not None:
            return cached_payload

        provider, raw_id = split_entity_id(player_id)
        if provider != "football-data":
            payload = self._empty_payload(player_id, provider)
        else:
            payload = await self._from_football_data(raw_id)

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

    async def _from_football_data(self, player_id: str) -> dict[str, Any]:
        person_payload, person_status = await provider_manager.safe_request(
            "football-data",
            lambda: self.football_data_client.get_person(player_id),
            default_factory=dict,
            expected="dict",
        )
        matches_payload, matches_status = await provider_manager.safe_request(
            "football-data",
            lambda: self.football_data_client.get_person_matches(player_id, limit=10),
            default_factory=dict,
            expected="dict",
        )

        person_payload = ensure_dict(person_payload)
        matches_payload = ensure_dict(matches_payload)
        aggregations = ensure_dict(matches_payload.get("aggregations"))
        matches = [ensure_dict(match) for match in ensure_list(matches_payload.get("matches"))]
        minutes_played = coerce_int(aggregations.get("minutesPlayed"))
        matches_on_pitch = coerce_int(aggregations.get("matchesOnPitch"))
        goals = coerce_int(aggregations.get("goals"))
        assists = coerce_int(aggregations.get("assists"))
        starts = coerce_int(aggregations.get("startingXI"))
        substitutions_in = coerce_int(aggregations.get("subbedIn"))
        substitutions_out = coerce_int(aggregations.get("subbedOut"))
        yellow_cards = coerce_int(aggregations.get("yellowCards"))
        red_cards = coerce_int(aggregations.get("redCards"))
        position = ensure_str(person_payload.get("position"), "Unknown")

        current_team_payload = ensure_dict(person_payload.get("currentTeam"))
        current_team = normalize_team_ref(
            provider="football-data",
            raw_id=current_team_payload.get("id"),
            name=current_team_payload.get("name"),
            short_name=current_team_payload.get("shortName") or current_team_payload.get("tla"),
            crest=current_team_payload.get("crest"),
            provider_ids={"football-data": current_team_payload.get("id")},
        )

        analytics = self._build_analytics(
            position=position,
            minutes_played=minutes_played,
            matches_on_pitch=matches_on_pitch,
            starts=starts,
            goals=goals,
            assists=assists,
            substitutions_in=substitutions_in,
            substitutions_out=substitutions_out,
            yellow_cards=yellow_cards,
            red_cards=red_cards,
        )

        recent_matches = [self._build_recent_match(match, current_team_id=current_team_payload.get("id")) for match in matches[:5]]
        player = normalize_player_brief(
            provider="football-data",
            raw_id=person_payload.get("id") or player_id,
            name=person_payload.get("name"),
            position=position,
            shirt_number=person_payload.get("shirtNumber"),
            nationality=person_payload.get("nationality"),
            current_team=current_team,
            role=analytics["roleProfile"]["primaryRole"],
        )
        player["dateOfBirth"] = ensure_str(person_payload.get("dateOfBirth")) or None
        player["date_of_birth"] = player["dateOfBirth"]

        return {
            "player": player,
            "analytics": analytics,
            "recentMatches": recent_matches,
            "recent_matches": recent_matches,
            "providerStatus": [person_status.as_dict(), matches_status.as_dict()],
            "provider_status": [person_status.as_dict(), matches_status.as_dict()],
        }

    def _build_analytics(
        self,
        *,
        position: str,
        minutes_played: int,
        matches_on_pitch: int,
        starts: int,
        goals: int,
        assists: int,
        substitutions_in: int,
        substitutions_out: int,
        yellow_cards: int,
        red_cards: int,
    ) -> dict[str, Any]:
        minutes_per_match = round(minutes_played / matches_on_pitch, 2) if matches_on_pitch else 0.0
        goals_per_90 = round((goals * 90) / minutes_played, 2) if minutes_played else 0.0
        assists_per_90 = round((assists * 90) / minutes_played, 2) if minutes_played else 0.0
        contribution_per_90 = round(((goals + assists) * 90) / minutes_played, 2) if minutes_played else 0.0
        availability_rate = round((starts / matches_on_pitch) * 100, 2) if matches_on_pitch else 0.0
        form_index = round(min(100.0, (contribution_per_90 * 28) + (availability_rate * 0.45) + 18), 2)
        performance_rating = round(min(10.0, 5.9 + (contribution_per_90 * 0.8) + (availability_rate * 0.01)), 2)
        inferred_shots_per_90 = round(self._infer_shots_per_90(position, goals_per_90, contribution_per_90), 2)
        inferred_key_passes_per_90 = round(self._infer_key_passes_per_90(position, assists_per_90, contribution_per_90), 2)
        inferred_passes_per_90 = round(self._infer_passes_per_90(position, availability_rate), 2)
        contribution_heat = self._build_contribution_heat(position, contribution_per_90, availability_rate)
        role_profile = self._build_role_profile(position, goals_per_90, assists_per_90, inferred_key_passes_per_90)
        return {
            "minutesPlayed": minutes_played,
            "minutes_played": minutes_played,
            "matchesOnPitch": matches_on_pitch,
            "matches_on_pitch": matches_on_pitch,
            "starts": starts,
            "goals": goals,
            "assists": assists,
            "substitutionsIn": substitutions_in,
            "substitutions_in": substitutions_in,
            "substitutionsOut": substitutions_out,
            "substitutions_out": substitutions_out,
            "cards": {"yellow": yellow_cards, "red": red_cards},
            "minutesPerMatch": minutes_per_match,
            "minutes_per_match": minutes_per_match,
            "goalsPer90": goals_per_90,
            "goals_per_90": goals_per_90,
            "assistsPer90": assists_per_90,
            "assists_per_90": assists_per_90,
            "goalContributionsPer90": contribution_per_90,
            "goal_contributions_per_90": contribution_per_90,
            "availabilityRate": availability_rate,
            "availability_rate": availability_rate,
            "formIndex": form_index,
            "form_index": form_index,
            "performanceRating": performance_rating,
            "performance_rating": performance_rating,
            "inferredShotsPer90": inferred_shots_per_90,
            "inferred_shots_per_90": inferred_shots_per_90,
            "inferredKeyPassesPer90": inferred_key_passes_per_90,
            "inferred_key_passes_per_90": inferred_key_passes_per_90,
            "inferredPassesPer90": inferred_passes_per_90,
            "inferred_passes_per_90": inferred_passes_per_90,
            "contributionHeat": contribution_heat,
            "contribution_heat": contribution_heat,
            "roleProfile": role_profile,
            "role_profile": role_profile,
        }

    def _build_recent_match(self, match: dict[str, Any], *, current_team_id: Any) -> dict[str, Any]:
        home_team = ensure_dict(match.get("homeTeam"))
        away_team = ensure_dict(match.get("awayTeam"))
        score = ensure_dict(ensure_dict(match.get("score")).get("fullTime"))
        is_home = ensure_str(home_team.get("id")) == ensure_str(current_team_id)
        goals_for = coerce_int(score.get("home")) if is_home else coerce_int(score.get("away"))
        goals_against = coerce_int(score.get("away")) if is_home else coerce_int(score.get("home"))
        impact = round(6.0 + (goals_for * 0.6) - (goals_against * 0.15), 2)
        return {
            "id": f"football-data__{match.get('id')}",
            "date": ensure_str(match.get("utcDate")),
            "competition": ensure_str(ensure_dict(match.get("competition")).get("name"), "Unknown competition"),
            "opponent": ensure_str(away_team.get("name") if is_home else home_team.get("name"), "Unknown opponent"),
            "score": {"home": coerce_int(score.get("home")), "away": coerce_int(score.get("away"))},
            "status": ensure_str(match.get("status"), "FINISHED"),
            "performanceRating": min(10.0, impact),
            "performance_rating": min(10.0, impact),
        }

    def _infer_shots_per_90(self, position: str, goals_per_90: float, contribution_per_90: float) -> float:
        position_value = position.lower()
        baseline = 1.4
        if "forward" in position_value or "striker" in position_value:
            baseline = 3.8
        elif "midfield" in position_value:
            baseline = 2.1
        elif "defence" in position_value or "defender" in position_value:
            baseline = 0.8
        return baseline + (goals_per_90 * 2.8) + (contribution_per_90 * 0.4)

    def _infer_key_passes_per_90(self, position: str, assists_per_90: float, contribution_per_90: float) -> float:
        position_value = position.lower()
        baseline = 0.8 if "defender" in position_value else 1.5 if "forward" in position_value else 2.4
        return baseline + (assists_per_90 * 3.2) + (contribution_per_90 * 0.3)

    def _infer_passes_per_90(self, position: str, availability_rate: float) -> float:
        position_value = position.lower()
        baseline = 34.0 if "forward" in position_value else 48.0 if "midfield" in position_value else 55.0
        return baseline + (availability_rate * 0.08)

    def _build_contribution_heat(self, position: str, contribution_per_90: float, availability_rate: float) -> dict[str, float]:
        position_value = position.lower()
        final_third = 58.0 if "forward" in position_value else 42.0 if "midfield" in position_value else 26.0
        midfield = 30.0 if "forward" in position_value else 44.0 if "midfield" in position_value else 36.0
        defensive = max(10.0, 100.0 - final_third - midfield)
        load_bonus = min(12.0, availability_rate * 0.08)
        return {
            "finalThird": round(min(100.0, final_third + (contribution_per_90 * 8)), 2),
            "final_third": round(min(100.0, final_third + (contribution_per_90 * 8)), 2),
            "midfield": round(min(100.0, midfield + load_bonus), 2),
            "defensiveThird": round(max(0.0, defensive - (contribution_per_90 * 4)), 2),
            "defensive_third": round(max(0.0, defensive - (contribution_per_90 * 4)), 2),
        }

    def _build_role_profile(self, position: str, goals_per_90: float, assists_per_90: float, key_passes_per_90: float) -> dict[str, Any]:
        position_value = position.lower()
        if goals_per_90 >= 0.45:
            primary_role = "Finisher"
        elif key_passes_per_90 >= 2.8 or assists_per_90 >= 0.25:
            primary_role = "Playmaker"
        elif "defender" in position_value:
            primary_role = "Defensive Leader"
        elif "midfield" in position_value:
            primary_role = "Tempo Controller"
        else:
            primary_role = "Support Runner"
        style_tags = [position or "Unknown role"]
        if goals_per_90 >= 0.4:
            style_tags.append("Penalty-box threat")
        if assists_per_90 >= 0.2:
            style_tags.append("Chance creator")
        if "defender" in position_value:
            style_tags.append("Structure keeper")
        return {"primaryRole": primary_role, "primary_role": primary_role, "styleTags": style_tags, "style_tags": style_tags}

    def _empty_payload(self, player_id: str, provider: str) -> dict[str, Any]:
        analytics = self._build_analytics(
            position="Unknown",
            minutes_played=0,
            matches_on_pitch=0,
            starts=0,
            goals=0,
            assists=0,
            substitutions_in=0,
            substitutions_out=0,
            yellow_cards=0,
            red_cards=0,
        )
        status = {
            "provider": provider,
            "success": False,
            "latencyMs": None,
            "latency_ms": None,
            "itemCount": 0,
            "item_count": 0,
            "error": "Player intelligence currently supports football-data person ids.",
            "stale": False,
        }
        return {
            "player": normalize_player_brief(provider=provider, raw_id=player_id, name="Unsupported player id", current_team={}),
            "analytics": analytics,
            "recentMatches": [],
            "recent_matches": [],
            "providerStatus": [status],
            "provider_status": [status],
        }
