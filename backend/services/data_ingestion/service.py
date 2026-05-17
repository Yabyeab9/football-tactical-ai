from __future__ import annotations

import logging
from typing import Dict, List, Optional

from backend.adapters.data_providers.statsbomb_provider import StatsBombProvider
from backend.ports.data_provider import DataProvider
from backend.models.schemas import Match, Team, Player, LiveEvent, Lineup, TacticalFrame, PlayerStats

logger = logging.getLogger(__name__)


class DataIngestionService:
    def __init__(self, default_provider: str = "statsbomb"):
        self.providers: Dict[str, DataProvider] = {
            "statsbomb": StatsBombProvider()
        }
        self.default_provider = "statsbomb"

    def _get_provider(self, provider: Optional[str]) -> DataProvider:
        # Strictly enforce statsbomb for live data requirement
        return self.providers["statsbomb"]

    async def get_matches(self, competition: str = "11", season: str = "90", provider: Optional[str] = None) -> List[Match]:
        # Default to La Liga 2018/19 if none provided for showcase
        comp = competition or "11"
        seas = season or "90"
        return await self._get_provider(provider).fetch_matches(comp, seas)

    async def get_all_matches(self, provider: Optional[str] = None) -> List[Match]:
        return await self.get_matches(provider=provider)

    async def get_match_by_id(self, match_id: str, provider: Optional[str] = None) -> Optional[Match]:
        # StatsBomb usually needs competition/season, but we can search in matches list
        matches = await self.get_matches(provider=provider)
        return next((m for m in matches if m.id == match_id), None)

    async def get_teams(self, competition: str = "11", provider: Optional[str] = None) -> List[Team]:
        # In this implementation, fetch teams from match lineup data or similar
        return [] # Simplified for now

    async def get_team_by_id(self, team_id: str, provider: Optional[str] = None) -> Optional[Team]:
        return None

    async def get_players(self, team_id: str, provider: Optional[str] = None) -> List[Player]:
        return await self._get_provider(provider).fetch_players(team_id)

    async def get_live_events(self, match_id: str, provider: Optional[str] = None) -> List[LiveEvent]:
        return await self._get_provider(provider).fetch_live_events(match_id)

    async def get_all_events(self, provider: Optional[str] = None) -> List[LiveEvent]:
        return []

    async def get_lineups(self, match_id: str, provider: Optional[str] = None) -> List[Lineup]:
        return await self._get_provider(provider).fetch_lineups(match_id)

    async def get_tactical_frames(self, match_id: str, provider: Optional[str] = None) -> List[TacticalFrame]:
        return await self._get_provider(provider).fetch_tactical_frames(match_id)

    async def get_player_stats(self, match_id: str, provider: Optional[str] = None) -> List[PlayerStats]:
        return await self._get_provider(provider).fetch_player_stats(match_id)
