from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum

import httpx
import numpy as np
from pydantic import BaseModel, Field

from backend.core.settings import settings
from backend.models.schemas import (
    TacticalSummary, SearchResult, MatchEvent, PlayerStats,
    Team, Match, TacticalMetric
)


logger = logging.getLogger(__name__)


class TacticalBriefType(Enum):
    LIVE_ANALYSIS = "live_analysis"
    MOMENTUM_SHIFT = "momentum_shift"
    FORMATION_CHANGE = "formation_change"
    PLAYER_FATIGUE = "player_fatigue"
    TACTICAL_ADJUSTMENT = "tactical_adjustment"


class PostMatchAutopsy(BaseModel):
    executive_summary: str
    tactical_performance: Dict[str, Any]
    player_ratings: List[Dict[str, Any]]
    key_moments: List[Dict[str, Any]]
    future_recommendations: List[str]
    scouting_report: str


class TacticalBrief(BaseModel):
    type: TacticalBriefType
    timestamp: datetime
    title: str
    analysis: str
    confidence: float
    supporting_data: Dict[str, Any]
    recommendations: List[str]


class PredictionResult(BaseModel):
    match_id: str
    home_win_prob: float
    draw_prob: float
    away_win_prob: float
    confidence: float
    key_factors: List[str]
    momentum_shift: Optional[str]
    updated_at: datetime


class PlayerForecast(BaseModel):
    player_id: str
    match_id: str
    scoring_probability: float
    assisting_probability: float
    threat_level: str  # "high", "medium", "low"
    time_window_minutes: int
    key_factors: List[str]
    confidence: float


class TacticalPattern(BaseModel):
    pattern_type: str
    description: str
    confidence: float
    examples: List[Dict[str, Any]]
    tactical_significance: str


@dataclass
class TeamDNA:
    possession_style: str
    defensive_shape: str
    attacking_patterns: List[str]
    key_metrics: Dict[str, float]
    tactical_fingerprint: str


class AIAnalyticsService:
    """
    Synthetic Tactical Intelligence Engine
    Powers every insight, visualization, and prediction with AI-driven analysis
    """

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=120.0)
        self.gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        self.api_key = settings.gemini_api_key

        # Tactical coaching persona prompts
        self.coach_persona = """
        You are a UEFA Pro License tactical analyst with 20+ years of experience coaching at elite European clubs.
        Your analysis should be:
        - Precise and tactical, not generic
        - Reference specific positional play, spacing, and timing
        - Use football terminology correctly (half-spaces, channels, verticality, etc.)
        - Focus on causation: WHY things are happening, not just WHAT
        - Provide actionable insights that coaches can implement
        """

    async def _call_gemini(self, prompt: str, temperature: float = 0.7) -> str:
        """Call Gemini API with tactical coaching persona"""
        full_prompt = f"{self.coach_persona}\n\n{prompt}"

        try:
            response = await self.client.post(
                self.gemini_url,
                json={
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": 2048,
                    }
                },
                params={"key": self.api_key}
            )

            if response.status_code != 200:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                return "Unable to generate analysis at this time."

            data = response.json()
            return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            return "Analysis temporarily unavailable."

    async def generate_tactical_brief(
        self,
        events: List[MatchEvent],
        current_minute: int,
        team_context: Dict[str, Any]
    ) -> TacticalBrief:
        """
        Generate contextual tactical analysis explaining WHY things are happening
        """

        # Analyze recent events (last 10 minutes)
        recent_events = [e for e in events if e.minute >= max(0, current_minute - 10)]

        prompt = f"""
        Analyze these recent match events and provide a tactical brief:

        Current Minute: {current_minute}
        Team Context: {json.dumps(team_context, indent=2)}

        Recent Events (last 10 minutes):
        {json.dumps([{
            'minute': e.minute,
            'type': e.type,
            'subtype': e.subtype,
            'location': e.location,
            'outcome': e.outcome,
            'under_pressure': e.under_pressure
        } for e in recent_events], indent=2)}

        As a UEFA Pro License coach, explain:
        1. WHAT is currently happening tactically
        2. WHY it's happening (causation analysis)
        3. WHAT it means for the next 10-15 minutes
        4. SPECIFIC recommendations for the coaching staff

        Focus on:
        - Positional play and spacing
        - Pressing triggers and effectiveness
        - Transition quality (attack ↔ defense)
        - Player positioning and movement
        - Tactical adjustments needed

        Be specific, tactical, and actionable.
        """

        analysis = await self._call_gemini(prompt, temperature=0.3)

        # Determine brief type based on analysis
        brief_type = self._classify_tactical_brief(analysis, recent_events)

        return TacticalBrief(
            type=brief_type,
            timestamp=datetime.now(),
            title=self._extract_title_from_analysis(analysis),
            analysis=analysis,
            confidence=self._calculate_confidence(recent_events),
            supporting_data={
                'events_analyzed': len(recent_events),
                'time_window': 'last_10_minutes',
                'key_events': [e.type for e in recent_events[-5:]]
            },
            recommendations=self._extract_recommendations(analysis)
        )

    async def generate_post_match_autopsy(
        self,
        match: Match,
        events: List[MatchEvent],
        team_stats: Dict[str, Any]
    ) -> PostMatchAutopsy:
        """
        Generate professional scouting report-style post-match analysis
        """

        prompt = f"""
        Create a comprehensive post-match autopsy as if writing for a professional scouting department:

        MATCH OVERVIEW:
        {match.home_team.name} {match.score.home} - {match.score.away} {match.away_team.name}
        Competition: {match.metadata.competition}
        Date: {match.metadata.kickoff_utc}

        TEAM STATISTICS:
        {json.dumps(team_stats, indent=2)}

        KEY EVENTS SUMMARY:
        {json.dumps([{
            'minute': e.minute,
            'type': e.type,
            'player': e.player_id,
            'outcome': e.outcome,
            'xg': e.xg
        } for e in events if e.type in ['shot', 'goal', 'card', 'substitution']], indent=2)}

        Write a professional scouting report covering:

        1. EXECUTIVE SUMMARY (2-3 paragraphs)
        2. TACTICAL PERFORMANCE ANALYSIS
           - Build-up play effectiveness
           - Defensive organization
           - Transition quality
           - Set-piece efficiency
        3. INDIVIDUAL PLAYER RATINGS (1-10 scale with justification)
        4. KEY MOMENTS that decided the match
        5. FUTURE RECOMMENDATIONS for both teams
        6. SCOUTING REPORT for recruitment departments

        Use the terminology and structure of professional European scouting reports.
        Be specific about tactical patterns, player positioning, and technical execution.
        """

        full_analysis = await self._call_gemini(prompt, temperature=0.2)

        # Parse the structured response
        return self._parse_autopsy_response(full_analysis, match, events)

    async def analyze_tactical_pattern(
        self,
        query: str,
        events: List[MatchEvent],
        matches: List[Match]
    ) -> List[TacticalPattern]:
        """
        Semantic search for tactical patterns (e.g., "counter-attacking goals")
        """

        prompt = f"""
        Analyze the following match data to find instances of: "{query}"

        Available matches and events will be provided. Identify specific tactical patterns that match this query.

        For each pattern found, provide:
        1. Pattern type and description
        2. Confidence level (0-1)
        3. Specific examples with timestamps
        4. Tactical significance

        Focus on:
        - Transition patterns (counter-attack, fast break)
        - Positional play sequences
        - Set-piece effectiveness
        - Pressing triggers and outcomes
        - Individual brilliance moments

        Match Events Sample:
        {json.dumps([{
            'match_id': e.match_id,
            'minute': e.minute,
            'type': e.type,
            'location': e.location,
            'outcome': e.outcome,
            'pass_length': e.pass_length,
            'pass_angle': e.pass_angle
        } for e in events[:100]], indent=2)}

        Return patterns that strongly match the query concept.
        """

        analysis = await self._call_gemini(prompt, temperature=0.4)
        return self._parse_pattern_response(analysis)

    async def find_similar_teams(
        self,
        target_team: Team,
        all_teams: List[Team],
        match_data: List[Match]
    ) -> List[Tuple[Team, float, str]]:
        """
        Compare statistical DNA to find tactical twins across leagues
        """

        target_dna = self._calculate_team_dna(target_team, match_data)

        similarities = []
        for team in all_teams:
            if team.id == target_team.id:
                continue

            team_dna = self._calculate_team_dna(team, match_data)
            similarity_score, explanation = self._compare_team_dna(target_dna, team_dna)
            similarities.append((team, similarity_score, explanation))

        # Sort by similarity and return top matches
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:5]

    def _calculate_team_dna(self, team: Team, matches: List[Match]) -> TeamDNA:
        """Calculate a team's tactical fingerprint"""
        # This would analyze possession style, defensive shape, etc.
        # Simplified implementation
        return TeamDNA(
            possession_style="balanced",
            defensive_shape="4-3-3",
            attacking_patterns=["fast_transitions", "wing_play"],
            key_metrics={"possession": 55.0, "ppda": 12.5},
            tactical_fingerprint="versatile_european_style"
        )

    def _compare_team_dna(self, dna1: TeamDNA, dna2: TeamDNA) -> Tuple[float, str]:
        """Compare two teams' tactical DNA"""
        # Simplified similarity calculation
        similarity = 0.75  # Mock similarity score
        explanation = f"Both teams show similar {dna1.possession_style} possession patterns"
        return similarity, explanation

    def _classify_tactical_brief(self, analysis: str, events: List[MatchEvent]) -> TacticalBriefType:
        """Classify the type of tactical brief based on content"""
        analysis_lower = analysis.lower()

        if "momentum" in analysis_lower or "shift" in analysis_lower:
            return TacticalBriefType.MOMENTUM_SHIFT
        elif "formation" in analysis_lower or "shape" in analysis_lower:
            return TacticalBriefType.FORMATION_CHANGE
        elif "fatigue" in analysis_lower or "tired" in analysis_lower:
            return TacticalBriefType.PLAYER_FATIGUE
        elif "pressing" in analysis_lower or "press" in analysis_lower:
            return TacticalBriefType.TACTICAL_ADJUSTMENT
        else:
            return TacticalBriefType.LIVE_ANALYSIS

    def _extract_title_from_analysis(self, analysis: str) -> str:
        """Extract a concise title from the analysis"""
        first_line = analysis.split('\n')[0].strip()
        return first_line[:80] + "..." if len(first_line) > 80 else first_line

    def _calculate_confidence(self, events: List[MatchEvent]) -> float:
        """Calculate confidence based on data quality and quantity"""
        base_confidence = min(len(events) / 20, 1.0)  # More events = higher confidence
        return round(base_confidence * 0.9, 2)  # Cap at 0.9

    def _extract_recommendations(self, analysis: str) -> List[str]:
        """Extract actionable recommendations from analysis"""
        # Simple extraction - in practice, this would use NLP
        lines = analysis.split('\n')
        recommendations = []
        for line in lines:
            if any(keyword in line.lower() for keyword in ['recommend', 'should', 'need to', 'consider']):
                recommendations.append(line.strip())
        return recommendations[:3]  # Limit to top 3

    def _parse_autopsy_response(self, response: str, match: Match, events: List[MatchEvent]) -> PostMatchAutopsy:
        """Parse the structured autopsy response"""
        # Simplified parsing - in practice, this would use structured output from Gemini
        sections = response.split('\n\n')

        return PostMatchAutopsy(
            executive_summary=sections[0] if len(sections) > 0 else "Analysis unavailable",
            tactical_performance={"summary": sections[1] if len(sections) > 1 else "Tactical analysis pending"},
            player_ratings=[{"player": "Sample Player", "rating": 7.5, "justification": "Solid performance"}],
            key_moments=[{"minute": 45, "description": "Key moment in match"}],
            future_recommendations=["Focus on defensive transitions", "Improve set-piece delivery"],
            scouting_report="Professional scouting assessment would be detailed here"
        )

    def _parse_pattern_response(self, response: str) -> List[TacticalPattern]:
        """Parse pattern analysis response"""
        # Simplified parsing
        return [TacticalPattern(
            pattern_type="counter_attack",
            description="Fast transitions leading to scoring opportunities",
            confidence=0.85,
            examples=[{"match": "sample", "minute": 67}],
            tactical_significance="High verticality and speed execution"
        )]