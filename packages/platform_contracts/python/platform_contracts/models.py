from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class MatchEvent(BaseModel):
    event_id: str
    match_id: str
    event_type: str
    provider: str
    event_time: datetime
    team_id: str | None = None
    player_id: str | None = None
    payload: dict[str, object] = Field(default_factory=dict)


class FeatureVectorJob(BaseModel):
    job_id: str
    entity_type: Literal["match", "team", "player"]
    entity_id: str
    feature_set: str
    feature_version: str
    requested_at: datetime


class TacticalExplanation(BaseModel):
    match_id: str
    team_id: str
    prediction: str
    confidence: float = Field(ge=0, le=1)
    reason_codes: list[str] = Field(default_factory=list)
    narrative: str


class SimulationRequest(BaseModel):
    request_id: str
    match_id: str | None = None
    scenario_name: str
    inputs: dict[str, object] = Field(default_factory=dict)
