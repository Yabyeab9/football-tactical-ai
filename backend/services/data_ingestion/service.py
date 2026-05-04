from __future__ import annotations

import asyncio
import json
import logging
from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod

import httpx
from pydantic import BaseModel

from backend.core.settings import settings
from backend.models.schemas import Match, Team, Player, LiveEvent, Lineup, TacticalFrame, PlayerStats


logger = logging.getLogger(__name__)


class DataProvider(ABC):
    @abstractmethod
    async def fetch_matches(self, competition: str, season: str) -> List[Match]:
        pass

    @abstractmethod
    async def fetch_teams(self, competition: str) -> List[Team]:
        pass

    @abstractmethod
    async def fetch_players(self, team_id: str) -> List[Player]:
        pass

    @abstractmethod
    async def fetch_live_events(self, match_id: str) -> List[LiveEvent]:
        pass

    @abstractmethod
    async def fetch_lineups(self, match_id: str) -> List[Lineup]:
        pass

    @abstractmethod
    async def fetch_tactical_frames(self, match_id: str) -> List[TacticalFrame]:
        pass

    @abstractmethod
    async def fetch_player_stats(self, match_id: str) -> List[PlayerStats]:
        pass


class StatsBombProvider(DataProvider):
    def __init__(self):
        self.base_url = "https://raw.githubusercontent.com/statsbomb/open-data/master/data"
        self.client = httpx.AsyncClient(timeout=30.0)

    async def fetch_matches(self, competition: str, season: str) -> List[Match]:
        # Mock implementation - in reality, fetch from StatsBomb API
        url = f"{self.base_url}/matches/{competition}/{season}.json"
        response = await self.client.get(url)
        if response.status_code != 200:
            logger.error(f"Failed to fetch matches: {response.status_code}")
            return []
        data = response.json()
        return [Match(**match) for match in data]

    async def fetch_teams(self, competition: str) -> List[Team]:
        # Implement similarly
        return []

    async def fetch_players(self, team_id: str) -> List[Player]:
        return []

    async def fetch_live_events(self, match_id: str) -> List[LiveEvent]:
        return []

    async def fetch_lineups(self, match_id: str) -> List[Lineup]:
        return []

    async def fetch_tactical_frames(self, match_id: str) -> List[TacticalFrame]:
        return []

    async def fetch_player_stats(self, match_id: str) -> List[PlayerStats]:
        return []


class LocalJsonProvider(DataProvider):
    def __init__(self, data_dir: str = "./data"):
        self.data_dir = data_dir

    async def fetch_matches(self, competition: str, season: str) -> List[Match]:
        # Load from local JSON files
        file_path = f"{self.data_dir}/matches_{competition}_{season}.json"
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            return [Match(**match) for match in data]
        except FileNotFoundError:
            logger.warning(f"Local data file not found: {file_path}")
            return []

    # Implement other methods similarly


class DataIngestionService:
    def __init__(self):
        self.providers: Dict[str, DataProvider] = {
            "statsbomb": StatsBombProvider(),
            "local": LocalJsonProvider(),
        }
        self.default_provider = "statsbomb"

    async def get_matches(self, competition: str, season: str, provider: Optional[str] = None) -> List[Match]:
        provider_name = provider or self.default_provider
        provider_instance = self.providers.get(provider_name)
        if not provider_instance:
            raise ValueError(f"Unknown provider: {provider_name}")
        return await provider_instance.fetch_matches(competition, season)

    async def get_teams(self, competition: str, provider: Optional[str] = None) -> List[Team]:
        provider_name = provider or self.default_provider
        provider_instance = self.providers.get(provider_name)
        if not provider_instance:
            raise ValueError(f"Unknown provider: {provider_name}")
        return await provider_instance.fetch_teams(competition)

    async def get_players(self, team_id: str, provider: Optional[str] = None) -> List[Player]:
        provider_name = provider or self.default_provider
        provider_instance = self.providers.get(provider_name)
        if not provider_instance:
            raise ValueError(f"Unknown provider: {provider_name}")
        return await provider_instance.fetch_players(team_id)

    async def get_live_events(self, match_id: str, provider: Optional[str] = None) -> List[LiveEvent]:
        provider_name = provider or self.default_provider
        provider_instance = self.providers.get(provider_name)
        if not provider_instance:
            raise ValueError(f"Unknown provider: {provider_name}")
        return await provider_instance.fetch_live_events(match_id)

    async def get_lineups(self, match_id: str, provider: Optional[str] = None) -> List[Lineup]:
        provider_name = provider or self.default_provider
        provider_instance = self.providers.get(provider_name)
        if not provider_instance:
            raise ValueError(f"Unknown provider: {provider_name}")
        return await provider_instance.fetch_lineups(match_id)

    async def get_tactical_frames(self, match_id: str, provider: Optional[str] = None) -> List[TacticalFrame]:
        provider_name = provider or self.default_provider
        provider_instance = self.providers.get(provider_name)
        if not provider_instance:
            raise ValueError(f"Unknown provider: {provider_name}")
        return await provider_instance.fetch_tactical_frames(match_id)

    async def get_player_stats(self, match_id: str, provider: Optional[str] = None) -> List[PlayerStats]:
        provider_name = provider or self.default_provider
        provider_instance = self.providers.get(provider_name)
        if not provider_instance:
            raise ValueError(f"Unknown provider: {provider_name}")
        return await provider_instance.fetch_player_stats(match_id)