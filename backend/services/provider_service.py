from __future__ import annotations

import asyncio
import logging
from typing import Any, List, Dict, Optional

from backend.services.api_clients import (
    ApiFootballClient,
    FootballDataClient,
    OpenLigaDBClient,
    TheSportsDBClient
)
from backend.services.provider_manager import provider_manager, ProviderStatus

logger = logging.getLogger(__name__)

class ProviderService:
    """
    Tiered Provider Service with intelligent failover and merging.
    """
    
    TIERS = [
        "api-football",
        "football-data",
        "openligadb",
        "thesportsdb"
    ]

    def __init__(self):
        self.api_football = ApiFootballClient()
        self.football_data = FootballDataClient()
        self.openligadb = OpenLigaDBClient()
        self.thesportsdb = TheSportsDBClient()
        
        self.clients = {
            "api-football": self.api_football,
            "football-data": self.football_data,
            "openligadb": self.openligadb,
            "thesportsdb": self.thesportsdb
        }

    async def get_live_matches_tiered(self) -> List[Dict[str, Any]]:
        """
        Attempts to get live matches from providers in tier order, 
        but also supports merging for maximum coverage.
        """
        results = []
        statuses = []
        
        # In this specific case, we actually want to call all of them to merge data
        # but we track their health.
        tasks = [
            provider_manager.safe_request("api-football", self.api_football.get_live_matches, expected="list"),
            provider_manager.safe_request("football-data", self.football_data.get_matches, expected="list"),
            provider_manager.safe_request("openligadb", self.openligadb.get_current_matches, expected="list"),
            provider_manager.safe_request("thesportsdb", self.thesportsdb.get_live_matches, expected="list"),
        ]
        
        responses = await asyncio.gather(*tasks)
        
        all_matches = []
        for payload, status in responses:
            if status.success:
                all_matches.extend(payload)
            statuses.append(status)
            
        return all_matches, statuses

    async def get_match_details_with_fallback(self, match_id: str, provider_hint: Optional[str] = None) -> Dict[str, Any]:
        """
        Intelligent fallback for specific match details.
        """
        tried = set()
        
        # 1. Try hinted provider first
        if provider_hint and provider_hint in self.clients:
            logger.info(f"Trying hinted provider: {provider_hint}")
            payload, status = await provider_manager.safe_request(
                provider_hint, 
                lambda: self.clients[provider_hint].get_match_details(match_id),
                expected="dict"
            )
            if status.success:
                return payload, status
            tried.add(provider_hint)

        # 2. Try in tier order
        for tier in self.TIERS:
            if tier in tried:
                continue
            
            logger.info(f"Falling back to tier: {tier}")
            # Note: Not all clients have 'get_match_details', need to handle that
            client = self.clients[tier]
            if not hasattr(client, 'get_match_details'):
                continue
                
            payload, status = await provider_manager.safe_request(
                tier,
                lambda: client.get_match_details(match_id),
                expected="dict"
            )
            if status.success:
                return payload, status
            tried.add(tier)
            
        return {}, ProviderStatus(provider="multi", success=False, error="All providers failed")

provider_service = ProviderService()
