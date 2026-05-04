from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from backend.core.settings import settings
from backend.models.schemas import (
    TacticalSummary, SearchResult, MatchEvent, PlayerStats,
    Team, Match, TacticalMetric
)
from backend.core.dependencies import (
    get_ai_service,
    get_prediction_engine,
    get_tactical_search,
    get_data_service
)


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Tactical Intelligence"])


class TacticalBriefRequest(BaseModel):
    match_id: str
    current_minute: int
    team_context: Dict[str, Any] = Field(default_factory=dict)


class PredictionRequest(BaseModel):
    match_id: str
    current_minute: int


class PlayerForecastRequest(BaseModel):
    player_id: str
    match_id: str
    current_minute: int
    time_window_minutes: int = 15


class TacticalSearchRequest(BaseModel):
    query: str
    limit: int = Field(default=20, ge=1, le=100)


class TeamSimilarityRequest(BaseModel):
    target_team_id: str
    limit: int = Field(default=10, ge=1, le=50)


class TacticalAnomalyRequest(BaseModel):
    match_id: str
    current_minute: int


@router.post("/tactical-brief", response_model=Dict[str, Any])
async def generate_tactical_brief(
    request: TacticalBriefRequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    """
    Generate a live tactical brief explaining current match situation
    """
    try:
        # Fetch match events
        events = await data_service.get_live_events(request.match_id)
        if not events:
            raise HTTPException(status_code=404, detail="Match events not found")

        # Get team context (simplified)
        team_context = request.team_context or {
            "home_team": {"formation": "4-3-3", "style": "possession"},
            "away_team": {"formation": "4-2-3-1", "style": "counter_attack"}
        }

        # Generate tactical brief
        brief = await ai_service.generate_tactical_brief(
            events, request.current_minute, team_context
        )

        return {
            "brief": {
                "type": brief.type.value,
                "timestamp": brief.timestamp.isoformat(),
                "title": brief.title,
                "analysis": brief.analysis,
                "confidence": brief.confidence,
                "supporting_data": brief.supporting_data,
                "recommendations": brief.recommendations
            }
        }

    except Exception as e:
        logger.error(f"Failed to generate tactical brief: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate tactical analysis")


@router.post("/predictions/live", response_model=Dict[str, Any])
async def get_live_predictions(
    request: PredictionRequest,
    prediction_engine = Depends(get_prediction_engine),
    data_service = Depends(get_data_service)
):
    """
    Get live match outcome predictions
    """
    try:
        # Fetch match data
        match = await data_service.get_matches("", "")  # Simplified - would need proper match fetching
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        events = await data_service.get_live_events(request.match_id)

        # Generate predictions
        predictions = await prediction_engine.calculate_live_probabilities(
            match[0] if isinstance(match, list) else match,  # Handle list response
            events,
            request.current_minute
        )

        return {
            "predictions": {
                "match_id": predictions.match_id,
                "home_win_probability": predictions.home_win_prob,
                "draw_probability": predictions.draw_prob,
                "away_win_probability": predictions.away_win_prob,
                "confidence": predictions.confidence,
                "key_factors": predictions.key_factors,
                "momentum_shift": predictions.momentum_shift,
                "updated_at": predictions.updated_at.isoformat()
            }
        }

    except Exception as e:
        logger.error(f"Failed to generate predictions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate predictions")


@router.post("/predictions/player", response_model=Dict[str, Any])
async def get_player_forecast(
    request: PlayerForecastRequest,
    prediction_engine = Depends(get_prediction_engine),
    data_service = Depends(get_data_service)
):
    """
    Get player performance forecast for next time window
    """
    try:
        events = await data_service.get_live_events(request.match_id)

        forecast = await prediction_engine.forecast_player_performance(
            request.player_id,
            request.match_id,
            events,
            request.current_minute,
            request.time_window_minutes
        )

        return {
            "forecast": {
                "player_id": forecast.player_id,
                "match_id": forecast.match_id,
                "scoring_probability": forecast.scoring_probability,
                "assisting_probability": forecast.assisting_probability,
                "threat_level": forecast.threat_level,
                "time_window_minutes": forecast.time_window_minutes,
                "key_factors": forecast.key_factors,
                "confidence": forecast.confidence
            }
        }

    except Exception as e:
        logger.error(f"Failed to generate player forecast: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate player forecast")


@router.post("/search/tactical", response_model=Dict[str, Any])
async def search_tactical_patterns(
    request: TacticalSearchRequest,
    search_engine = Depends(get_tactical_search),
    data_service = Depends(get_data_service)
):
    """
    Search for tactical patterns using semantic understanding
    """
    try:
        # Fetch all available events and matches for search
        events = await data_service.get_live_events("")  # Would need to fetch all events
        matches = await data_service.get_matches("", "")  # Would need to fetch all matches

        results = await search_engine.semantic_search(
            request.query,
            events,
            matches,
            request.limit
        )

        return {
            "query": request.query,
            "results": [
                {
                    "match_id": result.match_id,
                    "timestamp": result.timestamp.isoformat(),
                    "description": result.description,
                    "confidence": result.confidence,
                    "tactical_context": result.tactical_context,
                    "key_events": result.key_events,
                    "video_timestamp": result.video_timestamp
                }
                for result in results
            ],
            "total_results": len(results)
        }

    except Exception as e:
        logger.error(f"Failed to search tactical patterns: {e}")
        raise HTTPException(status_code=500, detail="Failed to search tactical patterns")


@router.post("/teams/similar", response_model=Dict[str, Any])
async def find_similar_teams(
    request: TeamSimilarityRequest,
    search_engine = Depends(get_tactical_search),
    data_service = Depends(get_data_service)
):
    """
    Find teams with similar tactical DNA
    """
    try:
        # Fetch target team
        teams = await data_service.get_teams()
        target_team = next((t for t in teams if t.id == request.target_team_id), None)
        if not target_team:
            raise HTTPException(status_code=404, detail="Target team not found")

        # Fetch match data for analysis
        matches = await data_service.get_matches("", "")
        events = await data_service.get_live_events("")

        similar_teams = await search_engine.find_similar_tactical_styles(
            target_team, teams, matches, events
        )

        return {
            "target_team": {
                "id": target_team.id,
                "name": target_team.name
            },
            "similar_teams": [
                {
                    "team": {
                        "id": team.id,
                        "name": team.name
                    },
                    "similarity_score": similarity_score,
                    "similarity_factors": factors
                }
                for team, similarity_score, factors in similar_teams[:request.limit]
            ]
        }

    except Exception as e:
        logger.error(f"Failed to find similar teams: {e}")
        raise HTTPException(status_code=500, detail="Failed to find similar teams")


@router.post("/anomalies/tactical", response_model=Dict[str, Any])
async def detect_tactical_anomalies(
    request: TacticalAnomalyRequest,
    search_engine = Depends(get_tactical_search),
    data_service = Depends(get_data_service)
):
    """
    Detect tactical anomalies that should trigger alerts
    """
    try:
        # Fetch match data
        match = await data_service.get_matches("", "")
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        events = await data_service.get_live_events(request.match_id)

        anomalies = await search_engine.detect_tactical_anomalies(
            match[0] if isinstance(match, list) else match,
            events,
            request.current_minute
        )

        return {
            "match_id": request.match_id,
            "current_minute": request.current_minute,
            "anomalies": [
                {
                    "type": anomaly["type"],
                    "alert": anomaly["alert"],
                    "description": anomaly["description"],
                    "confidence": anomaly["confidence"],
                    "recommendation": anomaly["recommendation"]
                }
                for anomaly in anomalies
            ],
            "total_anomalies": len(anomalies)
        }

    except Exception as e:
        logger.error(f"Failed to detect tactical anomalies: {e}")
        raise HTTPException(status_code=500, detail="Failed to detect tactical anomalies")


@router.post("/autopsy/match", response_model=Dict[str, Any])
async def generate_match_autopsy(
    match_id: str,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    """
    Generate comprehensive post-match tactical autopsy
    """
    try:
        # Fetch match data
        match = await data_service.get_matches("", "")
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        events = await data_service.get_live_events(match_id)
        team_stats = {
            "home": {"possession": 55, "shots": 12, "pass_accuracy": 87},
            "away": {"possession": 45, "shots": 8, "pass_accuracy": 82}
        }

        autopsy = await ai_service.generate_post_match_autopsy(
            match[0] if isinstance(match, list) else match,
            events,
            team_stats
        )

        return {
            "match_id": match_id,
            "autopsy": {
                "executive_summary": autopsy.executive_summary,
                "tactical_performance": autopsy.tactical_performance,
                "player_ratings": autopsy.player_ratings,
                "key_moments": autopsy.key_moments,
                "future_recommendations": autopsy.future_recommendations,
                "scouting_report": autopsy.scouting_report
            }
        }

    except Exception as e:
        logger.error(f"Failed to generate match autopsy: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate match autopsy")