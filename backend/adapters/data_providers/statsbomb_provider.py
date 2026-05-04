from __future__ import annotations

import json
import logging
from typing import List, Optional

import httpx

from backend.models.schemas import Match, Team, Player, LiveEvent, Lineup, TacticalFrame, PlayerStats
from backend.ports.data_provider import DataProvider

logger = logging.getLogger(__name__)


class StatsBombProvider(DataProvider):
    def __init__(self):
        self.base_url = "https://raw.githubusercontent.com/statsbomb/open-data/master/data"
        self.client = httpx.AsyncClient(timeout=30.0)

    async def _get_json(self, path: str) -> Optional[list[dict]]:
        try:
            response = await self.client.get(path)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            logger.warning("StatsBomb fetch failed: %s", exc)
            return None

    async def fetch_matches(self, competition: str, season: str) -> List[Match]:
        if not competition or not season:
            return []
        data = await self._get_json(f"{self.base_url}/matches/{competition}/{season}.json")
        return [Match(**match) for match in data] if data else []

    async def fetch_match_by_id(self, match_id: str) -> Optional[Match]:
        return None

    async def fetch_all_matches(self) -> List[Match]:
        return []

    async def fetch_teams(self, competition: str = "") -> List[Team]:
        return []

    async def fetch_team_by_id(self, team_id: str) -> Optional[Team]:
        return None

    async def fetch_players(self, team_id: str) -> List[Player]:
        return []

    async def fetch_live_events(self, match_id: str) -> List[LiveEvent]:
        return []

    async def fetch_all_events(self) -> List[LiveEvent]:
        return []

    async def fetch_lineups(self, match_id: str) -> List[Lineup]:
        return []

    async def fetch_tactical_frames(self, match_id: str) -> List[TacticalFrame]:
        return []

    async def fetch_player_stats(self, match_id: str) -> List[PlayerStats]:
        return []
