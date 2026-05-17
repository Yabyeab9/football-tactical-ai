from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="football-data-ingestion", version="0.1.0")


class IngestionJobRequest(BaseModel):
    provider: str = Field(..., examples=["football-data", "thesportsdb", "openligadb"])
    competition: str | None = None
    from_date: str | None = None
    to_date: str | None = None
    mode: str = Field(default="incremental")


@app.get("/health")
async def health() -> dict[str, object]:
    return {"service": "data-ingestion", "status": "ok"}


@app.post("/jobs")
async def schedule_job(request: IngestionJobRequest) -> dict[str, object]:
    job_id = f"ingest-{uuid4()}"
    return {
        "job_id": job_id,
        "service": "data-ingestion",
        "status": "queued",
        "submitted_at": datetime.now(UTC).isoformat(),
        "request": request.model_dump(),
        "notes": [
            "Publish this job into Redis Streams or Kafka.",
            "Persist raw payloads before normalization.",
            "Track provider, idempotency key, and lineage metadata.",
        ],
    }
