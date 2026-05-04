from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple, Set
from dataclasses import dataclass
from enum import Enum
import json

import numpy as np
from pydantic import BaseModel

from backend.models.schemas import MatchEvent, Match, Team, PlayerStats
from backend.services.ai.analytics_service import AIAnalyticsService, TacticalPattern


logger = logging.getLogger(__name__)


class SearchConcept(Enum):
    COUNTER_ATTACK = "counter_attack"
    FAST_BREAK = "fast_break"
    SET_PIECE = "set_piece"
    PRESSING_TRAP = "pressing_trap"
    WING_PLAY = "wing_play"
    CENTRAL_OVERLOAD = "central_overload"
    TRANSITION_MOMENT = "transition_moment"
    INDIVIDUAL_BRILLIANCE = "individual_brilliance"
    TACTICAL_FOUL = "tactical_foul"
    DEFENSIVE_ORGANIZATION = "defensive_organization"


@dataclass
class SearchResult:
    """Enhanced search result with tactical context"""
    match_id: str
    timestamp: datetime
    description: str
    confidence: float
    tactical_context: Dict[str, Any]
    key_events: List[Dict[str, Any]]
    video_timestamp: Optional[int] = None


@dataclass
class TeamFingerprint:
    """Tactical DNA fingerprint of a team"""
    team_id: str
    possession_style: str
    defensive_organization: str
    attacking_patterns: List[str]
    transition_quality: str
    key_metrics: Dict[str, float]
    tactical_signature: str


class TacticalSearchEngine:
    """
    Semantic tactical search and pattern recognition engine
    Finds tactical concepts and similar team styles across the database
    """

    def __init__(self, ai_service: AIAnalyticsService):
        self.ai_service = ai_service

        # Tactical concept patterns
        self.concept_patterns = {
            SearchConcept.COUNTER_ATTACK: {
                'keywords': ['counter', 'fast break', 'transition', 'verticality'],
                'event_sequence': ['recovery', 'pass', 'dribble', 'shot'],
                'time_window': 30,  # seconds
                'spatial_pattern': 'defensive_third_to_attacking_third'
            },
            SearchConcept.SET_PIECE: {
                'keywords': ['corner', 'free kick', 'throw', 'cross'],
                'event_types': ['set_piece', 'cross', 'shot'],
                'spatial_focus': 'penalty_area'
            },
            SearchConcept.PRESSING_TRAP: {
                'keywords': ['press', 'trap', 'high line', 'gegenpressing'],
                'event_sequence': ['press', 'recovery', 'counter'],
                'formation_trigger': 'opponent_buildup'
            },
            SearchConcept.WING_PLAY: {
                'keywords': ['wing', 'overlap', 'cutback', 'channel'],
                'spatial_pattern': 'sideline_to_penalty_area',
                'player_positions': ['LW', 'RW', 'LB', 'RB']
            }
        }

    async def semantic_search(
        self,
        query: str,
        events: List[MatchEvent],
        matches: List[Match],
        limit: int = 20
    ) -> List[SearchResult]:
        """
        Search for tactical concepts using semantic understanding
        """

        # Parse the query to understand the tactical concept
        concept = self._parse_tactical_concept(query)

        if concept:
            # Use predefined patterns for known concepts
            return await self._search_concept_patterns(concept, events, matches, limit)
        else:
            # Use AI-powered semantic search for novel queries
            return await self._ai_powered_search(query, events, matches, limit)

    async def find_similar_tactical_styles(
        self,
        target_team: Team,
        all_teams: List[Team],
        matches: List[Match],
        events: List[MatchEvent]
    ) -> List[Tuple[Team, float, Dict[str, Any]]]:
        """
        Find teams with similar tactical DNA
        """

        # Generate fingerprints for all teams
        fingerprints = {}
        for team in all_teams:
            team_matches = [m for m in matches if m.home_team.id == team.id or m.away_team.id == team.id]
            team_events = [e for e in events if any(m.home_team.id == team.id or m.away_team.id == team.id for m in team_matches)]
            fingerprints[team.id] = await self._generate_team_fingerprint(team, team_matches, team_events)

        target_fingerprint = fingerprints[target_team.id]

        # Calculate similarities
        similarities = []
        for team in all_teams:
            if team.id == target_team.id:
                continue

            similarity_score, similarity_factors = self._compare_fingerprints(
                target_fingerprint, fingerprints[team.id]
            )
            similarities.append((team, similarity_score, similarity_factors))

        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:10]

    async def detect_tactical_anomalies(
        self,
        match: Match,
        events: List[MatchEvent],
        current_minute: int
    ) -> List[Dict[str, Any]]:
        """
        Detect tactical anomalies that should trigger UI alerts
        """

        anomalies = []

        # Check for formation changes
        formation_anomaly = self._detect_formation_change(events, current_minute)
        if formation_anomaly:
            anomalies.append(formation_anomaly)

        # Check for pressing effectiveness drops
        pressing_anomaly = self._detect_pressing_anomaly(events, current_minute)
        if pressing_anomaly:
            anomalies.append(pressing_anomaly)

        # Check for player positioning anomalies
        positioning_anomaly = self._detect_positioning_anomaly(events, current_minute)
        if positioning_anomaly:
            anomalies.append(positioning_anomaly)

        # Check for momentum shifts
        momentum_anomaly = self._detect_momentum_shift_anomaly(events, current_minute)
        if momentum_anomaly:
            anomalies.append(momentum_anomaly)

        return anomalies

    def _parse_tactical_concept(self, query: str) -> Optional[SearchConcept]:
        """Parse natural language query to identify tactical concept"""
        query_lower = query.lower()

        concept_mappings = {
            SearchConcept.COUNTER_ATTACK: ['counter', 'fast break', 'transition attack', 'gegenpress break'],
            SearchConcept.FAST_BREAK: ['fast break', 'quick counter', 'lightning break'],
            SearchConcept.SET_PIECE: ['set piece', 'corner', 'free kick', 'throw in'],
            SearchConcept.PRESSING_TRAP: ['pressing', 'gegenpress', 'high press', 'trap'],
            SearchConcept.WING_PLAY: ['wing play', 'overlaps', 'cutbacks', 'channel runs'],
            SearchConcept.CENTRAL_OVERLOAD: ['central overload', 'numerical superiority', 'central area'],
            SearchConcept.TRANSITION_MOMENT: ['transition', 'turnover', 'recovery'],
            SearchConcept.INDIVIDUAL_BRILLIANCE: ['individual', 'brilliance', 'skill', 'dribble'],
            SearchConcept.TACTICAL_FOUL: ['tactical foul', 'professional foul', 'prevent goal'],
            SearchConcept.DEFENSIVE_ORGANIZATION: ['defensive shape', 'organization', 'compactness']
        }

        for concept, keywords in concept_mappings.items():
            if any(keyword in query_lower for keyword in keywords):
                return concept

        return None

    async def _search_concept_patterns(
        self,
        concept: SearchConcept,
        events: List[MatchEvent],
        matches: List[Match],
        limit: int
    ) -> List[SearchResult]:
        """Search using predefined tactical patterns"""

        pattern = self.concept_patterns.get(concept)
        if not pattern:
            return []

        results = []

        # Group events by match
        match_events = {}
        for event in events:
            if event.match_id not in match_events:
                match_events[event.match_id] = []
            match_events[event.match_id].append(event)

        for match_id, match_event_list in match_events.items():
            # Sort events by time
            match_event_list.sort(key=lambda e: e.minute * 60 + (e.second or 0))

            # Look for pattern matches
            pattern_matches = self._find_pattern_matches(match_event_list, pattern)

            for match_data in pattern_matches:
                result = SearchResult(
                    match_id=match_id,
                    timestamp=datetime.now(),  # Would use actual event time
                    description=self._generate_pattern_description(concept, match_data),
                    confidence=match_data.get('confidence', 0.8),
                    tactical_context={
                        'concept': concept.value,
                        'pattern_type': pattern.get('spatial_pattern', 'general'),
                        'key_events': match_data.get('events', [])
                    },
                    key_events=match_data.get('events', [])
                )
                results.append(result)

        # Sort by confidence and limit results
        results.sort(key=lambda r: r.confidence, reverse=True)
        return results[:limit]

    async def _ai_powered_search(
        self,
        query: str,
        events: List[MatchEvent],
        matches: List[Match],
        limit: int
    ) -> List[SearchResult]:
        """Use AI to understand and search for novel tactical concepts"""

        # Use the AI service to find patterns
        patterns = await self.ai_service.analyze_tactical_pattern(query, events, matches)

        results = []
        for pattern in patterns:
            for example in pattern.examples:
                result = SearchResult(
                    match_id=example.get('match_id', 'unknown'),
                    timestamp=datetime.now(),
                    description=f"{pattern.description} - {example.get('description', '')}",
                    confidence=pattern.confidence,
                    tactical_context={
                        'pattern_type': pattern.pattern_type,
                        'significance': pattern.tactical_significance
                    },
                    key_events=[example]
                )
                results.append(result)

        return results[:limit]

    def _find_pattern_matches(self, events: List[MatchEvent], pattern: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find sequences that match tactical patterns"""
        matches = []

        # Simple sequence matching (could be much more sophisticated)
        event_types = [e.type for e in events]

        if 'event_sequence' in pattern:
            sequence = pattern['event_sequence']
            for i in range(len(event_types) - len(sequence) + 1):
                if event_types[i:i+len(sequence)] == sequence:
                    match_events = events[i:i+len(sequence)]
                    matches.append({
                        'events': [{
                            'type': e.type,
                            'minute': e.minute,
                            'location': e.location,
                            'outcome': e.outcome
                        } for e in match_events],
                        'confidence': 0.85,
                        'start_minute': match_events[0].minute,
                        'end_minute': match_events[-1].minute
                    })

        return matches

    def _generate_pattern_description(self, concept: SearchConcept, match_data: Dict[str, Any]) -> str:
        """Generate human-readable description of pattern match"""
        descriptions = {
            SearchConcept.COUNTER_ATTACK: f"Counter-attack sequence from minute {match_data.get('start_minute')} to {match_data.get('end_minute')}",
            SearchConcept.SET_PIECE: f"Set piece opportunity at minute {match_data.get('start_minute')}",
            SearchConcept.PRESSING_TRAP: f"Pressing trap executed at minute {match_data.get('start_minute')}",
            SearchConcept.WING_PLAY: f"Wing play sequence from minute {match_data.get('start_minute')} to {match_data.get('end_minute')}"
        }

        return descriptions.get(concept, f"Tactical pattern detected at minute {match_data.get('start_minute')}")

    async def _generate_team_fingerprint(
        self,
        team: Team,
        matches: List[Match],
        events: List[MatchEvent]
    ) -> TeamFingerprint:
        """Generate a tactical fingerprint for a team"""

        # Analyze possession style
        possession_stats = self._analyze_possession_style(matches)
        possession_style = "high_possession" if possession_stats['avg_possession'] > 60 else "balanced"

        # Analyze defensive organization
        defensive_stats = self._analyze_defensive_organization(events)
        defensive_organization = "compact" if defensive_stats['avg_ppda'] < 12 else "high_line"

        # Analyze attacking patterns
        attacking_patterns = self._analyze_attacking_patterns(events)

        # Analyze transition quality
        transition_quality = self._analyze_transition_quality(events)

        # Key metrics
        key_metrics = {
            'possession': possession_stats['avg_possession'],
            'ppda': defensive_stats['avg_ppda'],
            'pass_accuracy': self._calculate_pass_accuracy(events),
            'shots_per_game': self._calculate_shots_per_game(matches, events)
        }

        # Generate tactical signature
        tactical_signature = f"{possession_style}_{defensive_organization}_{transition_quality}"

        return TeamFingerprint(
            team_id=team.id,
            possession_style=possession_style,
            defensive_organization=defensive_organization,
            attacking_patterns=attacking_patterns,
            transition_quality=transition_quality,
            key_metrics=key_metrics,
            tactical_signature=tactical_signature
        )

    def _compare_fingerprints(
        self,
        fp1: TeamFingerprint,
        fp2: TeamFingerprint
    ) -> Tuple[float, Dict[str, Any]]:
        """Compare two team fingerprints for similarity"""

        similarity_score = 0.0
        factors = {}

        # Possession style similarity
        if fp1.possession_style == fp2.possession_style:
            similarity_score += 0.25
            factors['possession_style'] = f"Both play {fp1.possession_style}"

        # Defensive organization similarity
        if fp1.defensive_organization == fp2.defensive_organization:
            similarity_score += 0.25
            factors['defensive_style'] = f"Similar {fp1.defensive_organization} defending"

        # Attacking patterns overlap
        pattern_overlap = len(set(fp1.attacking_patterns) & set(fp2.attacking_patterns))
        pattern_similarity = pattern_overlap / max(len(fp1.attacking_patterns), 1)
        similarity_score += pattern_similarity * 0.25
        factors['attacking_patterns'] = f"{pattern_overlap} overlapping attacking patterns"

        # Key metrics similarity
        metrics_similarity = self._compare_metrics(fp1.key_metrics, fp2.key_metrics)
        similarity_score += metrics_similarity * 0.25
        factors['metrics'] = f"Statistical similarity: {metrics_similarity:.2f}"

        return similarity_score, factors

    def _analyze_possession_style(self, matches: List[Match]) -> Dict[str, float]:
        """Analyze team's possession style"""
        # Simplified analysis
        possessions = []
        for match in matches:
            # Mock possession data - in reality would come from match stats
            possessions.append(55.0)  # Mock value

        return {
            'avg_possession': np.mean(possessions),
            'possession_consistency': np.std(possessions)
        }

    def _analyze_defensive_organization(self, events: List[MatchEvent]) -> Dict[str, float]:
        """Analyze defensive organization through PPDA"""
        # Simplified PPDA calculation
        return {'avg_ppda': 11.5}  # Mock value

    def _analyze_attacking_patterns(self, events: List[MatchEvent]) -> List[str]:
        """Identify attacking patterns used by the team"""
        # Simplified pattern detection
        return ['wing_play', 'central_overload', 'fast_transitions']

    def _analyze_transition_quality(self, events: List[MatchEvent]) -> str:
        """Analyze transition quality"""
        # Simplified analysis
        return 'excellent'

    def _calculate_pass_accuracy(self, events: List[MatchEvent]) -> float:
        """Calculate pass accuracy"""
        passes = [e for e in events if e.type == 'pass']
        successful = [p for p in passes if p.outcome == 'successful']
        return len(successful) / len(passes) if passes else 0.0

    def _calculate_shots_per_game(self, matches: List[Match], events: List[MatchEvent]) -> float:
        """Calculate shots per game"""
        shots = [e for e in events if e.type == 'shot']
        return len(shots) / len(matches) if matches else 0.0

    def _compare_metrics(self, metrics1: Dict[str, float], metrics2: Dict[str, float]) -> float:
        """Compare key metrics between teams"""
        similarity = 0.0
        for key in set(metrics1.keys()) & set(metrics2.keys()):
            diff = abs(metrics1[key] - metrics2[key])
            max_val = max(metrics1[key], metrics2[key])
            if max_val > 0:
                similarity += 1 - (diff / max_val)

        return similarity / len(metrics1) if metrics1 else 0.0

    def _detect_formation_change(self, events: List[MatchEvent], current_minute: int) -> Optional[Dict[str, Any]]:
        """Detect formation changes"""
        # Simplified detection - look for substitution patterns that might indicate formation change
        recent_subs = [e for e in events if e.type == 'substitution' and e.minute >= current_minute - 10]

        if len(recent_subs) >= 2:
            return {
                'type': 'formation_change',
                'alert': '⚠️ Potential formation change detected',
                'description': f'Multiple substitutions in last 10 minutes suggest tactical adjustment',
                'confidence': 0.75,
                'recommendation': 'Monitor defensive shape and pressing triggers'
            }

        return None

    def _detect_pressing_anomaly(self, events: List[MatchEvent], current_minute: int) -> Optional[Dict[str, Any]]:
        """Detect drops in pressing effectiveness"""
        # Look for failed recoveries followed by opposition attacks
        recent_events = [e for e in events if e.minute >= current_minute - 5]

        failed_recoveries = [e for e in recent_events if e.type == 'recovery' and e.outcome == 'failed']
        opposition_shots = [e for e in recent_events if e.type == 'shot']

        if len(failed_recoveries) >= 2 and opposition_shots:
            return {
                'type': 'pressing_anomaly',
                'alert': '⚠️ Pressing effectiveness dropping',
                'description': f'Multiple failed recoveries in last 5 minutes',
                'confidence': 0.8,
                'recommendation': 'Consider dropping defensive line or adjusting pressing triggers'
            }

        return None

    def _detect_positioning_anomaly(self, events: List[MatchEvent], current_minute: int) -> Optional[Dict[str, Any]]:
        """Detect unusual player positioning"""
        # Simplified - look for players appearing in unusual positions
        return None  # Not implemented in this simplified version

    def _detect_momentum_shift_anomaly(self, events: List[MatchEvent], current_minute: int) -> Optional[Dict[str, Any]]:
        """Detect significant momentum shifts"""
        recent_events = [e for e in events if e.minute >= current_minute - 3]

        goals = [e for e in recent_events if e.type == 'goal']
        cards = [e for e in recent_events if e.type == 'card' and e.subtype == 'red']

        if goals or cards:
            event_type = 'goal' if goals else 'red card'
            return {
                'type': 'momentum_shift',
                'alert': f'⚡ Momentum shift: {event_type} at {goals[0].minute if goals else cards[0].minute}\'',
                'description': f'Significant momentum change detected',
                'confidence': 0.9,
                'recommendation': 'Monitor opponent reactions and adjust tactics accordingly'
            }

        return None