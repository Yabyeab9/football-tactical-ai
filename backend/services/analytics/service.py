from __future__ import annotations

import asyncio
from datetime import datetime
from functools import lru_cache
from typing import List, Optional, Dict, Any
import numpy as np
from scipy.spatial import Voronoi
from shapely.geometry import Polygon, Point
from shapely.ops import unary_union

from backend.core.settings import settings
from backend.db.database import read_cache, write_cache
from backend.models.schemas import PitchControlCell, ThreatFlowPoint, PassNetworkNode, PassNetworkEdge, PressingZone, PredictionResult
from backend.services.data_ingestion.service import DataIngestionService


class AnalyticsService:
    def __init__(self, data_service: DataIngestionService):
        self.data_service = data_service

    @lru_cache(maxsize=128)
    async def calculate_pitch_control(self, match_id: str, frame_index: int) -> List[PitchControlCell]:
        cache_key = f"pitch_control:{match_id}:{frame_index}"
        cached = await read_cache(cache_key)
        if cached:
            return [PitchControlCell(**cell) for cell in cached]

        # Fetch tactical frame
        frames = await self.data_service.get_tactical_frames(match_id)
        frame = next((f for f in frames if f.frame_index == frame_index), None)
        if not frame:
            return []

        # Extract player positions
        home_positions = [(p['x'], p['y']) for p in frame.home_team_positions]
        away_positions = [(p['x'], p['y']) for p in frame.away_team_positions]

        # Create Voronoi diagram
        all_points = np.array(home_positions + away_positions)
        vor = Voronoi(all_points)

        # Calculate control probabilities (simplified)
        cells = []
        for i, region in enumerate(vor.regions):
            if -1 in region or len(region) == 0:
                continue
            polygon = Polygon([vor.vertices[j] for j in region])
            # Clip to pitch boundaries
            pitch = Polygon([(0, 0), (100, 0), (100, 100), (0, 100)])
            clipped = polygon.intersection(pitch)
            if clipped.is_empty:
                continue

            # Determine controlling team
            point = Point(all_points[i])
            controlling_team = "home" if i < len(home_positions) else "away"
            control_prob = 0.6 if controlling_team == "home" else 0.4  # Simplified

            # Discretize into cells
            for x in np.arange(0, 100, 5):
                for y in np.arange(0, 100, 5):
                    if clipped.contains(Point(x + 2.5, y + 2.5)):
                        cells.append(PitchControlCell(
                            x=x + 2.5,
                            y=y + 2.5,
                            control_probability=control_prob,
                            controlling_team_id=controlling_team
                        ))

        await write_cache(cache_key, [cell.dict() for cell in cells], settings.analytics_cache_ttl_seconds)
        return cells

    async def calculate_threat_flow(self, match_id: str) -> List[ThreatFlowPoint]:
        cache_key = f"threat_flow:{match_id}"
        cached = await read_cache(cache_key)
        if cached:
            return [ThreatFlowPoint(**point) for point in cached]

        events = await self.data_service.get_live_events(match_id)
        flow_points = []

        for event in events:
            if event.xt is not None:
                flow_points.append(ThreatFlowPoint(
                    minute=event.minute,
                    xt_value=event.xt,
                    possession_team_id=event.team_id
                ))

        await write_cache(cache_key, [point.dict() for point in flow_points], settings.analytics_cache_ttl_seconds)
        return flow_points

    async def calculate_pass_network(self, match_id: str, team_id: str) -> Dict[str, Any]:
        cache_key = f"pass_network:{match_id}:{team_id}"
        cached = await read_cache(cache_key)
        if cached:
            return cached

        events = await self.data_service.get_live_events(match_id)
        pass_events = [e for e in events if e.type == "Pass" and e.team_id == team_id and e.outcome == "successful"]

        # Build network
        nodes = {}
        edges = {}

        for event in pass_events:
            if event.player_id and event.target_player_id:
                # Update nodes
                if event.player_id not in nodes:
                    nodes[event.player_id] = {"passes_completed": 0, "passes_received": 0}
                if event.target_player_id not in nodes:
                    nodes[event.target_player_id] = {"passes_completed": 0, "passes_received": 0}

                nodes[event.player_id]["passes_completed"] += 1
                nodes[event.target_player_id]["passes_received"] += 1

                # Update edges
                edge_key = (event.player_id, event.target_player_id)
                if edge_key not in edges:
                    edges[edge_key] = {"weight": 0, "success": 0}
                edges[edge_key]["weight"] += 1
                edges[edge_key]["success"] += 1

        # Calculate centrality (simplified)
        network_nodes = []
        for player_id, stats in nodes.items():
            network_nodes.append(PassNetworkNode(
                player_id=player_id,
                name=f"Player {player_id}",  # Fetch name from data
                role="Unknown",
                team_id=team_id,
                passes_received=stats["passes_received"],
                passes_completed=stats["passes_completed"],
                x=50, y=50,  # Placeholder
                degree_centrality=stats["passes_completed"] / len(nodes) if nodes else 0,
                betweenness=0.0  # Simplified
            ))

        network_edges = []
        for (source, target), stats in edges.items():
            network_edges.append(PassNetworkEdge(
                source=source,
                target=target,
                weight=stats["weight"],
                success_rate=stats["success"] / stats["weight"],
                combined_actions=stats["weight"]
            ))

        result = {"nodes": network_nodes, "edges": network_edges}
        await write_cache(cache_key, result, settings.analytics_cache_ttl_seconds)
        return result

    async def calculate_pressing_efficiency(self, match_id: str) -> List[PressingZone]:
        cache_key = f"pressing:{match_id}"
        cached = await read_cache(cache_key)
        if cached:
            return [PressingZone(**zone) for zone in cached]

        events = await self.data_service.get_live_events(match_id)
        pressing_events = [e for e in events if e.type == "Pressure"]

        zones = []
        for x in range(0, 100, 20):
            for y in range(0, 100, 20):
                zone_events = [e for e in pressing_events if e.location and x <= e.location.x < x+20 and y <= e.location.y < y+20]
                ppda = len(zone_events) / max(1, len([e for e in events if e.team_id == "defending_team"]))  # Simplified
                turnovers = len([e for e in zone_events if e.outcome == "successful"])
                zones.append(PressingZone(
                    zone_id=f"{x}_{y}",
                    x=x + 10,
                    y=y + 10,
                    ppda=ppda,
                    turnovers=turnovers
                ))

        await write_cache(cache_key, [zone.dict() for zone in zones], settings.analytics_cache_ttl_seconds)
        return zones

    async def predict_live(self, match_id: str) -> PredictionResult:
        # Simplified AI-driven prediction
        # In reality, use a pre-trained model
        home_win_prob = 0.45
        draw_prob = 0.25
        away_win_prob = 0.30
        home_xg = 1.2
        away_xg = 1.5

        return PredictionResult(
            match_id=match_id,
            home_win_probability=home_win_prob,
            draw_probability=draw_prob,
            away_win_probability=away_win_prob,
            home_xg=home_xg,
            away_xg=away_xg,
            updated_at=datetime.utcnow()
        )