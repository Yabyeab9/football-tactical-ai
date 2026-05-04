from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum


class MatchStatus(str, Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    FINISHED = "finished"
    POSTPONED = "postponed"


class EventOutcome(str, Enum):
    SUCCESSFUL = "successful"
    FAILED = "failed"
    BLOCKED = "blocked"
    INTERCEPTED = "intercepted"
    UNCERTAIN = "uncertain"


class PitchCoordinate(BaseModel):
    x: float = Field(..., ge=0, le=100)
    y: float = Field(..., ge=0, le=100)


class Team(BaseModel):
    id: str
    name: str
    short_name: str
    competition: str
    rank: int
    possession: float
    pass_accuracy: float
    ppda: float
    xg_per_90: float
    xga_per_90: float
    created_at: datetime


class Player(BaseModel):
    id: str
    name: str
    position: str
    squad_number: Optional[int]
    nationality: Optional[str]
    height_cm: Optional[float]
    weight_kg: Optional[float]
    dominant_foot: Optional[str]
    role: str
    market_value: Optional[float]
    current_team_id: str
    created_at: datetime


class Match(BaseModel):
    id: str
    competition: str
    season: str
    venue: Optional[str]
    kickoff_utc: datetime
    home_team_id: str
    away_team_id: str
    home_score: int
    away_score: int
    status: MatchStatus
    minute: Optional[int]
    attendance: Optional[int]
    created_at: datetime

    @validator('kickoff_utc')
    def validate_kickoff(cls, v):
        # Handle dual-calendar if needed, but for now, assume UTC
        return v


class Lineup(BaseModel):
    match_id: str
    team_id: str
    players: List[Player]
    formation: str
    captain_id: Optional[str]
    coach: Optional[str]


class LiveEvent(BaseModel):
    id: str
    match_id: str
    event_index: int
    period: int
    minute: int
    second: int
    type: str
    subtype: Optional[str]
    team_id: str
    player_id: Optional[str]
    target_player_id: Optional[str]
    location: Optional[PitchCoordinate]
    end_location: Optional[PitchCoordinate]
    outcome: EventOutcome
    xg: Optional[float]
    xt: Optional[float]
    ppda: Optional[float]
    pass_length: Optional[float]
    pass_angle: Optional[float]
    pass_height: Optional[str]
    pass_type: Optional[str]
    carry_distance: Optional[float]
    under_pressure: bool
    created_at: datetime


class TacticalFrame(BaseModel):
    match_id: str
    frame_index: int
    timestamp: datetime
    period: int
    minute: int
    second: int
    home_team_positions: List[Dict[str, Any]]  # Player positions with IDs
    away_team_positions: List[Dict[str, Any]]
    ball_position: Optional[PitchCoordinate]
    possession_team_id: Optional[str]
    created_at: datetime


class PlayerStats(BaseModel):
    player_id: str
    match_id: str
    minutes_played: int
    passes_completed: int
    passes_attempted: int
    progressive_passes: int
    shots: int
    shots_on_target: int
    total_xg: float
    carries: int
    carry_distance: float
    progressive_carries: int
    pressures: int
    successful_pressures: int
    dribbles_completed: int
    dribbles_attempted: int
    interceptions: int
    tackles: int
    created_at: datetime


# Analytics Models
class PitchControlCell(BaseModel):
    x: float
    y: float
    control_probability: float
    controlling_team_id: Optional[str]


class ThreatFlowPoint(BaseModel):
    minute: int
    xt_value: float
    possession_team_id: str


class PassNetworkNode(BaseModel):
    player_id: str
    name: str
    role: str
    team_id: str
    passes_received: int
    passes_completed: int
    x: float
    y: float
    degree_centrality: float
    betweenness: float


class PassNetworkEdge(BaseModel):
    source: str
    target: str
    weight: int
    success_rate: float
    combined_actions: int


class PressingZone(BaseModel):
    zone_id: str
    x: float
    y: float
    ppda: float
    turnovers: int


class PredictionResult(BaseModel):
    match_id: str
    home_win_probability: float
    draw_probability: float
    away_win_probability: float
    home_xg: float
    away_xg: float
    updated_at: datetime


class TacticalSummary(BaseModel):
    match_id: str
    summary: str
    key_insights: List[str]
    generated_at: datetime


class SearchResult(BaseModel):
    match_id: str
    relevance_score: float
    tactical_style: str
    description: str