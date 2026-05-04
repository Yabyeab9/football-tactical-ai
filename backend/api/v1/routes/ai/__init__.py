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

router = APIRouter(tags=["AI Tactical Intelligence"])


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


class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = Field(default=20, ge=1, le=100)


class XTMomentumRequest(BaseModel):
    match_id: str


class SubstitutionSimulationRequest(BaseModel):
    match_id: str
    team_id: str
    out_player_id: str
    in_player_profile: Dict[str, Any]
    iterations: int = Field(default=300, ge=50, le=1000)


class ScoutingReportRequest(BaseModel):
    match_id: str


class GhostingRequest(BaseModel):
    match_id: str
    team_id: str


class FormationSwitchRequest(BaseModel):
    match_id: str
    team_id: str


class PitchControlRequest(BaseModel):
    match_id: str
    current_minute: int


class PlayerDNARequest(BaseModel):
    player_id: str
    team_id: str
    match_id: str
    limit: int = Field(default=5, ge=1, le=20)


class PressingHeatmapRequest(BaseModel):
    match_id: str


class FatigueDecayRequest(BaseModel):
    player_id: str
    match_id: str


class RefereeBiasRequest(BaseModel):
    match_id: str


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
            "brief": brief
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
        # Fetch match data by ID
        match = await data_service.get_match_by_id(request.match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        events = await data_service.get_live_events(request.match_id)

        predictions = await prediction_engine.calculate_live_probabilities(
            match,
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
        events = await data_service.get_all_events()
        matches = await data_service.get_all_matches()

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

        matches = await data_service.get_all_matches()
        events = await data_service.get_all_events()

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
        match = await data_service.get_match_by_id(request.match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        events = await data_service.get_live_events(request.match_id)

        anomalies = await search_engine.detect_tactical_anomalies(
            match,
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
        match = await data_service.get_match_by_id(match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        events = await data_service.get_live_events(match_id)
        team_stats = {
            "home": {"possession": 55, "shots": 12, "pass_accuracy": 87},
            "away": {"possession": 45, "shots": 8, "pass_accuracy": 82}
        }

        autopsy = await ai_service.generate_post_match_autopsy(
            match,
            events,
            team_stats
        )

        return {
            "match_id": match_id,
            "autopsy": autopsy
        }

    except Exception as e:
        logger.error(f"Failed to generate match autopsy: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate match autopsy")


@router.post("/search/semantic", response_model=Dict[str, Any])
async def semantic_event_search(
    request: SemanticSearchRequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    try:
        events = await data_service.get_all_events()
        results = await ai_service.search_match_events_semantic(request.query, events, request.limit)
        return {"query": request.query, "results": [result.model_dump() for result in results]}
    except Exception as e:
        logger.error(f"Failed to run semantic event search: {e}")
        raise HTTPException(status_code=500, detail="Failed to run semantic event search")


@router.post("/xt/momentum", response_model=Dict[str, Any])
async def compute_xt_momentum(
    request: XTMomentumRequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    try:
        match = await data_service.get_match_by_id(request.match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        events = await data_service.get_live_events(request.match_id)
        momentum = await ai_service.compute_xt_momentum(events, match.home_team_id, match.away_team_id)
        return {"match_id": request.match_id, "momentum": [m.model_dump() for m in momentum]}
    except Exception as e:
        logger.error(f"Failed to compute xT momentum: {e}")
        raise HTTPException(status_code=500, detail="Failed to compute xT momentum")


@router.post("/simulate/substitution", response_model=Dict[str, Any])
async def simulate_substitution(
    request: SubstitutionSimulationRequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    try:
        match = await data_service.get_match_by_id(request.match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        events = await data_service.get_live_events(request.match_id)
        impact = await ai_service.simulate_substitution_impact(
            match,
            events,
            request.team_id,
            request.out_player_id,
            request.in_player_profile,
            request.iterations
        )
        return {"impact": impact.model_dump()}
    except Exception as e:
        logger.error(f"Failed to simulate substitution impact: {e}")
        raise HTTPException(status_code=500, detail="Failed to simulate substitution impact")


@router.post("/scouting/report", response_model=Dict[str, Any])
async def generate_scouting_report(
    request: ScoutingReportRequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    try:
        match = await data_service.get_match_by_id(request.match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        events = await data_service.get_live_events(request.match_id)
        team_stats = {
            "home": {"possession": 55, "shots": 12, "pass_accuracy": 87},
            "away": {"possession": 45, "shots": 8, "pass_accuracy": 82}
        }
        report = await ai_service.generate_scout_report(match, events, team_stats)
        return {"match_id": request.match_id, "scouting_report": report}
    except Exception as e:
        logger.error(f"Failed to generate scouting report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate scouting report")


@router.post("/ghosting", response_model=Dict[str, Any])
async def analyze_ghosting(
    request: GhostingRequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    try:
        events = await data_service.get_live_events(request.match_id)
        frames = await data_service.get_tactical_frames(request.match_id)
        insights = await ai_service.ghosting_analysis(events, frames)
        return {"match_id": request.match_id, "insights": [insight.model_dump() for insight in insights]}
    except Exception as e:
        logger.error(f"Failed to analyze ghosting: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze ghosting")


@router.post("/formation/switches", response_model=Dict[str, Any])
async def detect_formation_switches(
    request: FormationSwitchRequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    try:
        frames = await data_service.get_tactical_frames(request.match_id)
        switches = await ai_service.detect_formation_switches(frames, request.team_id)
        return {"match_id": request.match_id, "switches": [switch.model_dump() for switch in switches]}
    except Exception as e:
        logger.error(f"Failed to detect formation switches: {e}")
        raise HTTPException(status_code=500, detail="Failed to detect formation switches")


@router.post("/pitch-control", response_model=Dict[str, Any])
async def build_pitch_control(
    request: PitchControlRequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    try:
        frames = await data_service.get_tactical_frames(request.match_id)
        annotation = await ai_service.build_pitch_control_voronoi(frames, request.current_minute)
        return {"match_id": request.match_id, "current_minute": request.current_minute, "pitch_control": annotation}
    except Exception as e:
        logger.error(f"Failed to build pitch control map: {e}")
        raise HTTPException(status_code=500, detail="Failed to build pitch control map")


@router.post("/player-dna", response_model=Dict[str, Any])
async def find_player_dna(
    request: PlayerDNARequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    try:
        players = await data_service.get_players(request.team_id)
        stats = await data_service.get_player_stats(request.match_id)
        results = await ai_service.match_player_dna(request.player_id, players, stats, request.limit)
        return {"player_id": request.player_id, "results": [result.model_dump() for result in results]}
    except Exception as e:
        logger.error(f"Failed to find player DNA matches: {e}")
        raise HTTPException(status_code=500, detail="Failed to find player DNA matches")


@router.post("/pressing/heatmap", response_model=Dict[str, Any])
async def pressing_heatmap(
    request: PressingHeatmapRequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    try:
        match = await data_service.get_match_by_id(request.match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        events = await data_service.get_live_events(request.match_id)
        heatmap = await ai_service.compute_pressing_heatmap(events, match.home_team_id, match.away_team_id)
        return {"match_id": request.match_id, "heatmap": heatmap}
    except Exception as e:
        logger.error(f"Failed to compute pressing heatmap: {e}")
        raise HTTPException(status_code=500, detail="Failed to compute pressing heatmap")


@router.post("/fatigue/decay", response_model=Dict[str, Any])
async def fatigue_decay(
    request: FatigueDecayRequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    try:
        stats = await data_service.get_player_stats(request.match_id)
        player_stats = next((s for s in stats if s.player_id == request.player_id), None)
        if not player_stats:
            raise HTTPException(status_code=404, detail="Player stats not found")
        events = await data_service.get_live_events(request.match_id)
        projection = await ai_service.simulate_biometric_decay(request.player_id, request.match_id, player_stats, events)
        return {"projection": projection.model_dump()}
    except Exception as e:
        logger.error(f"Failed to project fatigue decay: {e}")
        raise HTTPException(status_code=500, detail="Failed to project fatigue decay")


@router.post("/referee/bias", response_model=Dict[str, Any])
async def referee_bias(
    request: RefereeBiasRequest,
    ai_service = Depends(get_ai_service),
    data_service = Depends(get_data_service)
):
    try:
        match = await data_service.get_match_by_id(request.match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        events = await data_service.get_live_events(request.match_id)
        summary = await ai_service.referee_bias_insight(events, match.home_team_id, match.away_team_id)
        return {"match_id": request.match_id, "referee_bias": summary.model_dump()}
    except Exception as e:
        logger.error(f"Failed to analyze referee bias: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze referee bias")
