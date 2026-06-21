from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from backend.core.settings import settings

from .provider_service import provider_service
from .cache_layer import cache
from .data_normalizer import ensure_dict, ensure_list, normalize_name
from .provider_manager import ProviderStatus, provider_manager
from .match_priority_service import match_priority_service


class LiveDataService:
    provider_priority = ("api-football", "football-data", "thesportsdb", "openligadb")

    def __init__(self) -> None:
        pass

    async def get_live_matches(self) -> dict[str, Any]:
        cache_key = "platform:live-matches"
        cached_payload = await cache.get(cache_key)
        if cached_payload is not None:
            return cached_payload

        all_matches, statuses = await provider_service.get_live_matches_tiered()
        provider_status = [status.as_dict() for status in statuses]

        if not all_matches:
            stale_payload = await cache.get(cache_key, allow_stale=True)
            if stale_payload is not None:
                stale_payload["meta"]["stale"] = True
                stale_payload["meta"]["staleData"] = True
                for status in stale_payload["data"].get("providerStatus", []):
                    status["stale"] = True
                return stale_payload

        merged_matches = self._merge_matches(all_matches)
        filtered_matches = self._filter_and_prioritize_matches(merged_matches)
        sorted_matches = match_priority_service.sort_matches(filtered_matches)
        
        payload = {
            "matches": sorted_matches,
            "summary": {
                "totalMatches": len(sorted_matches),
                "liveMatches": sum(1 for match in sorted_matches if self._is_live_status(match.get("status"))),
                "trackedCompetitions": len({ensure_dict(match.get("competition")).get("name") for match in sorted_matches if ensure_dict(match.get("competition")).get("name")}),
            },
            "providerStatus": provider_status,
        }
        wrapped = {
            "data": payload,
            "meta": {
                "generatedAt": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                "schemaVersion": settings.api_schema_version,
                "stale": False,
            },
        }
        await cache.set(cache_key, wrapped, ttl=settings.live_cache_ttl_seconds)
        return wrapped

    def _filter_and_prioritize_matches(self, matches: list[dict[str, Any]]) -> list[dict[str, Any]]:
        now = datetime.now(UTC)
        
        live_matches: list[dict[str, Any]] = []
        upcoming_matches: list[dict[str, Any]] = []
        recent_matches: list[dict[str, Any]] = []
        
        for match in matches:
            status = str(match.get("status") or "").upper()
            kickoff_str = match.get("kickoff") or match.get("scheduledAt") or match.get("scheduled_at")
            
            try:
                kickoff = datetime.fromisoformat(str(kickoff_str).replace("Z", "+00:00"))
            except (ValueError, TypeError):
                continue

            # 1. LIVE matches
            if self._is_live_status(status):
                live_matches.append(match)
                continue
                
            # 2. Upcoming matches (next 72 hours)
            if kickoff > now:
                if (kickoff - now).total_seconds() <= 72 * 3600:
                    upcoming_matches.append(match)
                continue
                
            # 3. Recently completed matches (last 48 hours)
            if status == "FINISHED" or kickoff <= now:
                if (now - kickoff).total_seconds() <= 48 * 3600:
                    recent_matches.append(match)

        # Priority return
        if live_matches:
            return live_matches
            
        if upcoming_matches:
            # Sort upcoming by kickoff time (soonest first)
            upcoming_matches.sort(key=lambda x: x.get("kickoff", ""))
            return upcoming_matches[:12] # Limit to 12 matches if no live
            
        if recent_matches:
            # Sort recent by kickoff time (most recent first)
            recent_matches.sort(key=lambda x: x.get("kickoff", ""), reverse=True)
            return recent_matches[:8] # Limit to 8 recent matches
            
        return []

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
                    "homeTeamRef": {
                        **ensure_dict(match.get("homeTeamRef")),
                        "providerIds": dict(ensure_dict(ensure_dict(match.get("homeTeamRef")).get("providerIds"))),
                    },
                    "awayTeamRef": {
                        **ensure_dict(match.get("awayTeamRef")),
                        "providerIds": dict(ensure_dict(ensure_dict(match.get("awayTeamRef")).get("providerIds"))),
                    },
                }
                continue

            existing["providers"] = sorted(set(existing.get("providers", [])) | set(match.get("providers", [])))
            existing_external_ids = ensure_dict(existing.get("externalIds"))
            existing_external_ids.update(ensure_dict(match.get("externalIds")))
            existing["externalIds"] = existing_external_ids

            for team_key in ("homeTeamRef", "awayTeamRef"):
                existing_team = ensure_dict(existing.get(team_key))
                candidate_team = ensure_dict(match.get(team_key))
                provider_ids = ensure_dict(existing_team.get("providerIds"))
                provider_ids.update(ensure_dict(candidate_team.get("providerIds")))
                existing_team.update({key: value for key, value in candidate_team.items() if value not in (None, "")})
                existing_team["providerIds"] = provider_ids
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
            existing["venue"] = existing.get("venue") or match.get("venue")

            preferred_id = self._preferred_provider_id(existing_external_ids)
            existing["id"] = preferred_id
            existing["source"] = preferred_id.split("__", 1)[0]
            existing["homeTeamRef"]["id"] = self._preferred_provider_id(
                ensure_dict(existing["homeTeamRef"].get("providerIds"))
            )
            existing["awayTeamRef"]["id"] = self._preferred_provider_id(
                ensure_dict(existing["awayTeamRef"].get("providerIds"))
            )
            existing["homeTeam"] = existing["homeTeamRef"].get("name")
            existing["awayTeam"] = existing["awayTeamRef"].get("name")

        return list(merged.values())

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
