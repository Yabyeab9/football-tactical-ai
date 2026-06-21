from __future__ import annotations
from typing import Any
from .data_normalizer import ensure_dict

class MatchPriorityService:
    # League priority ranking (lower is higher priority)
    LEAGUE_PRIORITY = {
        "CL": 1,      # Champions League
        "PL": 2,      # English Premier League
        "PD": 3,      # La Liga
        "SA": 4,      # Serie A
        "BL1": 5,     # Bundesliga
        "FL1": 6,     # Ligue 1
        "WC": 7,      # World Cup
        "EC": 8,      # European Championship
        "EL": 9,      # Europa League
        "PPL": 10,    # Primeira Liga
        "DED": 11,    # Eredivisie
    }

    # Map for various API providers' league codes/names to our internal codes
    LEAGUE_MAPPING = {
        "UEFA Champions League": "CL",
        "Champions League": "CL",
        "Premier League": "PL",
        "English Premier League": "PL",
        "La Liga": "PD",
        "Primera Division": "PD",
        "Serie A": "SA",
        "Bundesliga": "BL1",
        "Ligue 1": "FL1",
        "FIFA World Cup": "WC",
        "UEFA European Championship": "EC",
        "UEFA Europa League": "EL",
    }

    @classmethod
    def get_priority_score(cls, match: dict[str, Any]) -> int:
        competition = ensure_dict(match.get("competition"))
        comp_name = competition.get("name")
        comp_code = competition.get("code") or competition.get("id")

        # Try to resolve code from mapping if not directly available or unrecognized
        code = comp_code
        if code not in cls.LEAGUE_PRIORITY:
            code = cls.LEAGUE_MAPPING.get(comp_name, code)
        
        # Base priority from league
        priority = cls.LEAGUE_PRIORITY.get(code, 100)

        # Status adjustment (Live matches get a boost)
        status = str(match.get("status") or "").upper()
        is_live = status in {"LIVE", "IN_PLAY", "PAUSED", "HALF_TIME"}
        
        if is_live:
            priority -= 50  # Significantly boost live matches

        # Match importance adjustment (e.g., higher score differences might lower priority unless it's a big game)
        # For now, keep it simple with league + live status
        
        return priority

    @classmethod
    def sort_matches(cls, matches: list[dict[str, Any]]) -> list[dict[str, Any]]:
        # Primary: Priority Score (League + Live Status)
        # Secondary for Live: Minute (Descending, to show matches further along)
        # Secondary for Non-Live: Kickoff (Ascending, to show soonest)
        def sort_key(m: dict[str, Any]) -> tuple[int, Any]:
            priority = cls.get_priority_score(m)
            status = str(m.get("status") or "").upper()
            is_live = status in {"LIVE", "IN_PLAY", "PAUSED", "HALF_TIME"}
            
            if is_live:
                # Use negative minute to sort descending
                minute = int(m.get("minute") or 0)
                return (priority, -minute)
            
            return (priority, m.get("kickoff", ""))

        return sorted(matches, key=sort_key)

match_priority_service = MatchPriorityService()
