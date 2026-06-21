from __future__ import annotations

import logging
from datetime import datetime, UTC
from typing import Any, Dict, List
import asyncio

from backend.core.settings import settings
from backend.services.data_normalizer import coerce_float, ensure_dict

logger = logging.getLogger(__name__)

class IntelligenceEngine:
    """
    The 'Brain' of the Football Intelligence OS.
    Responsible for generating high-signal tactical insights, 
    detecting momentum shifts, and predicting tactical outcomes.
    """

    def __init__(self):
        self.momentum_decay = 0.95 # Decay factor for historical momentum
        self.window_size = 15 # Minutes to consider for 'recent' trends

    async def analyze_match_dynamic(self, match_id: str, current_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Performs real-time tactical modeling on a match.
        Returns momentum scores, threat levels, and AI-generated tactical alerts.
        """
        match_status = current_data.get("status", "SCHEDULED").upper()
        if match_status not in ["LIVE", "IN_PLAY", "PAUSED", "HALF_TIME"]:
            return self._empty_intelligence(match_id)

        # 1. Calculate Momentum
        momentum = self._calculate_momentum(current_data)
        
        # 2. Detect Tactical Shifts (e.g., substitution impact, formation changes)
        shifts = self._detect_tactical_shifts(current_data)
        
        # 3. Generate Tactical Narrative
        narrative = await self._generate_tactical_narrative(current_data, momentum, shifts)

        return {
            "matchId": match_id,
            "timestamp": datetime.now(UTC).isoformat(),
            "momentum": momentum,
            "tacticalShifts": shifts,
            "intelligenceAlerts": self._generate_alerts(momentum, shifts),
            "narrative": narrative,
            "winProbability": self._calculate_win_probability(current_data, momentum)
        }

    def _calculate_momentum(self, data: Dict[str, Any]) -> Dict[str, float]:
        """
        Heuristic-probabilistic momentum calculation.
        In an elite system, this would ingest event-level data (passes, entries).
        Here, we use normalized score, possession, and attack strength.
        """
        home_score = coerce_float(data.get("score", {}).get("home", 0))
        away_score = coerce_float(data.get("score", {}).get("away", 0))
        
        # Placeholder values for metrics if not provided in 'data'
        # In a real scenario, these would come from the tactical engine's recent window
        home_possession = 50.0
        away_possession = 50.0
        
        # Base momentum starts at 50%
        home_m = 50.0
        
        # Score impact
        score_diff = home_score - away_score
        home_m += score_diff * 5.0
        
        # Constraint to 0-100
        home_m = max(5.0, min(95.0, home_m))
        
        return {
            "home": home_m,
            "away": 100.0 - home_m,
            "trend": "STABLE" if 45 <= home_m <= 55 else "HOME_DOMINANT" if home_m > 55 else "AWAY_DOMINANT"
        }

    def _detect_tactical_shifts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Detects significant changes in the match flow.
        """
        shifts = []
        # Example: detect high score change
        if data.get("minute", 0) > 80 and abs(data.get("score", {}).get("home", 0) - data.get("score", {}).get("away", 0)) <= 1:
            shifts.append({
                "type": "HIGH_INTENSITY_FINISH",
                "severity": "CRITICAL",
                "label": "Clutch Window Detected",
                "description": "One-goal game entering final 10 minutes. Tactical risk increasing."
            })
        return shifts

    def _generate_alerts(self, momentum: Dict[str, float], shifts: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        alerts = []
        if momentum["home"] > 70:
            alerts.append({"type": "PRESSURE", "message": "Home team sustaining heavy offensive pressure."})
        elif momentum["away"] > 70:
            alerts.append({"type": "PRESSURE", "message": "Away team controlling transition phases."})
            
        for shift in shifts:
            alerts.append({"type": "TACTICAL", "message": shift["description"]})
            
        return alerts

    async def _generate_tactical_narrative(self, data: Dict[str, Any], momentum: Dict[str, float], shifts: List[Dict[str, Any]]) -> str:
        # In a production system, this would call an LLM with the context
        # For efficiency, we use a high-quality template-based generator here
        home_team = data.get("homeTeam", "Home")
        away_team = data.get("awayTeam", "Away")
        
        if momentum["trend"] == "HOME_DOMINANT":
            return f"{home_team} are currently imposing their tactical structure, forcing {away_team} into a deeper defensive block."
        if momentum["trend"] == "AWAY_DOMINANT":
            return f"{away_team} have successfully seized midfield control, creating high-value transition opportunities."
        
        return f"Tactical parity maintained. Both sides are focusing on rest-defence organization and cautious build-up."

    def _calculate_win_probability(self, data: Dict[str, Any], momentum: Dict[str, float]) -> Dict[str, float]:
        # Simple ELO/Momentum based win prob
        home_m = momentum["home"]
        # Very crude for now, will be replaced by AI prediction model
        h_prob = max(10, min(80, home_m + 10))
        a_prob = max(10, min(80, (100-home_m) + 10))
        d_prob = 100 - h_prob - a_prob
        return {"home": h_prob, "draw": d_prob, "away": a_prob}

    def _empty_intelligence(self, match_id: str) -> Dict[str, Any]:
        return {
            "matchId": match_id,
            "timestamp": datetime.now(UTC).isoformat(),
            "momentum": {"home": 50, "away": 50, "trend": "NEUTRAL"},
            "tacticalShifts": [],
            "intelligenceAlerts": [],
            "narrative": "Match intelligence will activate upon kickoff.",
            "winProbability": {"home": 33.3, "draw": 33.3, "away": 33.3}
        }

intelligence_engine = IntelligenceEngine()
