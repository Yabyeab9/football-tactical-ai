from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from backend.core.settings import settings

from .cache_layer import cache
from .data_normalizer import coerce_float, ensure_dict, ensure_list, ensure_str
from .match_history_service import MatchHistoryService
from .team_intelligence_service import TeamIntelligenceService


class ManagerProfileService:
    def __init__(
        self,
        team_intelligence_service: TeamIntelligenceService | None = None,
        match_history_service: MatchHistoryService | None = None,
    ) -> None:
        self.team_intelligence_service = team_intelligence_service or TeamIntelligenceService()
        self.match_history_service = match_history_service or MatchHistoryService()

    async def get_manager_profile(self, team_id: str) -> dict[str, Any]:
        cache_key = f"platform:manager:{team_id}"
        cached_payload = await cache.get(cache_key)
        if cached_payload is not None:
            return cached_payload

        team_details = await self.team_intelligence_service.get_team_details(team_id)
        history_payload = await self.match_history_service.get_team_history(team_id)
        team_data = ensure_dict(team_details.get("data"))
        history_data = ensure_dict(history_payload.get("data"))
        team = ensure_dict(team_data.get("team"))
        stats = ensure_dict(team_data.get("stats"))
        manager = ensure_dict(team.get("manager"))
        tactical_style = self._infer_tactical_style(stats, history_data)
        record = {
            "matches": sum(stats.get(key, 0) for key in ("wins", "draws", "losses")),
            "wins": stats.get("wins", 0),
            "draws": stats.get("draws", 0),
            "losses": stats.get("losses", 0),
            "pointsPerMatch": stats.get("pointsPerMatch", 0.0),
            "points_per_match": stats.get("pointsPerMatch", 0.0),
        }
        payload = {
            "manager": {
                "id": ensure_str(manager.get("id")) or f"manager__{team_id}",
                "name": ensure_str(manager.get("name"), "Unknown coach"),
                "nationality": ensure_str(manager.get("nationality")) or None,
                "dateOfBirth": ensure_str(manager.get("dateOfBirth")) or None,
                "date_of_birth": ensure_str(manager.get("dateOfBirth")) or None,
                "team": {
                    "id": team.get("id"),
                    "name": team.get("name"),
                    "crest": team.get("crest") or team.get("logo"),
                },
                "tacticalStyle": tactical_style,
                "tactical_style": tactical_style,
            },
            "record": record,
            "teamHistory": ensure_list(history_data.get("matches"))[:5],
            "team_history": ensure_list(history_data.get("matches"))[:5],
            "providerStatus": ensure_list(team_data.get("providerStatus")) + ensure_list(history_data.get("providerStatus")),
            "provider_status": ensure_list(team_data.get("providerStatus")) + ensure_list(history_data.get("providerStatus")),
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

    def _infer_tactical_style(self, stats: dict[str, Any], history_data: dict[str, Any]) -> dict[str, Any]:
        attack_strength = coerce_float(stats.get("attackStrength"))
        defense_strength = coerce_float(stats.get("defenseStrength"))
        possession = coerce_float(stats.get("estimatedPossessionTrend"), 50.0)
        form = "".join(ensure_list(ensure_dict(history_data.get("trends")).get("form")))

        if possession >= 56 and attack_strength >= 1.7:
            label = "Positional control"
            summary = "Build-up is tilted toward territorial control, patient circulation, and sustained pressure in the final third."
            traits = ["High possession", "Structured rest defence", "Patient overload creation"]
        elif attack_strength >= 1.8 and possession < 50:
            label = "Vertical transition"
            summary = "The coach appears to prioritise direct progression, fast outlets, and exploiting space behind the opposition block."
            traits = ["Counter-attacking", "Fast channel access", "Transition focus"]
        elif defense_strength >= 1.6:
            label = "Compact control"
            summary = "The team profile points to a coach who values spacing, line protection, and controlled risk without overextending."
            traits = ["Mid-block discipline", "Compact distances", "Game-state management"]
        else:
            label = "Adaptive balance"
            summary = "The tactical style looks flexible rather than extreme, adjusting tempo and pressing depending on the opponent and scoreline."
            traits = ["Flexible shape", "Balanced risk", "Situation-led decisions"]

        if form.startswith("WW"):
            traits.append("Strong current momentum")
        elif "LL" in form:
            traits.append("Needs form reset")

        return {"label": label, "summary": summary, "traits": traits}
