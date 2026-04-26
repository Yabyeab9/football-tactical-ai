from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from backend.core.settings import settings

from .api_clients import FootballDataClient, OpenLigaDBClient, TheSportsDBClient, normalize_name
from .cache_layer import cache
from .data_normalizer import ensure_dict, ensure_list
from .provider_manager import ProviderStatus, provider_manager


class LiveDataService:
    provider_priority = ("football-data", "thesportsdb", "openligadb")

    def __init__(
        self,
        football_data_client: FootballDataClient | None = None,
        sportsdb_client: TheSportsDBClient | None = None,
        openligadb_client: OpenLigaDBClient | None = None,
    ) -> None:
        self.football_data_client = football_data_client or FootballDataClient()
        self.sportsdb_client = sportsdb_client or TheSportsDBClient()
        self.openligadb_client = openligadb_client or OpenLigaDBClient()

    async def get_live_matches(self) -> dict[str, Any]:
        cache_key = "platform:live-matches"
        cached_payload = await cache.get(cache_key)
        if cached_payload is not None:
            return cached_payload

        provider_results = await asyncio.gather(
            provider_manager.safe_request("football-data", self.football_data_client.get_matches, default_factory=list, expected="list"),
            provider_manager.safe_request("thesportsdb", self.sportsdb_client.get_live_matches, default_factory=list, expected="list"),
            provider_manager.safe_request("openligadb", self.openligadb_client.get_current_matches, default_factory=list, expected="list"),
        )

        all_matches: list[dict[str, Any]] = []
        provider_status: list[dict[str, Any]] = []
        for payload, status in provider_results:
            provider_status.append(status.as_dict())
            all_matches.extend([ensure_dict(match) for match in ensure_list(payload)])

        if not all_matches:
            stale_payload = await cache.get(cache_key, allow_stale=True)
            if stale_payload is not None:
                stale_payload["meta"]["stale"] = True
                stale_payload["meta"]["staleData"] = True
                for status in stale_payload["data"].get("providerStatus", []):
                    status["stale"] = True
                return stale_payload

        merged_matches = self._merge_matches(all_matches)
        payload = {
            "matches": merged_matches,
            "summary": {
                "totalMatches": len(merged_matches),
                "total_matches": len(merged_matches),
                "liveMatches": sum(1 for match in merged_matches if self._is_live_status(match.get("status"))),
                "live_matches": sum(1 for match in merged_matches if self._is_live_status(match.get("status"))),
                "trackedCompetitions": len({ensure_dict(match.get("competition")).get("name") for match in merged_matches if ensure_dict(match.get("competition")).get("name")}),
                "tracked_competitions": len({ensure_dict(match.get("competition")).get("name") for match in merged_matches if ensure_dict(match.get("competition")).get("name")}),
            },
            "providerStatus": provider_status,
            "provider_status": provider_status,
        }
        wrapped = {
            "data": payload,
            "meta": {
                "generatedAt": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                "generated_at": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                "schemaVersion": settings.api_schema_version,
                "schema_version": settings.api_schema_version,
                "stale": False,
            },
        }
        await cache.set(cache_key, wrapped, ttl=settings.live_cache_ttl_seconds)
        return wrapped

    def _merge_matches(self, matches: list[dict[str, Any]]) -> list[dict[str, Any]]:
        merged: dict[str, dict[str, Any]] = {}
        for match in matches:
            key = self._build_match_key(match)
            existing = merged.get(key)
            if existing is None:
                merged[key] = {
                    **match,
                    "providers": list(match.get("providers", [])),
                    "externalIds": dict(match.get("externalIds", {})),
                    "external_ids": dict(match.get("external_ids", {})),
                    "homeTeamRef": {
                        **ensure_dict(match.get("homeTeamRef")),
                        "providerIds": dict(ensure_dict(ensure_dict(match.get("homeTeamRef")).get("providerIds")) or ensure_dict(ensure_dict(match.get("homeTeamRef")).get("provider_ids"))),
                        "provider_ids": dict(ensure_dict(ensure_dict(match.get("homeTeamRef")).get("provider_ids")) or ensure_dict(ensure_dict(match.get("homeTeamRef")).get("providerIds"))),
                    },
                    "awayTeamRef": {
                        **ensure_dict(match.get("awayTeamRef")),
                        "providerIds": dict(ensure_dict(ensure_dict(match.get("awayTeamRef")).get("providerIds")) or ensure_dict(ensure_dict(match.get("awayTeamRef")).get("provider_ids"))),
                        "provider_ids": dict(ensure_dict(ensure_dict(match.get("awayTeamRef")).get("provider_ids")) or ensure_dict(ensure_dict(match.get("awayTeamRef")).get("providerIds"))),
                    },
                }
                merged[key]["home_team"] = merged[key]["homeTeamRef"]
                merged[key]["away_team"] = merged[key]["awayTeamRef"]
                continue

            existing["providers"] = sorted(set(existing.get("providers", [])) | set(match.get("providers", [])))
            existing_external_ids = ensure_dict(existing.get("externalIds")) or ensure_dict(existing.get("external_ids"))
            existing_external_ids.update(ensure_dict(match.get("externalIds")) or ensure_dict(match.get("external_ids")))
            existing["externalIds"] = existing_external_ids
            existing["external_ids"] = existing_external_ids

            for team_key in ("homeTeamRef", "awayTeamRef"):
                existing_team = ensure_dict(existing.get(team_key))
                candidate_team = ensure_dict(match.get(team_key))
                provider_ids = ensure_dict(existing_team.get("providerIds")) or ensure_dict(existing_team.get("provider_ids"))
                provider_ids.update(ensure_dict(candidate_team.get("providerIds")) or ensure_dict(candidate_team.get("provider_ids")))
                existing_team.update({key: value for key, value in candidate_team.items() if value not in (None, "")})
                existing_team["providerIds"] = provider_ids
                existing_team["provider_ids"] = provider_ids
                existing[team_key] = existing_team

            existing["competition"] = self._choose_better_dict(existing.get("competition"), match.get("competition"))
            existing["status"] = self._choose_status(existing.get("status"), match.get("status"))
            existing["minute"] = max(int(existing.get("minute") or 0), int(match.get("minute") or 0))
            existing_score = ensure_dict(existing.get("score"))
            candidate_score = ensure_dict(match.get("score"))
            existing["score"] = {
                "home": max(int(existing_score.get("home") or 0), int(candidate_score.get("home") or 0)),
                "away": max(int(existing_score.get("away") or 0), int(candidate_score.get("away") or 0)),
            }
            existing["kickoff"] = existing.get("kickoff") or match.get("kickoff")
            existing["scheduledAt"] = existing.get("scheduledAt") or match.get("scheduledAt")
            existing["scheduled_at"] = existing.get("scheduled_at") or match.get("scheduled_at")
            existing["venue"] = existing.get("venue") or match.get("venue")

            preferred_id = self._preferred_provider_id(existing_external_ids)
            existing["id"] = preferred_id
            existing["source"] = preferred_id.split("__", 1)[0]
            existing["homeTeamRef"]["id"] = self._preferred_provider_id(
                ensure_dict(existing["homeTeamRef"].get("providerIds")) or ensure_dict(existing["homeTeamRef"].get("provider_ids"))
            )
            existing["awayTeamRef"]["id"] = self._preferred_provider_id(
                ensure_dict(existing["awayTeamRef"].get("providerIds")) or ensure_dict(existing["awayTeamRef"].get("provider_ids"))
            )
            existing["home_team"] = existing["homeTeamRef"]
            existing["away_team"] = existing["awayTeamRef"]
            existing["homeTeam"] = existing["homeTeamRef"].get("name")
            existing["awayTeam"] = existing["awayTeamRef"].get("name")

        return sorted(merged.values(), key=self._sort_key)

    def _build_match_key(self, match: dict[str, Any]) -> str:
        kickoff = match.get("kickoff") or match.get("scheduledAt") or match.get("scheduled_at") or ""
        rounded_time = kickoff
        if kickoff:
            try:
                parsed = datetime.fromisoformat(str(kickoff).replace("Z", "+00:00"))
                rounded = parsed.replace(minute=(parsed.minute // 30) * 30, second=0, microsecond=0)
                rounded_time = rounded.isoformat()
            except ValueError:
                rounded_time = str(kickoff)
        return f"{rounded_time}:{normalize_name(match.get('homeTeam'))}:{normalize_name(match.get('awayTeam'))}"

    def _preferred_provider_id(self, provider_map: dict[str, Any]) -> str:
        for provider in self.provider_priority:
            if provider_map.get(provider):
                return f"{provider}__{provider_map[provider]}"
        first_provider = next(iter(provider_map.keys()), "unknown")
        return f"{first_provider}__{provider_map.get(first_provider, 'unknown')}"

    def _choose_better_dict(self, current: Any, candidate: Any) -> dict[str, Any]:
        current_dict = ensure_dict(current)
        candidate_dict = ensure_dict(candidate)
        score_current = sum(1 for value in current_dict.values() if value)
        score_candidate = sum(1 for value in candidate_dict.values() if value)
        return candidate_dict if score_candidate > score_current else current_dict

    def _choose_status(self, current: Any, candidate: Any) -> str:
        rank = {"IN_PLAY": 5, "LIVE": 5, "PAUSED": 4, "HALF_TIME": 4, "TIMED": 3, "SCHEDULED": 3, "FINISHED": 2}
        current_value = str(current or "SCHEDULED").upper()
        candidate_value = str(candidate or "SCHEDULED").upper()
        return candidate_value if rank.get(candidate_value, 1) >= rank.get(current_value, 1) else current_value

    def _is_live_status(self, status: Any) -> bool:
        return str(status or "").upper() in {"LIVE", "IN_PLAY", "PAUSED", "HALF_TIME"}

    def _sort_key(self, match: dict[str, Any]) -> tuple[int, str]:
        status = str(match.get("status") or "")
        status_bucket = 0 if self._is_live_status(status) else 1 if status in {"TIMED", "SCHEDULED"} else 2
        return (status_bucket, str(match.get("kickoff") or ""))
