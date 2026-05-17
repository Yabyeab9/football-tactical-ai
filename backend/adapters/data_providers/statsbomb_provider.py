from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

import httpx

from backend.models.schemas import Match, Team, Player, LiveEvent, Lineup, TacticalFrame, PlayerStats, MatchStatus, EventOutcome, PitchCoordinate
from backend.ports.data_provider import DataProvider

logger = logging.getLogger(__name__)


class StatsBombProvider(DataProvider):
    def __init__(self):
        self.base_url = "https://raw.githubusercontent.com/statsbomb/open-data/master/data"
        self.client = httpx.AsyncClient(timeout=30.0)

    async def _get_json(self, path: str) -> Optional[Any]:
        try:
            url = f"{self.base_url}/{path.lstrip('/')}"
            response = await self.client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            logger.warning("StatsBomb fetch failed at %s: %s", path, exc)
            return None

    def _normalize_coord(self, location: Optional[List[float]]) -> Optional[PitchCoordinate]:
        if not location or len(location) < 2:
            return None
        # StatsBomb pitch is 120 x 80
        return PitchCoordinate(
            x=min(100.0, max(0.0, (location[0] / 120.0) * 100.0)),
            y=min(100.0, max(0.0, (location[1] / 80.0) * 100.0))
        )

    async def fetch_matches(self, competition: str, season: str) -> List[Match]:
        if not competition or not season:
            # Default to some competition if not provided for 'live' feel? 
            # Or let the service handle defaults.
            return []
        data = await self._get_json(f"matches/{competition}/{season}.json")
        if not data:
            return []
            
        matches = []
        for m in data:
            try:
                matches.append(Match(
                    id=str(m["match_id"]),
                    competition=m["competition"]["competition_name"],
                    season=m["season"]["season_name"],
                    venue=m.get("stadium", {}).get("name"),
                    kickoff_utc=datetime.fromisoformat(m["kick_off"].replace("Z", "+00:00")) if m.get("kick_off") else datetime.now(timezone.utc),
                    home_team_id=str(m["home_team"]["home_team_id"]),
                    away_team_id=str(m["away_team"]["away_team_id"]),
                    home_score=m["home_score"],
                    away_score=m["away_score"],
                    status=MatchStatus.FINISHED if m["match_status"] == "available" else MatchStatus.SCHEDULED,
                    minute=90 if m["match_status"] == "available" else 0,
                    attendance=m.get("attendance"),
                    created_at=datetime.now(timezone.utc)
                ))
            except Exception as e:
                logger.error("Error parsing match %s: %s", m.get("match_id"), e)
        return matches

    async def fetch_live_events(self, match_id: str) -> List[LiveEvent]:
        data = await self._get_json(f"events/{match_id}.json")
        if not data:
            return []

        events = []
        for i, e in enumerate(data):
            try:
                outcome = EventOutcome.SUCCESSFUL
                raw_outcome = e.get(e["type"]["name"].lower().replace(" ", "_"), {}).get("outcome", {}).get("name")
                if raw_outcome in ["Incomplete", "Lost Out", "Out", "Off T", "Blocked"]:
                    outcome = EventOutcome.FAILED

                events.append(LiveEvent(
                    id=e["id"],
                    match_id=match_id,
                    event_index=i,
                    period=e["period"],
                    minute=e["minute"],
                    second=e["second"],
                    type=e["type"]["name"],
                    subtype=e.get("play_pattern", {}).get("name"),
                    team_id=str(e["team"]["id"]),
                    player_id=str(e["player"]["id"]) if "player" in e else None,
                    location=self._normalize_coord(e.get("location")),
                    end_location=self._normalize_coord(e.get("pass", {}).get("end_location") or e.get("carry", {}).get("end_location")),
                    outcome=outcome,
                    xg=e.get("shot", {}).get("statsbomb_xg"),
                    xt=None, 
                    under_pressure=e.get("under_pressure", False),
                    created_at=datetime.now(timezone.utc)
                ))
            except Exception:
                pass
        return events

    async def fetch_tactical_frames(self, match_id: str) -> List[TacticalFrame]:
        data = await self._get_json(f"events/{match_id}.json")
        if not data:
            return []

        frames = []
        for i, e in enumerate(data):
            if "shot" in e and "freeze_frame" in e["shot"]:
                home_team_id = str(e["team"]["id"])
                ff = e["shot"]["freeze_frame"]
                
                home_pos = []
                away_pos = []
                home_pos.append({"player_id": str(e["player"]["id"]), "x": e["location"][0], "y": e["location"][1]})
                
                for p in ff:
                    pos = {"player_id": str(p["player"]["id"]), "x": p["location"][0], "y": p["location"][1]}
                    if p["teammate"]:
                        home_pos.append(pos)
                    else:
                        away_pos.append(pos)
                
                frames.append(TacticalFrame(
                    match_id=match_id,
                    frame_index=len(frames),
                    timestamp=datetime.now(timezone.utc),
                    period=e["period"],
                    minute=e["minute"],
                    second=e["second"],
                    home_team_positions=home_pos,
                    away_team_positions=away_pos,
                    ball_position=self._normalize_coord(e["location"]),
                    possession_team_id=home_team_id,
                    created_at=datetime.now(timezone.utc)
                ))
        return frames

    async def fetch_lineups(self, match_id: str) -> List[Lineup]:
        data = await self._get_json(f"lineups/{match_id}.json")
        if not data:
            return []
            
        lineups = []
        for l in data:
            players = []
            for p in l["lineup"]:
                players.append(Player(
                    id=str(p["player_id"]),
                    name=p["player_name"],
                    position=p.get("positions", [{}])[0].get("position", "Unknown") if p.get("positions") else "Unknown",
                    squad_number=p.get("jersey_number"),
                    nationality=p.get("country", {}).get("name"),
                    role="Player",
                    current_team_id=str(l["team_id"]),
                    created_at=datetime.now(timezone.utc)
                ))
            
            lineups.append(Lineup(
                match_id=match_id,
                team_id=str(l["team_id"]),
                players=players,
                formation="Unknown",
                captain_id=None,
                coach=None
            ))
        return lineups
