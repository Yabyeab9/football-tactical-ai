from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any

import httpx
from pydantic import BaseModel

from backend.core.settings import settings
from backend.models.schemas import TacticalSummary, SearchResult
from backend.services.data_ingestion.service import DataIngestionService


logger = logging.getLogger(__name__)


class AIService:
    def __init__(self, data_service: DataIngestionService):
        self.data_service = data_service
        self.client = httpx.AsyncClient(timeout=60.0)
        self.gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        self.api_key = settings.openai_api_key  # Assuming Gemini uses similar key

    async def generate_tactical_summary(self, match_id: str) -> TacticalSummary:
        # Fetch match data
        match = await self.data_service.get_matches("", "")  # Simplified
        events = await self.data_service.get_live_events(match_id)

        # Prepare prompt
        prompt = f"""
        Analyze the following football match events and provide a tactical summary:

        Match: {match_id}
        Events: {json.dumps([event.dict() for event in events[:50]], default=str)}

        Provide:
        1. Overall tactical summary
        2. Key insights (3-5 points)
        """

        response = await self.client.post(
            self.gemini_url,
            json={"contents": [{"parts": [{"text": prompt}]}]},
            params={"key": self.api_key}
        )

        if response.status_code != 200:
            logger.error(f"Gemini API error: {response.status_code}")
            return TacticalSummary(
                match_id=match_id,
                summary="Unable to generate summary",
                key_insights=[],
                generated_at=datetime.utcnow()
            )

        payload = response.json()
        summary_text = payload.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "No summary generated")
        insights = summary_text.split("\n")[-5:]  # Extract insights

        return TacticalSummary(
            match_id=match_id,
            summary=summary_text,
            key_insights=insights,
            generated_at=datetime.utcnow()
        )

    async def search_tactics(self, query: str) -> List[SearchResult]:
        # Simplified semantic search
        # In reality, use embeddings and vector search
        matches = await self.data_service.get_matches("", "")
        results = []

        for match in matches[:10]:  # Limit for demo
            if "high-press" in query.lower() and "pressing" in str(match):
                results.append(SearchResult(
                    match_id=match.id,
                    relevance_score=0.8,
                    tactical_style="High Press",
                    description="Match featuring high pressing tactics"
                ))

        return results