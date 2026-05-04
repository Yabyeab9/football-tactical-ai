from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Optional

from backend.models.schemas import Match, Team, Player, LiveEvent, Lineup, TacticalFrame, PlayerStats


class DataProvider(ABC):
    @abstractmethod
    async def fetch_matches(self, competition: str, season: str) -> List[Match]:
        pass

    @abstractmethod
    async def fetch_match_by_id(self, match_id: str) -> Optional[Match]:
        pass

    @abstractmethod
    async def fetch_all_matches(self) -> List[Match]:
        pass

    @abstractmethod
    async def fetch_teams(self, competition: str = "") -> List[Team]:
        pass

    @abstractmethod
    async def fetch_team_by_id(self, team_id: str) -> Optional[Team]:
        pass

    @abstractmethod
    async def fetch_players(self, team_id: str) -> List[Player]:
        pass

    @abstractmethod
    async def fetch_live_events(self, match_id: str) -> List[LiveEvent]:
        pass

    @abstractmethod
    async def fetch_all_events(self) -> List[LiveEvent]:
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
