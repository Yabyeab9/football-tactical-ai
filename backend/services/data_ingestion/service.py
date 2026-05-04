from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, List, Optional

from backend.adapters.data_providers.local_json_provider import LocalJsonProvider
from backend.adapters.data_providers.statsbomb_provider import StatsBombProvider
from backend.ports.data_provider import DataProvider
from backend.models.schemas import Match, Team, Player, LiveEvent, Lineup, TacticalFrame, PlayerStats

logger = logging.getLogger(__name__)


class DataIngestionService:
    def __init__(self, default_provider: str = "local"):
        repo_root = Path(__file__).resolve().parents[3]
        local_data_path = repo_root / "data"

        self.providers: Dict[str, DataProvider] = {
            "statsbomb": StatsBombProvider(),
            "local": LocalJsonProvider(data_dir=str(local_data_path))
        }
        self.default_provider = default_provider if default_provider in self.providers else "local"

    def _get_provider(self, provider: Optional[str]) -> DataProvider:
        provider_name = provider or self.default_provider
        provider_instance = self.providers.get(provider_name)
        if not provider_instance:
            logger.error("Provider not found: %s", provider_name)
            raise ValueError(f"Unknown provider: {provider_name}")
        return provider_instance

    async def get_matches(self, competition: str = "", season: str = "", provider: Optional[str] = None) -> List[Match]:
        return await self._get_provider(provider).fetch_matches(competition, season)

    async def get_all_matches(self, provider: Optional[str] = None) -> List[Match]:
        return await self._get_provider(provider).fetch_all_matches()

    async def get_match_by_id(self, match_id: str, provider: Optional[str] = None) -> Optional[Match]:
        return await self._get_provider(provider).fetch_match_by_id(match_id)

    async def get_teams(self, competition: str = "", provider: Optional[str] = None) -> List[Team]:
        return await self._get_provider(provider).fetch_teams(competition)

    async def get_team_by_id(self, team_id: str, provider: Optional[str] = None) -> Optional[Team]:
        return await self._get_provider(provider).fetch_team_by_id(team_id)

    async def get_players(self, team_id: str, provider: Optional[str] = None) -> List[Player]:
        return await self._get_provider(provider).fetch_players(team_id)

    async def get_live_events(self, match_id: str, provider: Optional[str] = None) -> List[LiveEvent]:
        return await self._get_provider(provider).fetch_live_events(match_id)

    async def get_all_events(self, provider: Optional[str] = None) -> List[LiveEvent]:
        return await self._get_provider(provider).fetch_all_events()

    async def get_lineups(self, match_id: str, provider: Optional[str] = None) -> List[Lineup]:
        return await self._get_provider(provider).fetch_lineups(match_id)

    async def get_tactical_frames(self, match_id: str, provider: Optional[str] = None) -> List[TacticalFrame]:
        return await self._get_provider(provider).fetch_tactical_frames(match_id)

    async def get_player_stats(self, match_id: str, provider: Optional[str] = None) -> List[PlayerStats]:
        return await self._get_provider(provider).fetch_player_stats(match_id)
