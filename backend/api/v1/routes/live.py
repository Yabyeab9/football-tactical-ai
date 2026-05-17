from fastapi import APIRouter
from backend.services.live_data_service import LiveDataService
from backend.services.dashboard_summary_service import DashboardSummaryService
from backend.core.responses import build_response

router = APIRouter(tags=["Live & Dashboard"])

@router.get("/live-matches")
async def get_live_matches():
    """Get current live matches"""
    try:
        service = LiveDataService()
        result = await service.get_live_matches()
        return build_response(success=True, data=result.get("data"), meta=result.get("meta"))
    except Exception as e:
        return build_response(success=False, error={"message": f"Failed to fetch live matches: {e}", "type": "LiveMatchesError"})

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from backend.services.ai_football_chat_service import AIFootballChatService

class AIChatRequest(BaseModel):
    message: str
    match_id: Optional[str] = None
    player_id: Optional[str] = None
    team_id: Optional[str] = None
    conversation: Optional[List[Dict[str, str]]] = Field(default_factory=list)

@router.post("/ai-chat")
async def ai_chat(request: AIChatRequest):
    """AI Football Analyst Chat"""
    try:
        service = AIFootballChatService()
        data = await service.answer(
            message=request.message,
            match_id=request.match_id,
            player_id=request.player_id,
            team_id=request.team_id,
            conversation=request.conversation
        )
        return build_response(success=True, data=data)
    except Exception as e:
        return build_response(success=False, error={"message": f"AI chat failed: {e}", "type": "AIChatError"})

@router.get("/dashboard-summary")
async def get_dashboard_summary():
    """Get dashboard summary data"""
    try:

        service = DashboardSummaryService()
        result = await service.get_summary()
        return build_response(success=True, data=result.get("data"), meta=result.get("meta"))
    except Exception as e:
        return build_response(success=False, error={"message": f"Failed to fetch dashboard summary: {e}", "type": "DashboardError"})
