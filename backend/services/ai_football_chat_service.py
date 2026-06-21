from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import httpx
import logging
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
        system_prompt = (
            "You are an elite football tactical analyst and performance director. "
            "Your tone is professional, high-signal, and grounded in tactical principles. "
            "Use terms like 'rest-defense', 'half-spaces', 'low-block', 'counter-press', and 'transition-risk'. "
            "Analyze the provided context and answer the user's question with precise coaching insights."
        )
        
        messages = [{"role": "system", "content": system_prompt}]
        for item in conversation[-6:]:
            messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})
        
        prompt = f"Context:\n{context}\n\nQuestion: {message}"
        messages.append({"role": "user", "content": prompt})

        logger = logging.getLogger(__name__)

        async with httpx.AsyncClient(timeout=30) as client:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.openai_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.openai_model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 800,
                    },
                )

                payload = response.json()

                if response.status_code != 200:
                    logger.error(f"OpenAI API error ({response.status_code}): {payload}")
                    return "Intelligence link interrupted. Falling back to local heuristic modeling."

                return payload["choices"][0]["message"]["content"]

            except Exception as e:
                logger.error(f"OpenAI request failed: {str(e)}")
                return "Intelligence link timeout. Tactical fallback active."

    def _build_local_reply(self, message: str, context: dict[str, Any]) -> str:
        tactical = context.get("tactical", {}).get("data", {})
        player = context.get("player", {}).get("data", {})
        team = context.get("team", {}).get("data", {})
        manager = context.get("manager", {}).get("data", {})
        history = context.get("history", {}).get("data", {})
        _ = message

        if tactical:
            return (
                f"Tactical Inference: {tactical['prediction']}. "
                f"We detect a strength in {tactical['analysis']['strengths'][0]} but a critical risk in {tactical['analysis']['weaknesses'][0]}. "
                "Recommendation: Protect the central transition corridor and maintain a compact rest-defense structure. "
                "Exploit the opponent's tendency for slow recovery in the half-spaces."
            )
        if player:
            analytics = player["analytics"]
            return (
                f"Performance Profile: {player['player']['name']} is operating as a {analytics['roleProfile']['primaryRole']}. "
                f"Output Density: {analytics.get('goalContributionsPer90', 0)} G+A/90. "
                f"Operational Status: Availability rate at {analytics.get('availabilityRate', 0)}%. "
                "Coaching Note: Sustain current output by managing minutes in high-congestion windows."
            )
        if team and manager:
            style = manager["manager"]["tacticalStyle"]
            return (
                f"Strategic Overview: {manager['manager']['name']} is implementing a {style['label'].lower()} model at {team['team']['name']}. "
                f"Narrative: {style['summary']} "
                f"Tactical Traits: {', '.join(style['traits'])}. "
                "Systemic Outlook: Team is currently optimized for structural control but remains vulnerable to direct vertical threats."
            )
        return "Tactical Assistant ready. Specify a match, player, or team to receive a deep intelligence briefing."

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
