from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

def build_response(
    success: bool, 
    data: Any | None = None, 
    error: dict[str, Any] | None = None,
    meta: dict[str, Any] | None = None
) -> dict[str, Any]:
    response = {
        "success": success,
        "data": data if data is not None else {},
        "error": error or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if meta:
        response["meta"] = meta
    return response
