from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import FastAPI, HTTPException, Request

SERVICE_REGISTRY = {
    "auth": "http://auth-service:8080",
    "ingestion": "http://data-ingestion:8080",
    "ai": "http://ai-engine:8080",
    "realtime": "http://realtime-engine:8080",
    "simulation": "http://simulation-engine:8080",
}

REQUEST_WINDOW_SECONDS = 60
REQUEST_LIMIT_PER_IP = 120
request_buckets: dict[str, Deque[float]] = defaultdict(deque)

app = FastAPI(title="football-api-gateway", version="0.1.0")


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    bucket = request_buckets[client_ip]

    while bucket and now - bucket[0] > REQUEST_WINDOW_SECONDS:
        bucket.popleft()

    if len(bucket) >= REQUEST_LIMIT_PER_IP:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    bucket.append(now)
    response = await call_next(request)
    response.headers["x-rate-limit-limit"] = str(REQUEST_LIMIT_PER_IP)
    response.headers["x-rate-limit-remaining"] = str(max(0, REQUEST_LIMIT_PER_IP - len(bucket)))
    return response


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "service": "api-gateway",
        "status": "ok",
        "downstreams": SERVICE_REGISTRY,
    }


@app.get("/routes")
async def routes() -> dict[str, object]:
    return {
        "service": "api-gateway",
        "routes": {
            "/v1/auth": SERVICE_REGISTRY["auth"],
            "/v1/ingestion": SERVICE_REGISTRY["ingestion"],
            "/v1/ai": SERVICE_REGISTRY["ai"],
            "/v1/realtime": SERVICE_REGISTRY["realtime"],
            "/v1/simulation": SERVICE_REGISTRY["simulation"],
        },
        "notes": [
            "Terminate auth and rate limiting here.",
            "Add OpenTelemetry, JWT validation, and service routing middleware next.",
        ],
    }
