from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass
import math
import random

import numpy as np
from pydantic import BaseModel

from backend.models.schemas import Match, MatchEvent, PlayerStats, Team
from backend.services.ai.analytics_service import AIAnalyticsService


logger = logging.getLogger(__name__)


@dataclass
class MomentumFactor:
    """Represents a momentum-shifting event"""
    timestamp: datetime
    type: str  # 'goal', 'red_card', 'substitution', 'injury'
    impact: float  # -1.0 to 1.0 (negative = away team advantage)
    description: str
    decay_rate: float = 0.95  # How quickly impact fades


@dataclass
class ThreatFlowMetrics:
    """Real-time threat assessment for players"""
    player_id: str
    current_threat: float
    recent_actions: List[Dict[str, Any]]
    positional_advantage: float
    fatigue_factor: float
    time_since_last_action: int  # minutes


class PredictionEngine:
    """
    Live predictive modeling for match outcomes and player performance
    Combines statistical modeling with AI-driven insights
    """

    def __init__(self, ai_service: AIAnalyticsService):
        self.ai_service = ai_service
        self.momentum_factors: Dict[str, List[MomentumFactor]] = {}
        self.threat_flow_cache: Dict[str, ThreatFlowMetrics] = {}

    async def calculate_live_probabilities(
        self,
        match: Match,
        events: List[MatchEvent],
        current_minute: int
    ) -> PredictionResult:
        """
        Calculate live win/draw/loss probabilities based on current state
        """

        # Base probabilities from historical data and current form
        base_probs = self._calculate_base_probabilities(match)

        # Adjust for current score
        score_adjustment = self._calculate_score_adjustment(match)

        # Momentum analysis
        momentum_adjustment = self._analyze_momentum(match, events, current_minute)

        # XG-based adjustment
        xg_adjustment = self._calculate_xg_adjustment(match, events)

        # Time remaining factor
        time_factor = self._calculate_time_factor(current_minute)

        # Combine all factors
        final_home_prob = self._combine_probabilities([
            base_probs[0],
            score_adjustment[0],
            momentum_adjustment[0],
            xg_adjustment[0],
            time_factor[0]
        ])

        final_draw_prob = self._combine_probabilities([
            base_probs[1],
            score_adjustment[1],
            momentum_adjustment[1],
            xg_adjustment[1],
            time_factor[1]
        ])

        final_away_prob = self._combine_probabilities([
            base_probs[2],
            score_adjustment[2],
            momentum_adjustment[2],
            xg_adjustment[2],
            time_factor[2]
        ])

        # Normalize probabilities
        total = final_home_prob + final_draw_prob + final_away_prob
        final_home_prob /= total
        final_draw_prob /= total
        final_away_prob /= total

        # Generate key factors explanation
        key_factors = await self._generate_key_factors_explanation(
            match, events, current_minute, momentum_adjustment
        )

        # Detect momentum shifts
        momentum_shift = self._detect_momentum_shift(match.id, events, current_minute)

        return PredictionResult(
            match_id=match.id,
            home_win_prob=round(final_home_prob, 3),
            draw_prob=round(final_draw_prob, 3),
            away_win_prob=round(final_away_prob, 3),
            confidence=self._calculate_prediction_confidence(events, current_minute),
            key_factors=key_factors,
            momentum_shift=momentum_shift,
            updated_at=datetime.now()
        )

    async def forecast_player_performance(
        self,
        player_id: str,
        match_id: str,
        events: List[MatchEvent],
        current_minute: int,
        time_window: int = 15
    ) -> PlayerForecast:
        """
        Predict player's scoring/assisting likelihood in next time window
        """

        # Get current threat flow metrics
        threat_metrics = self._calculate_threat_flow(player_id, events, current_minute)

        # Analyze recent performance patterns
        recent_performance = self._analyze_recent_performance(player_id, events, current_minute)

        # Calculate positional and tactical factors
        positional_factors = self._calculate_positional_factors(player_id, events)

        # Fatigue and freshness assessment
        fatigue_factor = self._assess_fatigue_factor(player_id, events, current_minute)

        # Combine factors for scoring probability
        scoring_prob = self._calculate_scoring_probability(
            threat_metrics, recent_performance, positional_factors, fatigue_factor
        )

        # Combine factors for assisting probability
        assisting_prob = self._calculate_assisting_probability(
            threat_metrics, recent_performance, positional_factors, fatigue_factor
        )

        # Determine threat level
        threat_level = self._determine_threat_level(scoring_prob + assisting_prob)

        # Generate key factors
        key_factors = self._generate_player_forecast_factors(
            threat_metrics, recent_performance, positional_factors, fatigue_factor
        )

        return PlayerForecast(
            player_id=player_id,
            match_id=match_id,
            scoring_probability=round(scoring_prob, 3),
            assisting_probability=round(assisting_prob, 3),
            threat_level=threat_level,
            time_window_minutes=time_window,
            key_factors=key_factors,
            confidence=self._calculate_forecast_confidence(threat_metrics, recent_performance)
        )

    def _calculate_base_probabilities(self, match: Match) -> Tuple[float, float, float]:
        """Calculate base probabilities from team form and historical data"""
        draw_probability = 0.25

        team_label = match.home_team_id.lower() if match.home_team_id else ""
        if "city" in team_label or "united" in team_label:
            home_prob = 0.55
        else:
            home_prob = 0.45

        away_prob = 1.0 - home_prob - draw_probability
        return home_prob, draw_probability, away_prob

    def _calculate_score_adjustment(self, match: Match) -> Tuple[float, float, float]:
        """Adjust probabilities based on current score"""
        home_goals = match.home_score or 0
        away_goals = match.away_score or 0
        goal_diff = home_goals - away_goals

        if goal_diff > 0:
            return 0.1, -0.05, -0.05  # Home advantage increases
        elif goal_diff < 0:
            return -0.05, -0.05, 0.1  # Away advantage increases
        else:
            return -0.02, 0.04, -0.02  # Draw becomes more likely

    def _analyze_momentum(self, match: Match, events: List[MatchEvent], current_minute: int) -> Tuple[float, float, float]:
        """Analyze momentum based on recent events"""
        if match.id not in self.momentum_factors:
            self.momentum_factors[match.id] = []

        recent_events = [e for e in events if e.minute >= current_minute - 5]

        for event in recent_events:
            if event.type == 'goal':
                impact = 0.15 if event.team_id == match.home_team_id else -0.15
                self.momentum_factors[match.id].append(MomentumFactor(
                    timestamp=datetime.now(),
                    type='goal',
                    impact=impact,
                    description=f"Goal scored at {event.minute}'",
                    decay_rate=0.9
                ))
            elif event.type == 'card' and event.subtype == 'red':
                impact = -0.1 if event.team_id == match.home_team_id else 0.1
                self.momentum_factors[match.id].append(MomentumFactor(
                    timestamp=datetime.now(),
                    type='red_card',
                    impact=impact,
                    description=f"Red card at {event.minute}'",
                    decay_rate=0.95
                ))

        # Calculate current momentum
        total_momentum = 0.0
        for factor in self.momentum_factors[match_id]:
            # Apply time decay
            minutes_elapsed = (datetime.now() - factor.timestamp).total_seconds() / 60
            decayed_impact = factor.impact * (factor.decay_rate ** minutes_elapsed)
            total_momentum += decayed_impact

        # Convert momentum to probability adjustments
        momentum_scale = 0.1  # Max adjustment
        momentum_adjustment = np.clip(total_momentum, -momentum_scale, momentum_scale)

        return momentum_adjustment, -momentum_adjustment * 0.5, -momentum_adjustment * 0.5

    def _calculate_xg_adjustment(self, match: Match, events: List[MatchEvent]) -> Tuple[float, float, float]:
        """Adjust probabilities based on expected goals"""
        home_xg = sum(e.xg or 0 for e in events if e.team_id == match.home_team_id)
        away_xg = sum(e.xg or 0 for e in events if e.team_id == match.away_team_id)

        xg_diff = home_xg - away_xg
        adjustment_scale = 0.05

        if xg_diff > 0:
            return min(xg_diff * adjustment_scale, 0.1), -0.02, -min(xg_diff * adjustment_scale, 0.08)
        elif xg_diff < 0:
            return -min(abs(xg_diff) * adjustment_scale, 0.08), -0.02, min(abs(xg_diff) * adjustment_scale, 0.1)
        else:
            return 0.0, 0.0, 0.0

    def _calculate_time_factor(self, current_minute: int) -> Tuple[float, float, float]:
        """Adjust probabilities based on time remaining"""
        if current_minute < 15:
            # Early game - base probabilities dominate
            return 0.0, 0.0, 0.0
        elif current_minute < 75:
            # Mid game - current form matters more
            return 0.02, -0.01, -0.01
        else:
            # Late game - score becomes more important
            return 0.05, -0.03, -0.02

    def _combine_probabilities(self, adjustments: List[float]) -> float:
        """Combine multiple probability adjustments"""
        # Use weighted average with more recent factors weighted higher
        weights = [1.0, 1.2, 1.4, 1.3, 1.1]  # Base, score, momentum, xG, time
        weighted_sum = sum(a * w for a, w in zip(adjustments, weights))
        total_weight = sum(weights)
        return weighted_sum / total_weight

    async def _generate_key_factors_explanation(
        self,
        match: Match,
        events: List[MatchEvent],
        current_minute: int,
        momentum_adjustment: Tuple[float, float, float]
    ) -> List[str]:
        """Generate human-readable key factors"""
        factors = []

        # Score factor
        score_diff = (match.home_score or 0) - (match.away_score or 0)
        if abs(score_diff) >= 2:
            factors.append(f"Significant score advantage ({score_diff:+d})")
        elif score_diff != 0:
            factors.append(f"Current score favors {'home' if score_diff > 0 else 'away'} team")

        # Momentum factor
        momentum_impact = momentum_adjustment[0]
        if abs(momentum_impact) > 0.05:
            direction = "home" if momentum_impact > 0 else "away"
            factors.append(f"Recent momentum shift favors {direction} team")

        # Time factor
        if current_minute > 75:
            factors.append("Limited time remaining increases result uncertainty")

        # XG factor
        home_xg = sum(e.xg or 0 for e in events if e.team_id == events[0].team_id)
        away_xg = sum(e.xg or 0 for e in events if e.team_id != events[0].team_id)
        if abs(home_xg - away_xg) > 0.5:
            better_team = "home" if home_xg > away_xg else "away"
            factors.append(f"xG analysis favors {better_team} team ({home_xg:.1f} vs {away_xg:.1f})")

        return factors or ["Analysis based on current match state"]

    def _detect_momentum_shift(self, match_id: str, events: List[MatchEvent], current_minute: int) -> Optional[str]:
        """Detect significant momentum shifts"""
        recent_events = [e for e in events if e.minute >= current_minute - 10]

        goals = [e for e in recent_events if e.type == 'goal']
        cards = [e for e in recent_events if e.type == 'card' and e.subtype == 'red']

        if goals:
            return f"Momentum shift: Goal scored at {goals[-1].minute}'"
        elif cards:
            return f"Momentum shift: Red card at {cards[-1].minute}'"

        return None

    def _calculate_threat_flow(self, player_id: str, events: List[MatchEvent], current_minute: int) -> ThreatFlowMetrics:
        """Calculate real-time threat flow for a player"""
        player_events = [e for e in events if e.player_id == player_id]

        # Recent actions (last 15 minutes)
        recent_events = [e for e in player_events if e.minute >= current_minute - 15]

        # Calculate threat score based on actions
        threat_score = 0.0
        for event in recent_events:
            if event.type == 'shot':
                threat_score += event.xg or 0.1
            elif event.type == 'pass' and event.outcome == 'successful':
                # Progressive passes add threat
                if event.pass_length and event.pass_length > 20:
                    threat_score += 0.05
            elif event.type == 'dribble' and event.outcome == 'successful':
                threat_score += 0.03

        # Positional advantage (simplified)
        positional_advantage = 0.5  # Mock value

        # Fatigue factor (simplified)
        fatigue_factor = min(current_minute / 90, 1.0)

        # Time since last action
        last_action_minute = max((e.minute for e in player_events), default=0)
        time_since_last = current_minute - last_action_minute

        return ThreatFlowMetrics(
            player_id=player_id,
            current_threat=min(threat_score, 1.0),
            recent_actions=[{
                'type': e.type,
                'minute': e.minute,
                'outcome': e.outcome,
                'xg': e.xg
            } for e in recent_events[-5:]],
            positional_advantage=positional_advantage,
            fatigue_factor=fatigue_factor,
            time_since_last_action=time_since_last
        )

    def _analyze_recent_performance(self, player_id: str, events: List[MatchEvent], current_minute: int) -> Dict[str, Any]:
        """Analyze player's recent performance patterns"""
        player_events = [e for e in events if e.player_id == player_id and e.minute <= current_minute]

        # Last 30 minutes performance
        recent_events = [e for e in player_events if e.minute >= current_minute - 30]

        shots = [e for e in recent_events if e.type == 'shot']
        successful_passes = [e for e in recent_events if e.type == 'pass' and e.outcome == 'successful']
        total_passes = [e for e in recent_events if e.type == 'pass']

        return {
            'shots_count': len(shots),
            'shots_on_target': len([s for s in shots if s.outcome == 'successful']),
            'pass_accuracy': len(successful_passes) / len(total_passes) if total_passes else 0,
            'xg_total': sum(s.xg or 0 for s in shots),
            'events_in_period': len(recent_events)
        }

    def _calculate_positional_factors(self, player_id: str, events: List[MatchEvent]) -> Dict[str, float]:
        """Calculate positional advantages for the player"""
        # Simplified positional analysis
        return {
            'central_positioning': 0.6,
            'space_behind_defense': 0.4,
            'support_options': 0.7
        }

    def _assess_fatigue_factor(self, player_id: str, events: List[MatchEvent], current_minute: int) -> float:
        """Assess player fatigue based on activity"""
        player_events = [e for e in events if e.player_id == player_id]
        events_per_minute = len(player_events) / max(current_minute, 1)

        # Higher activity = higher fatigue
        fatigue = min(events_per_minute * 10, 1.0)
        return fatigue

    def _calculate_scoring_probability(
        self,
        threat: ThreatFlowMetrics,
        performance: Dict[str, Any],
        positional: Dict[str, float],
        fatigue: float
    ) -> float:
        """Calculate probability of scoring in next time window"""
        base_prob = 0.02  # Base scoring probability per 15 minutes

        # Threat multiplier
        threat_multiplier = 1 + (threat.current_threat * 3)

        # Performance multiplier
        performance_multiplier = 1 + (performance.get('xg_total', 0) * 2)

        # Positional multiplier
        positional_multiplier = 1 + (positional.get('central_positioning', 0.5))

        # Fatigue penalty
        fatigue_multiplier = 1 - (fatigue * 0.3)

        probability = base_prob * threat_multiplier * performance_multiplier * positional_multiplier * fatigue_multiplier

        return min(max(probability, 0.001), 0.25)  # Clamp between 0.1% and 25%

    def _calculate_assisting_probability(
        self,
        threat: ThreatFlowMetrics,
        performance: Dict[str, Any],
        positional: Dict[str, float],
        fatigue: float
    ) -> float:
        """Calculate probability of assisting in next time window"""
        base_prob = 0.03  # Base assisting probability per 15 minutes

        # Threat multiplier (less important for assists)
        threat_multiplier = 1 + (threat.current_threat * 2)

        # Pass accuracy multiplier
        pass_accuracy = performance.get('pass_accuracy', 0.5)
        pass_multiplier = 1 + ((pass_accuracy - 0.5) * 2)

        # Support options multiplier
        support_multiplier = 1 + (positional.get('support_options', 0.5))

        # Fatigue penalty
        fatigue_multiplier = 1 - (fatigue * 0.2)

        probability = base_prob * threat_multiplier * pass_multiplier * support_multiplier * fatigue_multiplier

        return min(max(probability, 0.001), 0.35)  # Clamp between 0.1% and 35%

    def _determine_threat_level(self, combined_prob: float) -> str:
        """Determine threat level from combined probability"""
        if combined_prob > 0.15:
            return "high"
        elif combined_prob > 0.08:
            return "medium"
        else:
            return "low"

    def _generate_player_forecast_factors(
        self,
        threat: ThreatFlowMetrics,
        performance: Dict[str, Any],
        positional: Dict[str, float],
        fatigue: float
    ) -> List[str]:
        """Generate key factors for player forecast"""
        factors = []

        if threat.current_threat > 0.7:
            factors.append("High current threat level")
        elif threat.current_threat < 0.3:
            factors.append("Low current threat level")

        if performance.get('pass_accuracy', 0) > 0.85:
            factors.append("Excellent recent passing accuracy")
        elif performance.get('pass_accuracy', 0) < 0.7:
            factors.append("Struggling with passing accuracy")

        if positional.get('central_positioning', 0) > 0.7:
            factors.append("Well-positioned centrally")
        elif positional.get('space_behind_defense', 0) > 0.6:
            factors.append("Finding space behind defense")

        if fatigue > 0.7:
            factors.append("Showing signs of fatigue")
        elif fatigue < 0.3:
            factors.append("Fresh and energetic")

        return factors or ["Standard performance indicators"]

    def _calculate_prediction_confidence(self, events: List[MatchEvent], current_minute: int) -> float:
        """Calculate confidence in prediction based on data quality"""
        event_count = len(events)
        time_progress = current_minute / 90

        # More events and more time played = higher confidence
        confidence = min((event_count / 100) * time_progress, 0.95)
        return round(confidence, 2)

    def _calculate_forecast_confidence(self, threat: ThreatFlowMetrics, performance: Dict[str, Any]) -> float:
        """Calculate confidence in player forecast"""
        # Based on recency and quality of data
        events_count = len(threat.recent_actions)
        performance_data_quality = performance.get('events_in_period', 0) / 10

        confidence = min((events_count / 5) * performance_data_quality, 0.9)
        return round(confidence, 2)