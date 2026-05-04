from __future__ import annotations

import logging
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.logging import configure_logging
from backend.core.settings import settings
from backend.db.database import get_redis_client, initialize_data_store

configure_logging()

app = FastAPI(
    title=settings.app_name,
    version=settings.api_schema_version,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def build_response(success: bool, message: str, data: object | None = None, meta: dict[str, object] | None = None) -> dict[str, object]:
    payload = {
        "success": success,
        "message": message,
        "data": data or {},
        "meta": {"schemaVersion": settings.api_schema_version},
    }
    if meta:
        payload["meta"].update(meta)
    return payload


@app.exception_handler(HTTPException)
async def http_exception_handler(_: object, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=build_response(False, exc.detail, None, {"http_status": exc.status_code}),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: object, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=build_response(False, "Validation error", None, {"errors": exc.errors()}),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: object, exc: Exception) -> JSONResponse:
    logging.getLogger(__name__).exception("Unhandled application error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content=build_response(False, "Internal server error", None),
    )


@app.on_event("startup")
async def on_startup() -> None:
    await initialize_data_store()


@app.get("/api/health", tags=["infra"])
async def health_check() -> dict[str, object]:
    redis_client = await get_redis_client()
    redis_status = await redis_client.ping()
    return build_response(True, "Backend healthy", {"status": "ok", "redis": redis_status})


# Router registration placeholder for future tactical endpoints
# from backend.api.v1.routes.matches import router as matches_router
# app.include_router(matches_router, prefix="/api/matches", tags=["matches"])

from backend.api.v1.routes.analytics import router as analytics_router
from backend.api.v1.routes.search import router as search_router
from backend.api.v1.routes.ai import router as ai_router

app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(search_router, prefix="/api/search", tags=["search"])
app.include_router(ai_router, prefix="/api/ai", tags=["ai"])
