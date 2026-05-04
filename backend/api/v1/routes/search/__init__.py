from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, Query

from backend.db.database import get_db_session
from backend.services.ai.service import AIService
from backend.services.data_ingestion.service import DataIngestionService
from backend.models.schemas import TacticalSummary, SearchResult


router = APIRouter()

def get_ai_service(db_session=Depends(get_db_session)) -> AIService:
    data_service = DataIngestionService()
    return AIService(data_service)


@router.get("/tactics", response_model=List[SearchResult])
async def search_tactics(
    query: str = Query(..., description="Tactical search query"),
    service: AIService = Depends(get_ai_service)
):
    return await service.search_tactics(query)


@router.get("/summary", response_model=TacticalSummary)
async def get_tactical_summary(
    match_id: str = Query(..., description="Match ID"),
    service: AIService = Depends(get_ai_service)
):
    return await service.generate_tactical_summary(match_id)