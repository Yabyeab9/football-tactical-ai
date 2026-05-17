from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="football-auth-service", version="0.1.0")
SECRET = os.getenv("AUTH_SERVICE_SECRET", "change-me")


class TokenRequest(BaseModel):
    subject: str = Field(..., min_length=3)
    tenant: str = Field(..., min_length=2)
    role: str = Field(default="analyst")
    expires_in_seconds: int = Field(default=3600, ge=60, le=86400)


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _sign(payload: dict[str, object]) -> str:
    serialized = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    signature = hmac.new(SECRET.encode(), serialized, hashlib.sha256).digest()
    return f"{_b64(serialized)}.{_b64(signature)}"


def _verify(token: str) -> dict[str, object]:
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        payload_bytes = base64.urlsafe_b64decode(encoded_payload + "==")
        signature_bytes = base64.urlsafe_b64decode(encoded_signature + "==")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid token encoding") from exc

    expected = hmac.new(SECRET.encode(), payload_bytes, hashlib.sha256).digest()
    if not hmac.compare_digest(signature_bytes, expected):
        raise HTTPException(status_code=401, detail="Invalid token signature")

    payload = json.loads(payload_bytes.decode())
    if int(payload["exp"]) < int(time.time()):
        raise HTTPException(status_code=401, detail="Token expired")
    return payload


@app.get("/health")
async def health() -> dict[str, object]:
    return {"service": "auth-service", "status": "ok"}


@app.post("/token")
async def issue_token(request: TokenRequest) -> dict[str, object]:
    payload = {
        "sub": request.subject,
        "tenant": request.tenant,
        "role": request.role,
        "iat": int(time.time()),
        "exp": int(time.time()) + request.expires_in_seconds,
    }
    return {"access_token": _sign(payload), "token_type": "bearer", "claims": payload}


@app.post("/verify")
async def verify_token(body: dict[str, str]) -> dict[str, object]:
    token = body.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="token is required")
    return {"active": True, "claims": _verify(token)}
