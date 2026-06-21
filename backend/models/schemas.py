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


def to_camel(string: str) -> str:
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class BaseSchema(BaseModel):
    model_config = {
        "alias_generator": to_camel,
        "populate_by_name": True,
        "from_attributes": True
    }


class PitchCoordinate(BaseSchema):
    x: float = Field(..., ge=0, le=100)
    y: float = Field(..., ge=0, le=100)


class Team(BaseSchema):
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


class Player(BaseSchema):
    id: str
    name: str
    position: str
    squad_number: Optional[int] = None
    nationality: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    dominant_foot: Optional[str] = None
    role: str
    market_value: Optional[float] = None
    current_team_id: str
    created_at: datetime


class Match(BaseSchema):
    id: str
    competition: str
    season: str
    venue: Optional[str] = None
    kickoff_utc: datetime
    home_team_id: str
    away_team_id: str
    home_score: int
    away_score: int
    status: MatchStatus
    minute: Optional[int] = None
    attendance: Optional[int] = None
    created_at: datetime

    @validator('kickoff_utc')
    def validate_kickoff(cls, v):
        return v


class Lineup(BaseSchema):
    match_id: str
    team_id: str
    players: List[Player]
    formation: str
    captain_id: Optional[str] = None
    coach: Optional[str] = None


class LiveEvent(BaseSchema):
    id: str
    match_id: str
    event_index: int
    period: int
    minute: int
    second: int
    type: str
    subtype: Optional[str] = None
    team_id: str
    player_id: Optional[str] = None
    target_player_id: Optional[str] = None
    location: Optional[PitchCoordinate] = None
    end_location: Optional[PitchCoordinate] = None
    outcome: EventOutcome
    xg: Optional[float] = None
    xt: Optional[float] = None
    ppda: Optional[float] = None
    pass_length: Optional[float] = None
    pass_angle: Optional[float] = None
    pass_height: Optional[str] = None
    pass_type: Optional[str] = None
    carry_distance: Optional[float] = None
    under_pressure: bool
    created_at: datetime


class TacticalFrame(BaseSchema):
    match_id: str
    frame_index: int
    timestamp: datetime
    period: int
    minute: int
    second: int
    home_team_positions: List[Dict[str, Any]]
    away_team_positions: List[Dict[str, Any]]
    ball_position: Optional[PitchCoordinate] = None
    possession_team_id: Optional[str] = None
    created_at: datetime


class PlayerStats(BaseSchema):
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


class PitchControlCell(BaseSchema):
    x: float
    y: float
    control_probability: float
    controlling_team_id: Optional[str] = None


class ThreatFlowPoint(BaseSchema):
    minute: int
    xt_value: float
    possession_team_id: str


class PassNetworkNode(BaseSchema):
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


class PassNetworkEdge(BaseSchema):
    source: str
    target: str
    weight: int
    success_rate: float
    combined_actions: int
    source_x: Optional[float] = None
    source_y: Optional[float] = None
    target_x: Optional[float] = None
    target_y: Optional[float] = None


class PressingZone(BaseSchema):
    zone_id: str
    x: float
    y: float
    ppda: float
    turnovers: int


class PredictionResult(BaseSchema):
    match_id: str
    home_win_probability: float
    draw_probability: float
    away_win_probability: float
    home_xg: float
    away_xg: float
    updated_at: datetime


class TacticalSummary(BaseSchema):
    match_id: str
    summary: str
    key_insights: List[str]
    generated_at: datetime


class SearchResult(BaseSchema):
    match_id: str
    relevance_score: float
    tactical_style: str
    description: str


# Aliases for legacy tactical search signatures
MatchEvent = LiveEvent
TacticalMetric = Dict[str, Any]