from __future__ import annotations

from random import random

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="football-simulation-engine", version="0.1.0")


class MatchSimulationRequest(BaseModel):
    home_team: str
    away_team: str
    home_strength: float = Field(default=1.0, ge=0)
    away_strength: float = Field(default=1.0, ge=0)
    steps: int = Field(default=500, ge=50, le=10000)


@app.get("/health")
async def health() -> dict[str, object]:
    return {"service": "simulation-engine", "status": "ok"}


@app.post("/simulate/match")
async def simulate_match(request: MatchSimulationRequest) -> dict[str, object]:
    home_wins = 0
    away_wins = 0
    draws = 0

    total_strength = max(request.home_strength + request.away_strength, 1e-6)
    home_weight = request.home_strength / total_strength
    away_weight = request.away_strength / total_strength

    for _ in range(request.steps):
        sample = random()
        if sample < home_weight * 0.8:
            home_wins += 1
        elif sample > 1 - (away_weight * 0.8):
            away_wins += 1
        else:
            draws += 1

    return {
        "service": "simulation-engine",
        "scenario": request.model_dump(),
        "probabilities": {
            "home_win": round((home_wins / request.steps) * 100, 2),
            "draw": round((draws / request.steps) * 100, 2),
            "away_win": round((away_wins / request.steps) * 100, 2),
        },
        "notes": [
            "This is only the orchestration scaffold.",
            "Replace with a possession-state transition simulator and player-agent movement model.",
        ],
    }
