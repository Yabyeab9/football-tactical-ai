from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import httpx

from backend.core.settings import settings

from .manager_profile_service import ManagerProfileService
from .match_history_service import MatchHistoryService
from .player_analytics_service import PlayerAnalyticsService
from .tactical_engine_service import TacticalEngineService
from .team_intelligence_service import TeamIntelligenceService


class AIFootballChatService:
    def __init__(
        self,
        tactical_engine_service: TacticalEngineService | None = None,
        player_analytics_service: PlayerAnalyticsService | None = None,
        match_history_service: MatchHistoryService | None = None,
        team_intelligence_service: TeamIntelligenceService | None = None,
        manager_profile_service: ManagerProfileService | None = None,
    ) -> None:
        self.tactical_engine_service = tactical_engine_service or TacticalEngineService()
        self.player_analytics_service = player_analytics_service or PlayerAnalyticsService()
        self.match_history_service = match_history_service or MatchHistoryService()
        self.team_intelligence_service = team_intelligence_service or TeamIntelligenceService()
        self.manager_profile_service = manager_profile_service or ManagerProfileService(
            team_intelligence_service=self.team_intelligence_service,
            match_history_service=self.match_history_service,
        )

    async def answer(
        self,
        message: str,
        match_id: str | None = None,
        player_id: str | None = None,
        team_id: str | None = None,
        conversation: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        context = await self._build_context(match_id=match_id, player_id=player_id, team_id=team_id)
        if settings.openai_api_key:
            reply = await self._call_openai(message=message, context=context, conversation=conversation or [])
            engine = "openai"
        else:
            reply = self._build_local_reply(message=message, context=context)
            engine = "heuristic-manager"

        return {
            "reply": reply,
            "engine": engine,
            "contextSummary": self._context_summary(context),
            "context_summary": self._context_summary(context),
            "generatedAt": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "generated_at": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        }

    async def _build_context(self, match_id: str | None, player_id: str | None, team_id: str | None) -> dict[str, Any]:
        context: dict[str, Any] = {}
        if match_id:
            context["tactical"] = await self.tactical_engine_service.get_tactical_analysis(match_id)
            tactical_match = context["tactical"]["data"]["match"]
            team_id = team_id or tactical_match.get("homeTeamRef", {}).get("id") or tactical_match.get("home_team", {}).get("id")
        if player_id:
            context["player"] = await self.player_analytics_service.get_player_analytics(player_id)
        if team_id:
            context["team"] = await self.team_intelligence_service.get_team_details(team_id)
            context["manager"] = await self.manager_profile_service.get_manager_profile(team_id)
            context["history"] = await self.match_history_service.get_team_history(team_id)
        return context

    async def _call_openai(self, message: str, context: dict[str, Any], conversation: list[dict[str, str]]) -> str:
        prompt = (
            "You are an elite football manager analyst. Answer with tactical clarity, practical coaching language, "
            "and explain the football reasons behind each recommendation. Use only the provided context.\n\n"
            f"Structured context:\n{context}\n\n"
            f"User question:\n{message}"
        )
        input_items = [
            {"role": item.get("role", "user"), "content": [{"type": "input_text", "text": item.get("content", "")}]}
            for item in conversation[-6:]
        ]
        input_items.append({"role": "user", "content": [{"type": "input_text", "text": prompt}]})

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openai_model,
                    "input": input_items,
                    "max_output_tokens": 500,
                },
            )
            response.raise_for_status()
            payload = response.json()
        return self._extract_openai_text(payload)

    def _extract_openai_text(self, payload: dict[str, Any]) -> str:
        if payload.get("output_text"):
            return payload["output_text"]
        for output in payload.get("output", []):
            for content in output.get("content", []):
                text = content.get("text")
                if text:
                    return text
        return "The assistant could not generate a reply from the provided context."

    def _build_local_reply(self, message: str, context: dict[str, Any]) -> str:
        tactical = context.get("tactical", {}).get("data", {})
        player = context.get("player", {}).get("data", {})
        team = context.get("team", {}).get("data", {})
        manager = context.get("manager", {}).get("data", {})
        history = context.get("history", {}).get("data", {})
        _ = message

        if tactical:
            return (
                f"{tactical['prediction']} "
                f"Primary strength: {tactical['team_analysis']['strengths'][0]} "
                f"Main tactical risk: {tactical['team_analysis']['weaknesses'][0]} "
                f"I would protect rest defence, keep the key playmaker available between the lines, and attack the opponent's weaker transition side."
            )
        if player:
            analytics = player["analytics"]
            return (
                f"{player['player']['name']} profiles as a {analytics['roleProfile']['primaryRole']}. "
                f"The form index is {analytics.get('formIndex', 0)}, the performance rating is {analytics.get('performanceRating', 0)}, "
                f"and the clearest coaching question is how to preserve output without overloading minutes."
            )
        if team and manager:
            style = manager["manager"]["tacticalStyle"]
            stats = team["stats"]
            return (
                f"{manager['manager']['name']} is steering {team['team']['name']} with a {style['label'].lower()} approach. "
                f"Attack strength is {stats.get('attackStrength', 0)}, defense strength is {stats.get('defenseStrength', 0)}, "
                f"and the current tactical story is {style['summary']}"
            )
        if history:
            trends = history["trends"]
            return (
                f"The recent form string is {''.join(trends.get('form', [])) or 'mixed'}. "
                f"They are averaging {trends.get('pointsPerMatch', 0)} points per match, so the coaching focus should be margin control and better shot quality."
            )
        return "Give me a match, team, or player and I’ll respond like a football manager analyst with tactics, usage, risk, and prediction context."

    def _context_summary(self, context: dict[str, Any]) -> dict[str, Any]:
        summary: dict[str, Any] = {"modules": list(context.keys())}
        if "tactical" in context:
            match = context["tactical"]["data"]["match"]
            summary["match"] = f"{match.get('homeTeam')} vs {match.get('awayTeam')}"
        if "player" in context:
            summary["player"] = context["player"]["data"]["player"]["name"]
        if "team" in context:
            summary["team"] = context["team"]["data"]["team"]["name"]
        if "manager" in context:
            summary["manager"] = context["manager"]["data"]["manager"]["name"]
        return summary
