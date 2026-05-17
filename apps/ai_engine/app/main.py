from __future__ import annotations

from datetime import UTC, datetime

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="football-ai-engine", version="0.1.0")


class TacticalInferenceRequest(BaseModel):
    match_id: str
    team_name: str
    opponent_name: str
    possession: float = Field(default=50, ge=0, le=100)
    ppda: float = Field(default=12, ge=0)
    progressive_entries: int = Field(default=0, ge=0)
    final_third_touches: int = Field(default=0, ge=0)


@app.get("/health")
async def health() -> dict[str, object]:
    return {"service": "ai-engine", "status": "ok"}


@app.post("/inference/tactical")
async def infer_tactical_state(request: TacticalInferenceRequest) -> dict[str, object]:
    if request.possession >= 56 and request.ppda <= 10:
        style = "territorial press-control"
        reason = "High possession combined with aggressive pressure points to a front-foot control model."
    elif request.possession < 48 and request.progressive_entries >= 10:
        style = "vertical transition"
        reason = "Lower possession but strong progression suggests a transition-heavy attacking plan."
    else:
        style = "balanced adaptive"
        reason = "The current feature mix suggests a flexible state rather than a single dominant tactical identity."

    return {
        "service": "ai-engine",
        "generated_at": datetime.now(UTC).isoformat(),
        "match_id": request.match_id,
        "style": style,
        "reason": reason,
        "explanation": {
            "feature_contributions": {
                "possession": request.possession,
                "ppda": request.ppda,
                "progressive_entries": request.progressive_entries,
                "final_third_touches": request.final_third_touches,
            },
            "next_upgrade": "Replace this rule layer with model-serving plus LLM explanation over structured evidence.",
        },
    }
