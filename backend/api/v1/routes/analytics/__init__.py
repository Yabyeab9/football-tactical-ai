from __future__ import annotations

from typing import List, Any
from fastapi import APIRouter, Depends, Query

from backend.core.responses import build_response
from backend.services.analytics.service import AnalyticsService
from backend.services.data_ingestion.service import DataIngestionService


router = APIRouter()

def get_analytics_service() -> AnalyticsService:
    data_service = DataIngestionService()
    return AnalyticsService(data_service)


@router.get("/pitch-control")
async def get_pitch_control(
    match_id: str = Query(..., description="Match ID"),
    frame_index: int = Query(0, description="Frame index"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    try:
        result = await service.calculate_pitch_control(match_id, frame_index)
        return build_response(success=True, data=result.get("data"), meta=result.get("meta"))
    except Exception as e:
        return build_response(success=False, error={"message": str(e), "type": "AnalyticsError"})


@router.get("/threat-flow")
async def get_threat_flow(
    match_id: str = Query(..., description="Match ID"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    try:
        result = await service.calculate_threat_flow(match_id)
        return build_response(success=True, data=result.get("data"), meta=result.get("meta"))
    except Exception as e:
        return build_response(success=False, error={"message": str(e), "type": "AnalyticsError"})


@router.get("/pass-networks")
async def get_pass_network(
    match_id: str = Query(..., description="Match ID"),
    team_id: str = Query(..., description="Team ID"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    try:
        result = await service.calculate_pass_network(match_id, team_id)
        return build_response(success=True, data=result.get("data"), meta=result.get("meta"))
    except Exception as e:
        return build_response(success=False, error={"message": str(e), "type": "AnalyticsError"})


@router.get("/pressing-efficiency")
async def get_pressing_efficiency(
    match_id: str = Query(..., description="Match ID"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    try:
        result = await service.calculate_pressing_efficiency(match_id)
        return build_response(success=True, data=result.get("data"), meta=result.get("meta"))
    except Exception as e:
        return build_response(success=False, error={"message": str(e), "type": "AnalyticsError"})


@router.get("/prediction/live")
async def get_live_prediction(
    match_id: str = Query(..., description="Match ID"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    try:
        result = await service.predict_live(match_id)
        return build_response(success=True, data=result.get("data"), meta=result.get("meta"))
    except Exception as e:
        return build_response(success=False, error={"message": str(e), "type": "AnalyticsError"})