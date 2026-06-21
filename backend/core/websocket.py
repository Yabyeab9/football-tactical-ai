from __future__ import annotations
from typing import Any, Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # active_connections[match_id] = set of WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # global_connections = set of WebSockets for general updates
        self.global_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, match_id: str | None = None):
        await websocket.accept()
        if match_id:
            if match_id not in self.active_connections:
                self.active_connections[match_id] = set()
            self.active_connections[match_id].add(websocket)
            logger.info(f"New connection for match {match_id}. Total: {len(self.active_connections[match_id])}")
        else:
            self.global_connections.add(websocket)
            logger.info(f"New global connection. Total: {len(self.global_connections)}")

    def disconnect(self, websocket: WebSocket, match_id: str | None = None):
        if match_id and match_id in self.active_connections:
            self.active_connections[match_id].discard(websocket)
            if not self.active_connections[match_id]:
                del self.active_connections[match_id]
        else:
            self.global_connections.discard(websocket)

    async def broadcast_to_match(self, match_id: str, message: dict[str, Any]):
        if match_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[match_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.add(connection)
            
            for connection in disconnected:
                self.disconnect(connection, match_id)

    async def broadcast_global(self, message: dict[str, Any]):
        disconnected = set()
        for connection in self.global_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()
