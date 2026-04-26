from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

try:
    from .core.settings import settings
    from .services.ai_football_chat_service import AIFootballChatService
    from .services.dashboard_summary_service import DashboardSummaryService
    from .services.injury_analysis_service import InjuryAnalysisService
    from .services.live_data_service import LiveDataService
    from .services.manager_profile_service import ManagerProfileService
    from .services.match_history_service import MatchHistoryService
    from .services.player_analytics_service import PlayerAnalyticsService
    from .services.tactical_engine_service import TacticalEngineService
    from .services.team_intelligence_service import TeamIntelligenceService
except ImportError:
    from backend.core.settings import settings
    from backend.services.ai_football_chat_service import AIFootballChatService
    from backend.services.dashboard_summary_service import DashboardSummaryService
    from backend.services.injury_analysis_service import InjuryAnalysisService
    from backend.services.live_data_service import LiveDataService
    from backend.services.manager_profile_service import ManagerProfileService
    from backend.services.match_history_service import MatchHistoryService
    from backend.services.player_analytics_service import PlayerAnalyticsService
    from backend.services.tactical_engine_service import TacticalEngineService
    from backend.services.team_intelligence_service import TeamIntelligenceService


def configure_logging() -> None:
    logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")


def success_response(data: Any, message: str, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    base_meta = {"schemaVersion": settings.api_schema_version, "schema_version": settings.api_schema_version}
    if meta:
        base_meta.update(meta)
    return {"success": True, "message": message, "data": data, "meta": base_meta}


def error_response(message: str, *, details: Any = None, status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "data": {},
            "meta": {
                "schemaVersion": settings.api_schema_version,
                "schema_version": settings.api_schema_version,
                "details": details,
            },
        },
    )


class ChatMessage(BaseModel):
    role: str
    content: str


class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    match_id: str | None = None
    player_id: str | None = None
    team_id: str | None = None
    conversation: list[ChatMessage] = Field(default_factory=list)


configure_logging()
app = FastAPI(title=settings.app_name, version=settings.api_schema_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins) or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

live_data_service = LiveDataService()
match_history_service = MatchHistoryService()
player_analytics_service = PlayerAnalyticsService()
injury_analysis_service = InjuryAnalysisService(live_data_service=live_data_service)
team_intelligence_service = TeamIntelligenceService(
    match_history_service=match_history_service,
    injury_analysis_service=injury_analysis_service,
)
manager_profile_service = ManagerProfileService(
    team_intelligence_service=team_intelligence_service,
    match_history_service=match_history_service,
)
tactical_engine_service = TacticalEngineService(
    match_history_service=match_history_service,
    team_intelligence_service=team_intelligence_service,
)
dashboard_summary_service = DashboardSummaryService(
    live_data_service=live_data_service,
    tactical_engine_service=tactical_engine_service,
    injury_analysis_service=injury_analysis_service,
    player_analytics_service=player_analytics_service,
    team_intelligence_service=team_intelligence_service,
    manager_profile_service=manager_profile_service,
)
ai_chat_service = AIFootballChatService(
    tactical_engine_service=tactical_engine_service,
    player_analytics_service=player_analytics_service,
    match_history_service=match_history_service,
    team_intelligence_service=team_intelligence_service,
    manager_profile_service=manager_profile_service,
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Any, exc: HTTPException) -> JSONResponse:
    return error_response(exc.detail, details={"statusCode": exc.status_code}, status_code=200)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Any, exc: RequestValidationError) -> JSONResponse:
    return error_response("Validation error", details=exc.errors(), status_code=200)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Any, exc: Exception) -> JSONResponse:
    logging.getLogger(__name__).exception("Recovered unhandled application error", exc_info=exc)
    return error_response("Recovered from an internal application error.", details=str(exc), status_code=200)


@app.get("/api/live-matches")
async def get_live_matches() -> dict[str, Any]:
    payload = await live_data_service.get_live_matches()
    return success_response(payload["data"], "Live match feed aggregated", payload["meta"])


@app.get("/api/match-history/{team_id}")
async def get_match_history(team_id: str) -> dict[str, Any]:
    payload = await match_history_service.get_team_history(team_id)
    return success_response(payload["data"], "Historical match intelligence loaded", payload["meta"])


@app.get("/api/team-stats/{team_id}")
async def get_team_stats(team_id: str) -> dict[str, Any]:
    payload = await match_history_service.get_team_history(team_id)
    return success_response(payload["data"], "Team trend intelligence loaded", payload["meta"])


@app.get("/api/teams/{team_id}")
async def get_team(team_id: str) -> dict[str, Any]:
    payload = await team_intelligence_service.get_team_details(team_id)
    return success_response(payload["data"], "Team intelligence loaded", payload["meta"])


@app.get("/api/teams/{team_id}/squad")
async def get_team_squad(team_id: str) -> dict[str, Any]:
    payload = await team_intelligence_service.get_team_squad(team_id)
    return success_response(payload["data"], "Team squad intelligence loaded", payload["meta"])


@app.get("/api/player/{player_id}")
async def get_player(player_id: str) -> dict[str, Any]:
    payload = await player_analytics_service.get_player_analytics(player_id)
    return success_response(payload["data"], "Player intelligence loaded", payload["meta"])


@app.get("/api/players/{player_id}")
async def get_player_plural(player_id: str) -> dict[str, Any]:
    payload = await player_analytics_service.get_player_analytics(player_id)
    return success_response(payload["data"], "Player intelligence loaded", payload["meta"])


@app.get("/api/player-stats/{player_id}")
async def get_player_stats_alias(player_id: str) -> dict[str, Any]:
    payload = await player_analytics_service.get_player_analytics(player_id)
    return success_response(payload["data"], "Player intelligence loaded", payload["meta"])


@app.get("/api/player-analysis/{player_id}")
async def get_player_analysis_alias(player_id: str) -> dict[str, Any]:
    payload = await player_analytics_service.get_player_analytics(player_id)
    return success_response(payload["data"], "Player intelligence loaded", payload["meta"])


@app.get("/api/managers/{team_id}")
async def get_manager(team_id: str) -> dict[str, Any]:
    payload = await manager_profile_service.get_manager_profile(team_id)
    return success_response(payload["data"], "Manager intelligence loaded", payload["meta"])


@app.get("/api/injuries")
async def get_injuries(
    team_id: str | None = Query(default=None),
    match_id: str | None = Query(default=None),
) -> dict[str, Any]:
    payload = await injury_analysis_service.get_injury_watch(team_id=team_id, match_id=match_id)
    return success_response(payload["data"], "Injury watch analysis loaded", payload["meta"])


@app.get("/api/tactical-analysis/{match_id}")
async def get_tactical_analysis(match_id: str) -> dict[str, Any]:
    payload = await tactical_engine_service.get_tactical_analysis(match_id)
    return success_response(payload["data"], "Tactical analysis loaded", payload["meta"])


@app.get("/api/match/{match_id}/analysis")
async def get_match_analysis(match_id: str) -> dict[str, Any]:
    payload = await tactical_engine_service.get_tactical_analysis(match_id)
    return success_response(payload["data"], "Match tactical report loaded", payload["meta"])


@app.get("/api/match-details/{match_id}")
async def get_match_details_alias(match_id: str) -> dict[str, Any]:
    payload = await tactical_engine_service.get_tactical_analysis(match_id)
    return success_response(payload["data"], "Tactical analysis loaded", payload["meta"])


@app.post("/api/ai-chat")
async def ai_chat(request: AIChatRequest) -> dict[str, Any]:
    payload = await ai_chat_service.answer(
        message=request.message,
        match_id=request.match_id,
        player_id=request.player_id,
        team_id=request.team_id,
        conversation=[message.model_dump() for message in request.conversation],
    )
    return success_response(payload, "AI football analyst response generated")


@app.get("/api/dashboard-summary")
async def get_dashboard_summary() -> dict[str, Any]:
    payload = await dashboard_summary_service.get_summary()
    return success_response(payload["data"], "Dashboard summary loaded", payload["meta"])


@app.get("/health")
async def healthcheck() -> dict[str, Any]:
    return {"status": "ok", "schemaVersion": settings.api_schema_version}
