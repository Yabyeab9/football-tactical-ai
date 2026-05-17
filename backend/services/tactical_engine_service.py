from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from backend.core.settings import settings

from .api_clients import FootballDataClient, OpenLigaDBClient, TheSportsDBClient
from .cache_layer import cache
from .data_normalizer import (
    coerce_float,
    coerce_int,
    ensure_dict,
    ensure_list,
    ensure_str,
    normalize_match_record,
    normalize_team_ref,
    split_entity_id,
)
from .match_history_service import MatchHistoryService
from .provider_manager import provider_manager
from .team_intelligence_service import TeamIntelligenceService


class TacticalEngineService:
    def __init__(
        self,
        football_data_client: FootballDataClient | None = None,
        sportsdb_client: TheSportsDBClient | None = None,
        openligadb_client: OpenLigaDBClient | None = None,
        match_history_service: MatchHistoryService | None = None,
        team_intelligence_service: TeamIntelligenceService | None = None,
    ) -> None:
        self.football_data_client = football_data_client or FootballDataClient()
        self.sportsdb_client = sportsdb_client or TheSportsDBClient()
        self.openligadb_client = openligadb_client or OpenLigaDBClient()
        self.match_history_service = match_history_service or MatchHistoryService()
        self.team_intelligence_service = team_intelligence_service or TeamIntelligenceService(
            football_data_client=self.football_data_client,
            sportsdb_client=self.sportsdb_client,
            match_history_service=self.match_history_service,
        )

    async def get_tactical_analysis(self, match_id: str) -> dict[str, Any]:
        cache_key = f"platform:tactical:{match_id}"
        cached_payload = await cache.get(cache_key)
        if cached_payload is not None:
            return cached_payload

        payload = await self.get_match_tactical_report(match_id)
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

    async def get_match_tactical_report(self, match_id: str) -> dict[str, Any]:
        provider, raw_id = split_entity_id(match_id)
        if provider == "football-data":
            return await self._build_from_football_data(raw_id)
        if provider == "thesportsdb":
            return await self._build_from_sportsdb(raw_id)
        if provider == "openligadb":
            return await self._build_from_openligadb(raw_id)
        return self._empty_report(match_id, provider, "Unsupported match provider.")

    async def _build_from_football_data(self, match_id: str) -> dict[str, Any]:
        match_payload, match_status = await provider_manager.safe_request(
            "football-data",
            lambda: self.football_data_client.get_match(match_id),
            default_factory=dict,
            expected="dict",
            request_key=f"match:football-data:{match_id}"
        )
        match_payload = ensure_dict(match_payload)
        home_team_payload = ensure_dict(match_payload.get("homeTeam"))
        away_team_payload = ensure_dict(match_payload.get("awayTeam"))
        score = ensure_dict(ensure_dict(match_payload.get("score")).get("fullTime"))

        home_history = await self.match_history_service.get_team_history(f"football-data__{home_team_payload.get('id')}")
        away_history = await self.match_history_service.get_team_history(f"football-data__{away_team_payload.get('id')}")
        home_team_details = await self.team_intelligence_service.get_team_details(f"football-data__{home_team_payload.get('id')}")
        away_team_details = await self.team_intelligence_service.get_team_details(f"football-data__{away_team_payload.get('id')}")

        normalized_match = normalize_match_record(
            provider="football-data",
            raw_id=match_payload.get("id"),
            home_team=normalize_team_ref(
                provider="football-data",
                raw_id=home_team_payload.get("id"),
                name=home_team_payload.get("name"),
                short_name=home_team_payload.get("shortName") or home_team_payload.get("tla"),
                crest=home_team_payload.get("crest"),
                provider_ids={"football-data": home_team_payload.get("id")},
            ),
            away_team=normalize_team_ref(
                provider="football-data",
                raw_id=away_team_payload.get("id"),
                name=away_team_payload.get("name"),
                short_name=away_team_payload.get("shortName") or away_team_payload.get("tla"),
                crest=away_team_payload.get("crest"),
                provider_ids={"football-data": away_team_payload.get("id")},
            ),
            status=match_payload.get("status"),
            kickoff=match_payload.get("utcDate"),
            score_home=score.get("home"),
            score_away=score.get("away"),
            venue=match_payload.get("venue"),
            competition={"name": ensure_dict(match_payload.get("competition")).get("name"), "code": ensure_dict(match_payload.get("competition")).get("code")},
            minute=match_payload.get("minute"),
            external_ids={"football-data": match_payload.get("id")},
            providers=["football-data"],
        )

        return self._assemble_report(
            normalized_match=normalized_match,
            home_history=ensure_dict(home_history.get("data")),
            away_history=ensure_dict(away_history.get("data")),
            home_team_details=ensure_dict(home_team_details.get("data")),
            away_team_details=ensure_dict(away_team_details.get("data")),
            timeline=self._build_timeline(match_payload),
            provider_status=[match_status.as_dict()]
            + ensure_list(home_history.get("data", {}).get("providerStatus"))
            + ensure_list(away_history.get("data", {}).get("providerStatus")),
        )

    async def _build_from_sportsdb(self, match_id: str) -> dict[str, Any]:
        payload, match_status = await provider_manager.safe_request(
            "thesportsdb",
            lambda: self.sportsdb_client.get_match_details(match_id),
            default_factory=dict,
            expected="dict",
            request_key=f"match:thesportsdb:{match_id}"
        )
        payload = ensure_dict(payload)
        event = ensure_dict(payload.get("event"))
        home_team_id = ensure_str(event.get("idHomeTeam"))
        away_team_id = ensure_str(event.get("idAwayTeam"))
        home_history = await self.match_history_service.get_team_history(f"thesportsdb__{home_team_id}") if home_team_id else {"data": {}}
        away_history = await self.match_history_service.get_team_history(f"thesportsdb__{away_team_id}") if away_team_id else {"data": {}}
        home_team_details = await self.team_intelligence_service.get_team_details(f"thesportsdb__{home_team_id}") if home_team_id else {"data": {}}
        away_team_details = await self.team_intelligence_service.get_team_details(f"thesportsdb__{away_team_id}") if away_team_id else {"data": {}}

        normalized_match = normalize_match_record(
            provider="thesportsdb",
            raw_id=match_id,
            home_team=normalize_team_ref(
                provider="thesportsdb",
                raw_id=event.get("idHomeTeam"),
                name=event.get("strHomeTeam"),
                short_name=event.get("strHomeTeam"),
                provider_ids={"thesportsdb": event.get("idHomeTeam")},
            ),
            away_team=normalize_team_ref(
                provider="thesportsdb",
                raw_id=event.get("idAwayTeam"),
                name=event.get("strAwayTeam"),
                short_name=event.get("strAwayTeam"),
                provider_ids={"thesportsdb": event.get("idAwayTeam")},
            ),
            status=event.get("strStatus") or "SCHEDULED",
            kickoff=event.get("strTimestamp") or event.get("dateEvent"),
            score_home=event.get("intHomeScore"),
            score_away=event.get("intAwayScore"),
            venue=event.get("strVenue"),
            competition={"name": event.get("strLeague"), "country": event.get("strCountry")},
            minute=event.get("intTime"),
            external_ids={"thesportsdb": match_id},
            providers=["thesportsdb"],
        )

        return self._assemble_report(
            normalized_match=normalized_match,
            home_history=ensure_dict(home_history.get("data")),
            away_history=ensure_dict(away_history.get("data")),
            home_team_details=ensure_dict(home_team_details.get("data")),
            away_team_details=ensure_dict(away_team_details.get("data")),
            timeline=self._build_sportsdb_timeline(payload),
            provider_status=[match_status.as_dict()]
            + ensure_list(home_history.get("data", {}).get("providerStatus"))
            + ensure_list(away_history.get("data", {}).get("providerStatus")),
        )

    async def _build_from_openligadb(self, match_id: str) -> dict[str, Any]:
        payload, match_status = await provider_manager.safe_request(
            "openligadb",
            lambda: self.openligadb_client.get_match(match_id),
            default_factory=dict,
            expected="dict",
        )
        payload = ensure_dict(payload)
        results = [ensure_dict(result) for result in ensure_list(payload.get("matchResults"))]
        latest_result = results[-1] if results else {}
        location = ensure_dict(payload.get("location"))

        normalized_match = normalize_match_record(
            provider="openligadb",
            raw_id=match_id,
            home_team=normalize_team_ref(
                provider="openligadb",
                raw_id=ensure_dict(payload.get("team1")).get("teamId"),
                name=ensure_dict(payload.get("team1")).get("teamName"),
                short_name=ensure_dict(payload.get("team1")).get("shortName") or ensure_dict(payload.get("team1")).get("teamName"),
                provider_ids={"openligadb": ensure_dict(payload.get("team1")).get("teamId")},
            ),
            away_team=normalize_team_ref(
                provider="openligadb",
                raw_id=ensure_dict(payload.get("team2")).get("teamId"),
                name=ensure_dict(payload.get("team2")).get("teamName"),
                short_name=ensure_dict(payload.get("team2")).get("shortName") or ensure_dict(payload.get("team2")).get("teamName"),
                provider_ids={"openligadb": ensure_dict(payload.get("team2")).get("teamId")},
            ),
            status="FINISHED" if payload.get("matchIsFinished") else "IN_PLAY" if payload.get("matchIsRunning") else "SCHEDULED",
            kickoff=payload.get("matchDateTimeUTC") or payload.get("matchDateTime"),
            score_home=latest_result.get("pointsTeam1"),
            score_away=latest_result.get("pointsTeam2"),
            venue=location.get("locationStadium"),
            competition={"name": payload.get("leagueName"), "code": payload.get("leagueShortcut")},
            minute=90 if payload.get("matchIsFinished") else 65 if payload.get("matchIsRunning") else 0,
            external_ids={"openligadb": match_id},
            providers=["openligadb"],
        )
        return self._assemble_report(
            normalized_match=normalized_match,
            home_history={},
            away_history={},
            home_team_details={},
            away_team_details={},
            timeline=[],
            provider_status=[match_status.as_dict()],
        )

    def _assemble_report(
        self,
        *,
        normalized_match: dict[str, Any],
        home_history: dict[str, Any],
        away_history: dict[str, Any],
        home_team_details: dict[str, Any],
        away_team_details: dict[str, Any],
        timeline: list[dict[str, Any]],
        provider_status: list[dict[str, Any]],
    ) -> dict[str, Any]:
        home_analysis = self._analyse_team_context(
            team=ensure_dict(home_team_details.get("team")) or ensure_dict(normalized_match.get("homeTeamRef")),
            trends=ensure_dict(home_history.get("trends")),
            stats=ensure_dict(home_team_details.get("stats")),
            score_for=coerce_int(ensure_dict(normalized_match.get("score")).get("home")),
            score_against=coerce_int(ensure_dict(normalized_match.get("score")).get("away")),
        )
        away_analysis = self._analyse_team_context(
            team=ensure_dict(away_team_details.get("team")) or ensure_dict(normalized_match.get("awayTeamRef")),
            trends=ensure_dict(away_history.get("trends")),
            stats=ensure_dict(away_team_details.get("stats")),
            score_for=coerce_int(ensure_dict(normalized_match.get("score")).get("away")),
            score_against=coerce_int(ensure_dict(normalized_match.get("score")).get("home")),
        )
        probabilities = self._build_probabilities(home_analysis, away_analysis, normalized_match)
        key_players = self._identify_key_roles(home_team_details, away_team_details)
        prediction_text = self._build_prediction_text(normalized_match, home_analysis, away_analysis, probabilities)

        strengths = [home_analysis["strengths"][0] if home_analysis["strengths"] else None, away_analysis["strengths"][0] if away_analysis["strengths"] else None]
        weaknesses = [home_analysis["weaknesses"][0] if home_analysis["weaknesses"] else None, away_analysis["weaknesses"][0] if away_analysis["weaknesses"] else None]
        combined_strengths = [item for item in strengths if item]
        combined_weaknesses = [item for item in weaknesses if item]

        return {
            "match": normalized_match,
            "team_analysis": home_analysis,
            "opponent_analysis": away_analysis,
            "prediction": prediction_text,
            "key_players": key_players,
            "analysis": {
                "formations": {"home": home_analysis["formation"], "away": away_analysis["formation"]},
                "metrics": {"home": home_analysis["metrics"], "away": away_analysis["metrics"]},
                "strengths": combined_strengths,
                "weaknesses": combined_weaknesses,
                "momentum": {
                    "home": home_analysis["momentum"],
                    "away": away_analysis["momentum"],
                    "label": home_analysis["teamName"] if home_analysis["momentum"] > away_analysis["momentum"] else away_analysis["teamName"],
                },
                "prediction": {
                    "homeWin": probabilities["homeWin"],
                    "home_win": probabilities["homeWin"],
                    "draw": probabilities["draw"],
                    "awayWin": probabilities["awayWin"],
                    "away_win": probabilities["awayWin"],
                    "verdict": prediction_text,
                },
            },
            "timeline": timeline,
            "context": {
                "homeForm": ensure_dict(home_history.get("trends")),
                "home_form": ensure_dict(home_history.get("trends")),
                "awayForm": ensure_dict(away_history.get("trends")),
                "away_form": ensure_dict(away_history.get("trends")),
            },
            "providerStatus": provider_status,
            "provider_status": provider_status,
        }

    def _analyse_team_context(
        self,
        *,
        team: dict[str, Any],
        trends: dict[str, Any],
        stats: dict[str, Any],
        score_for: int,
        score_against: int,
    ) -> dict[str, Any]:
        team_name = ensure_str(team.get("name"), "Unknown team")
        possession = coerce_float(stats.get("estimatedPossessionTrend"), coerce_float(trends.get("estimatedPossessionTrend"), 50.0))
        attack_strength = coerce_float(stats.get("attackStrength"), coerce_float(trends.get("attackStrength"), 0.0))
        defense_strength = coerce_float(stats.get("defenseStrength"), coerce_float(trends.get("defenseStrength"), 0.0))
        form_index = coerce_float(trends.get("formIndex"), 0.0)
        goals_for = coerce_float(stats.get("goalsFor"), coerce_float(trends.get("goalsFor"), 0.0))
        goals_against = coerce_float(stats.get("goalsAgainst"), coerce_float(trends.get("goalsAgainst"), 0.0))
        projected_shots = round(max(4.0, attack_strength * 5.1), 2)
        projected_conversion = round((goals_for / max(projected_shots * 5, 1)), 2)
        formation = self._infer_formation(possession, attack_strength, defense_strength)
        strengths = self._infer_strengths(team_name, possession, attack_strength, defense_strength, projected_conversion)
        weaknesses = self._infer_weaknesses(team_name, possession, attack_strength, defense_strength, projected_conversion, score_against)
        momentum = round((form_index * 0.46) + (possession * 0.28) + (attack_strength * 12) + ((score_for - score_against) * 8), 2)
        return {
            "teamName": team_name,
            "team_name": team_name,
            "formation": formation,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "metrics": {
                "attackStrength": round(attack_strength, 2),
                "attack_strength": round(attack_strength, 2),
                "defenseStrength": round(defense_strength, 2),
                "defense_strength": round(defense_strength, 2),
                "possessionTrend": round(possession, 2),
                "possession_trend": round(possession, 2),
                "formIndex": round(form_index, 2),
                "form_index": round(form_index, 2),
                "projectedShots": projected_shots,
                "projected_shots": projected_shots,
                "shotConversion": projected_conversion,
                "shot_conversion": projected_conversion,
            },
            "momentum": momentum,
        }

    def _infer_formation(self, possession: float, attack_strength: float, defense_strength: float) -> str:
        if possession >= 56 and attack_strength >= 1.7:
            return "4-3-3"
        if attack_strength >= 1.6 and possession < 50:
            return "4-2-3-1"
        if defense_strength >= 1.5 and possession <= 47:
            return "5-4-1"
        if possession >= 52 and defense_strength >= 1.3:
            return "4-1-4-1"
        return "4-4-2"

    def _infer_strengths(
        self,
        team_name: str,
        possession: float,
        attack_strength: float,
        defense_strength: float,
        projected_conversion: float,
    ) -> list[str]:
        strengths: list[str] = []
        if possession >= 55:
            strengths.append(f"{team_name} show possession dominance and should control long spells of territory.")
        if attack_strength >= 1.7:
            strengths.append(f"{team_name} carry enough attacking pressure to pin the opposition back line.")
        if possession < 50 and attack_strength >= 1.5:
            strengths.append(f"{team_name} are well set for counter-attacking phases when space opens.")
        if defense_strength >= 1.5:
            strengths.append(f"{team_name} are protecting central spaces well and limiting defensive exposure.")
        if projected_conversion >= 0.14:
            strengths.append(f"{team_name} convert pressure into credible shot value when they reach the box.")
        return strengths or [f"{team_name} look tactically balanced without one overwhelming edge."]

    def _infer_weaknesses(
        self,
        team_name: str,
        possession: float,
        attack_strength: float,
        defense_strength: float,
        projected_conversion: float,
        score_against: int,
    ) -> list[str]:
        weaknesses: list[str] = []
        if defense_strength < 1.0 or score_against >= 2:
            weaknesses.append(f"{team_name} show defensive gaps when runners arrive between the lines.")
        if projected_conversion < 0.11:
            weaknesses.append(f"{team_name} are generating volume more easily than quality, so shot conversion is a concern.")
        if possession < 46:
            weaknesses.append(f"{team_name} risk weak midfield control if the opponent keeps the ball for long stretches.")
        if attack_strength < 1.2:
            weaknesses.append(f"{team_name} may struggle to sustain final-third pressure without a set-piece lift.")
        return weaknesses or [f"{team_name} do not show a major tactical weakness from the current data slice."]

    def _build_probabilities(
        self,
        home_analysis: dict[str, Any],
        away_analysis: dict[str, Any],
        normalized_match: dict[str, Any],
    ) -> dict[str, int]:
        home_metrics = ensure_dict(home_analysis.get("metrics"))
        away_metrics = ensure_dict(away_analysis.get("metrics"))
        live_score = ensure_dict(normalized_match.get("score"))
        home_edge = (
            coerce_float(home_metrics.get("attackStrength")) * 18
            + coerce_float(home_metrics.get("formIndex")) * 0.42
            + coerce_float(home_metrics.get("possessionTrend")) * 0.38
            + ((coerce_int(live_score.get("home")) - coerce_int(live_score.get("away"))) * 8)
            + 6
        )
        away_edge = (
            coerce_float(away_metrics.get("attackStrength")) * 18
            + coerce_float(away_metrics.get("formIndex")) * 0.42
            + coerce_float(away_metrics.get("possessionTrend")) * 0.38
            + ((coerce_int(live_score.get("away")) - coerce_int(live_score.get("home"))) * 8)
        )
        draw_edge = 20 + max(0.0, 18 - abs(home_edge - away_edge))
        total = max(1.0, home_edge + away_edge + draw_edge)
        home_win = round((home_edge / total) * 100)
        away_win = round((away_edge / total) * 100)
        draw = max(0, 100 - home_win - away_win)
        return {"homeWin": home_win, "draw": draw, "awayWin": away_win}

    def _build_prediction_text(
        self,
        normalized_match: dict[str, Any],
        home_analysis: dict[str, Any],
        away_analysis: dict[str, Any],
        probabilities: dict[str, int],
    ) -> str:
        home_team = ensure_str(normalized_match.get("homeTeam"), "Home team")
        away_team = ensure_str(normalized_match.get("awayTeam"), "Away team")
        if probabilities["homeWin"] >= probabilities["awayWin"] + 10:
            edge = home_analysis["strengths"][0]
            risk = home_analysis["weaknesses"][0]
            return f"{home_team} project ahead because their current structure gives them the stronger territorial base. Key edge: {edge} Main risk: {risk}"
        if probabilities["awayWin"] >= probabilities["homeWin"] + 10:
            edge = away_analysis["strengths"][0]
            risk = away_analysis["weaknesses"][0]
            return f"{away_team} project ahead because their tactical profile looks more scalable across the match. Key edge: {edge} Main risk: {risk}"
        return (
            f"{home_team} and {away_team} look closely matched. The game should swing on who controls midfield rest defence "
            f"and who turns territory into higher-quality shots first."
        )

    def _identify_key_roles(self, home_team_details: dict[str, Any], away_team_details: dict[str, Any]) -> list[dict[str, Any]]:
        key_players: list[dict[str, Any]] = []
        for team_details in (home_team_details, away_team_details):
            team = ensure_dict(team_details.get("team"))
            squad = [ensure_dict(player) for player in ensure_list(team_details.get("squad"))]
            if not squad:
                continue
            playmaker = next((player for player in squad if "mid" in ensure_str(player.get("position")).lower()), squad[0])
            finisher = next((player for player in squad if "off" in ensure_str(player.get("position")).lower() or "forw" in ensure_str(player.get("position")).lower()), squad[0])
            defensive_leader = next((player for player in squad if "def" in ensure_str(player.get("position")).lower()), squad[0])
            selected = [("Playmaker", playmaker), ("Finisher", finisher), ("Defender leader", defensive_leader)]
            seen: set[str] = set()
            for role, player in selected:
                player_id = ensure_str(player.get("id"))
                if player_id in seen:
                    continue
                seen.add(player_id)
                key_players.append(
                    {
                        "playerId": player_id,
                        "player_id": player_id,
                        "name": ensure_str(player.get("name"), "Unknown player"),
                        "team": ensure_str(team.get("name"), "Unknown team"),
                        "role": role,
                        "availability": ensure_dict(player.get("availability")).get("status", "AVAILABLE"),
                    }
                )
        return key_players[:6]

    def _build_timeline(self, match_payload: dict[str, Any]) -> list[dict[str, Any]]:
        timeline: list[dict[str, Any]] = []
        for goal in ensure_list(match_payload.get("goals")):
            goal_payload = ensure_dict(goal)
            timeline.append(
                {
                    "minute": coerce_int(goal_payload.get("minute")),
                    "type": "GOAL",
                    "team": ensure_str(ensure_dict(goal_payload.get("team")).get("name")),
                    "description": f"{ensure_str(ensure_dict(goal_payload.get('scorer')).get('name'), 'Unknown scorer')} scored",
                }
            )
        for booking in ensure_list(match_payload.get("bookings")):
            booking_payload = ensure_dict(booking)
            timeline.append(
                {
                    "minute": coerce_int(booking_payload.get("minute")),
                    "type": "BOOKING",
                    "team": ensure_str(ensure_dict(booking_payload.get("team")).get("name")),
                    "description": f"{ensure_str(ensure_dict(booking_payload.get('player')).get('name'), 'Unknown player')} received a card",
                }
            )
        for substitution in ensure_list(match_payload.get("substitutions")):
            substitution_payload = ensure_dict(substitution)
            timeline.append(
                {
                    "minute": coerce_int(substitution_payload.get("minute")),
                    "type": "SUBSTITUTION",
                    "team": ensure_str(ensure_dict(substitution_payload.get("team")).get("name")),
                    "description": (
                        f"{ensure_str(ensure_dict(substitution_payload.get('playerOut')).get('name'), 'Unknown player')} off, "
                        f"{ensure_str(ensure_dict(substitution_payload.get('playerIn')).get('name'), 'Unknown player')} on"
                    ),
                }
            )
        return sorted(timeline, key=lambda item: item.get("minute", 0))

    def _build_sportsdb_timeline(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        timeline: list[dict[str, Any]] = []
        for item in ensure_list(payload.get("timeline")):
            item_payload = ensure_dict(item)
            timeline.append(
                {
                    "minute": coerce_int(item_payload.get("intTime") or item_payload.get("strTime")),
                    "type": ensure_str(item_payload.get("strEvent"), "EVENT").upper(),
                    "team": ensure_str(item_payload.get("strTeam")),
                    "description": ensure_str(item_payload.get("strTimeline"), "Live event"),
                }
            )
        return sorted(timeline, key=lambda item: item.get("minute", 0))

    def _empty_report(self, match_id: str, provider: str, message: str) -> dict[str, Any]:
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
            "match": {"id": match_id, "homeTeam": "Home", "awayTeam": "Away", "status": "UNKNOWN", "kickoff": None, "score": {"home": 0, "away": 0}, "venue": None, "source": provider},
            "team_analysis": {"teamName": "Home", "formation": "4-4-2", "strengths": [], "weaknesses": [], "metrics": {}, "momentum": 0},
            "opponent_analysis": {"teamName": "Away", "formation": "4-4-2", "strengths": [], "weaknesses": [], "metrics": {}, "momentum": 0},
            "prediction": "Tactical data is not available for this match yet.",
            "key_players": [],
            "analysis": {
                "formations": {"home": "4-4-2", "away": "4-4-2"},
                "metrics": {"home": {}, "away": {}},
                "strengths": [],
                "weaknesses": [],
                "prediction": {"homeWin": 34, "home_win": 34, "draw": 33, "awayWin": 33, "away_win": 33, "verdict": "Tactical data is not available for this match yet."},
            },
            "timeline": [],
            "context": {},
            "providerStatus": [status],
            "provider_status": [status],
        }
