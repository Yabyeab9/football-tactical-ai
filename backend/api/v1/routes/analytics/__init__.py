from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, Query

from backend.db.database import get_db_session
from backend.services.analytics.service import AnalyticsService
from backend.services.data_ingestion.service import DataIngestionService
from backend.models.schemas import PitchControlCell, ThreatFlowPoint, PressingZone, PredictionResult


router = APIRouter()

def get_analytics_service(db_session=Depends(get_db_session)) -> AnalyticsService:
    data_service = DataIngestionService()
    return AnalyticsService(data_service)


@router.get("/pitch-control", response_model=List[PitchControlCell])
async def get_pitch_control(
    match_id: str = Query(..., description="Match ID"),
    frame_index: int = Query(..., description="Frame index"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    return await service.calculate_pitch_control(match_id, frame_index)


@router.get("/threat-flow", response_model=List[ThreatFlowPoint])
async def get_threat_flow(
    match_id: str = Query(..., description="Match ID"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    return await service.calculate_threat_flow(match_id)


@router.get("/pass-networks")
async def get_pass_network(
    match_id: str = Query(..., description="Match ID"),
    team_id: str = Query(..., description="Team ID"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    return await service.calculate_pass_network(match_id, team_id)


@router.get("/pressing-efficiency", response_model=List[PressingZone])
async def get_pressing_efficiency(
    match_id: str = Query(..., description="Match ID"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    return await service.calculate_pressing_efficiency(match_id)


@router.get("/prediction/live", response_model=PredictionResult)
async def get_live_prediction(
    match_id: str = Query(..., description="Match ID"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    return await service.predict_live(match_id)