from __future__ import annotations

import asyncio
from collections import defaultdict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI(title="football-realtime-engine", version="0.1.0")
subscriptions: dict[str, set[WebSocket]] = defaultdict(set)


@app.get("/health")
async def health() -> dict[str, object]:
    return {"service": "realtime-engine", "status": "ok", "topics": len(subscriptions)}


@app.websocket("/ws/match/{match_id}")
async def match_stream(websocket: WebSocket, match_id: str) -> None:
    await websocket.accept()
    subscriptions[match_id].add(websocket)

    try:
        await websocket.send_json(
            {
                "type": "subscription_ack",
                "match_id": match_id,
                "message": "Connected to match stream",
            }
        )
        while True:
            await asyncio.sleep(15)
            await websocket.send_json({"type": "heartbeat", "match_id": match_id})
    except WebSocketDisconnect:
        subscriptions[match_id].discard(websocket)
