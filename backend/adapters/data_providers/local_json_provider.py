from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import List, Optional

from backend.models.schemas import Match, Team, Player, LiveEvent, Lineup, TacticalFrame, PlayerStats
from backend.ports.data_provider import DataProvider

logger = logging.getLogger(__name__)


class LocalJsonProvider(DataProvider):
    def __init__(self, data_dir: str = "./data"):
        self.data_dir = Path(data_dir)

    def _load(self, filename: str) -> list[dict]:
        path = self.data_dir / filename
        if not path.exists():
            logger.warning("Local JSON file not found: %s", path)
            return []
        with open(path, "r", encoding="utf-8") as source:
            try:
                return json.load(source)
            except json.JSONDecodeError:
                logger.warning("Invalid JSON in %s", path)
                return []

    async def fetch_matches(self, competition: str, season: str) -> List[Match]:
        if competition and season:
            data = self._load(f"matches_{competition}_{season}.json")
        else:
            data = self._load("matches.json")
        return [Match(**match) for match in data]

    async def fetch_match_by_id(self, match_id: str) -> Optional[Match]:
        data = self._load("matches.json")
        for record in data:
            if record.get("id") == match_id:
                return Match(**record)
        return None

    async def fetch_all_matches(self) -> List[Match]:
        data = self._load("matches.json")
        return [Match(**match) for match in data]

    async def fetch_teams(self, competition: str = "") -> List[Team]:
        data = self._load("teams.json")
        teams = [Team(**team) for team in data]
        if competition:
            return [team for team in teams if team.competition == competition]
        return teams

    async def fetch_team_by_id(self, team_id: str) -> Optional[Team]:
        data = self._load("teams.json")
        for record in data:
            if record.get("id") == team_id:
                return Team(**record)
        return None

    async def fetch_players(self, team_id: str) -> List[Player]:
        data = self._load("players.json")
        return [Player(**player) for player in data if player.get("current_team_id") == team_id]

    async def fetch_live_events(self, match_id: str) -> List[LiveEvent]:
        data = self._load("events.json")
        return [LiveEvent(**event) for event in data if event.get("match_id") == match_id]

    async def fetch_all_events(self) -> List[LiveEvent]:
        data = self._load("events.json")
        return [LiveEvent(**event) for event in data]

    async def fetch_lineups(self, match_id: str) -> List[Lineup]:
        data = self._load("lineups.json")
        return [Lineup(**lineup) for lineup in data if lineup.get("match_id") == match_id]

    async def fetch_tactical_frames(self, match_id: str) -> List[TacticalFrame]:
        data = self._load("tactical_frames.json")
        return [TacticalFrame(**frame) for frame in data if frame.get("match_id") == match_id]

    async def fetch_player_stats(self, match_id: str) -> List[PlayerStats]:
        data = self._load("player_stats.json")
        return [PlayerStats(**stats) for stats in data if stats.get("match_id") == match_id]
