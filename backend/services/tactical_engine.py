import math
from typing import List, Dict


class TacticalEngine:
    """
    Simulates advanced metrics based on event-stream data and aggregate stats.
    In a production environment with Opta/StatsBomb, this would use coordinate data.
    """

    @staticmethod
    def calculate_xg(events: List[Dict]) -> float:
        """
        Calculates Expected Goals (xG) based on shot quality in the event stream.
        """
        xg_total = 0.0
        for event in events:
            if event.get("type") == "Shot":
                # Basic xG heuristic model
                base_xg = 0.10
                detail = event.get("detail", "").lower()

                if "header" in detail: base_xg = 0.05
                if "penalty" in detail: base_xg = 0.76
                if "big chance" in detail: base_xg += 0.35
                if "outside box" in detail: base_xg -= 0.06

                xg_total += max(0.01, base_xg)
        return round(xg_total, 2)

    @staticmethod
    def calculate_ppda(stats: List[Dict]) -> float:
        """
        Passes per Defensive Action (PPDA).
        Lower is better (higher intensity press).
        Formula: Opponent Passes / (Tackles + Interceptions + Challenges)
        """

        def get_stat(data, name):
            for s in data:
                if s['type'] == name: return s['value'] or 0
            return 0

        # This requires stats from the opponent's perspective
        # Simplified for this implementation
        tackles = get_stat(stats, "Total tackles")
        interceptions = get_stat(stats, "Interceptions")
        fouls = get_stat(stats, "Fouls")
        opp_passes = get_stat(stats, "Total passes")  # Usually attacking third passes

        defensive_actions = tackles + interceptions + fouls
        if defensive_actions == 0: return 20.0

        return round(opp_passes / 15 / defensive_actions, 1)  # Normalizing for visual

    @staticmethod
    def generate_momentum_worm(events: List[Dict], duration: int) -> List[Dict]:
        """
        Generates the 'Pressure Worm' data points for the frontend.
        """
        intervals = 15  # Data points every X minutes
        worm = []
        for i in range(0, duration + 1, 5):
            # Calculate pressure based on events in this 5min window
            window_events = [e for e in events if e['time']['elapsed'] <= i and e['time']['elapsed'] > i - 5]

            pressure = 0
            for e in window_events:
                val = 0
                if e['type'] == 'Shot': val = 15
                if e['type'] == 'Goal': val = 40
                if e['type'] == 'Corner': val = 10

                # Assign direction based on team
                pressure += val if e['team']['id'] == 1 else -val  # Replace 1 with Home ID

            worm.append({"min": i, "val": pressure})
        return worm

    @staticmethod
    def calculate_xt(player_events: List[Dict]) -> float:
        """
        Expected Threat (xT) - Measures how much a player moves the ball
        into more dangerous positions via carries and passes.
        """
        threat = 0.0
        for e in player_events:
            if e['type'] == 'Pass':
                # Heuristic: Progressive passes increase threat
                threat += 0.05
            if e['type'] == 'Card':
                threat -= 0.1
        return round(threat, 2)