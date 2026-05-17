from __future__ import annotations

import logging
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.logging import configure_logging
from backend.core.settings import settings
from backend.db.database import get_redis_client, initialize_data_store
from dotenv import load_dotenv
load_dotenv()
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


from backend.core.responses import build_response


@app.exception_handler(HTTPException)
async def http_exception_handler(_: object, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=build_response(
            success=False,
            error={
                "code": exc.status_code,
                "message": exc.detail,
                "type": "HTTPException"
            }
        ),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: object, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=build_response(
            success=False,
            error={
                "code": 422,
                "message": "Validation error",
                "details": exc.errors(),
                "type": "RequestValidationError"
            }
        ),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: object, exc: Exception) -> JSONResponse:
    logging.getLogger(__name__).exception("Unhandled application error", exc_info=exc)
    
    error_msg = "Internal server error"
    details = {}
    
    if settings.environment == "development":
        error_msg = str(exc)
        import traceback
        details["traceback"] = traceback.format_exc()
        details["error_type"] = exc.__class__.__name__

    return JSONResponse(
        status_code=500,
        content=build_response(
            success=False,
            error={
                "code": 500,
                "message": error_msg,
                "details": details,
                "type": "UnhandledException"
            }
        ),
    )


@app.on_event("startup")
async def on_startup() -> None:
    await initialize_data_store()


@app.get("/api/health", tags=["infra"])
async def health_check() -> dict[str, object]:
    redis_client = await get_redis_client()
    redis_status = await redis_client.ping()
    return build_response(True, data={"status": "ok", "redis": redis_status})


# Router registration placeholder for future tactical endpoints
# from backend.api.v1.routes.matches import router as matches_router
# app.include_router(matches_router, prefix="/api/matches", tags=["matches"])

from backend.api.v1.routes.analytics import router as analytics_router
from backend.api.v1.routes.search import router as search_router
from backend.api.v1.routes.ai import router as ai_router
from backend.api.v1.routes.live import router as live_router

app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(search_router, prefix="/api/search", tags=["search"])
app.include_router(ai_router, prefix="/api/ai", tags=["ai"])
app.include_router(live_router, prefix="/api", tags=["live"])
    