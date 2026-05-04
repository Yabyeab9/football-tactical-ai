from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, Query

from backend.core.dependencies import get_ai_service, get_data_service
from backend.models.schemas import TacticalSummary, SearchResult
from backend.services.ai.analytics_service import AIAnalyticsService
from backend.services.data_ingestion.service import DataIngestionService


router = APIRouter(tags=["Search"])


@router.get("/tactics", response_model=List[SearchResult])
async def search_tactics(
    query: str = Query(..., description="Tactical search query"),
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    events = await data_service.get_all_events()
    matches = await data_service.get_all_matches()
    patterns = await ai_service.analyze_tactical_pattern(query, events, matches)
    return [
        SearchResult(
            match_id=(pattern.examples[0].get("match") if pattern.examples else "unknown"),
            relevance_score=pattern.confidence,
            tactical_style=pattern.pattern_type,
            description=pattern.description
        )
        for pattern in patterns
    ]


@router.get("/summary", response_model=TacticalSummary)
async def get_tactical_summary(
    match_id: str = Query(..., description="Match ID"),
    ai_service: AIAnalyticsService = Depends(get_ai_service),
    data_service: DataIngestionService = Depends(get_data_service)
):
    events = await data_service.get_live_events(match_id)
    return await ai_service.generate_tactical_summary(match_id, events)
