from __future__ import annotations

import json
import logging
import math
import random
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import networkx as nx
from pydantic import BaseModel
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from shapely.geometry import Point
import httpx

from backend.core.settings import settings
from backend.models.schemas import MatchEvent, Match, Team, Player, PlayerStats, LiveEvent, TacticalFrame

logger = logging.getLogger(__name__)


class SemanticSearchHit(BaseModel):
    match_id: str
    event_id: str
    score: float
    description: str
    event_json: Dict[str, Any]


class XTMomentumPoint(BaseModel):
    minute: int
    home_xt: float
    away_xt: float
    momentum_delta: float
    annotation: str


class SubstitutionImpact(BaseModel):
    match_id: str
    team_id: str
    out_player_id: str
    in_player_profile: Dict[str, Any]
    before_win_probability: float
    after_win_probability: float
    impact_score: float
    confidence: float
    recommendation: str


class GhostingInsight(BaseModel):
    match_id: str
    goal_event_id: str
    ideal_defensive_point: Dict[str, float]
    actual_defensive_point: Dict[str, float]
    deviation_meters: float
    coaching_note: str


class FormationSwitch(BaseModel):
    team_id: str
    minute: int
    from_shape: str
    to_shape: str
    confidence: float


class PitchControlCell(BaseModel):
    x: float
    y: float
    control_probability: float
    controlling_team_id: Optional[str]


class PlayerDNAResult(BaseModel):
    source_player_id: str
    twin_player_id: str
    similarity_score: float
    shared_strengths: List[str]
    tactical_comparison: str


class PressingHeatmapCell(BaseModel):
    x: float
    y: float
    pressure_intensity: float
    ppda: float
    team_id: Optional[str]


class FatigueProjection(BaseModel):
    player_id: str
    match_id: str
    projected_speed_decline: float
    projected_pass_accuracy_decline: float
    recommendation: str


class RefereeBiasSummary(BaseModel):
    referee_id: Optional[str]
    team_bias: Dict[str, float]
    foul_rate_delta: float
    card_rate_delta: float
    tactical_adjustment: str


class TacticalPattern(BaseModel):
    pattern_type: str
    description: str
    confidence: float
    examples: List[Dict[str, Any]]
    tactical_significance: str


class AIAnalyticsService:
    """
    Synthetic Tactical Intelligence Engine
    """

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=120.0)
        self.gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        self.api_key = settings.gemini_api_key
        self.coach_persona = (
            "You are a UEFA Pro License tactical analyst with 20+ years of experience coaching at elite European clubs. "
            "Your analysis should be precise, tactical, and actionable. Reference spacing, transitions, defensive structure, and player roles."
        )
        self.embedding_store: Optional[EventEmbeddingStore] = None

    async def _call_gemini(self, prompt: str, temperature: float = 0.7, max_tokens: int = 1400) -> str:
        full_prompt = f"{self.coach_persona}\n\n{prompt}"
        try:
            response = await self.client.post(
                self.gemini_url,
                json={
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens}
                },
                params={"key": self.api_key}
            )
            response.raise_for_status()
            payload = response.json()
            return payload.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        except Exception as exc:
            logger.exception("Gemini request failed: %s", exc)
            return "Analysis unavailable due to AI service latency."

    async def initialize_embedding_store(self, events: List[MatchEvent]) -> None:
        self.embedding_store = EventEmbeddingStore(events)
        self.embedding_store.build_index()

    async def search_match_events_semantic(self, query: str, events: List[MatchEvent], top_k: int = 20) -> List[SemanticSearchHit]:
        if self.embedding_store is None or self.embedding_store.size == 0:
            await self.initialize_embedding_store(events)
        hits = self.embedding_store.query(query, top_k=top_k)
        return [SemanticSearchHit(**hit) for hit in hits]

    async def compute_xt_momentum(self, events: List[MatchEvent], home_team_id: str, away_team_id: str) -> List[XTMomentumPoint]:
        if not events:
            return []
        df = pd.DataFrame([{
            'minute': e.minute or 0,
            'team_id': e.team_id,
            'xt': float(e.xt or 0.0),
            'x': e.location.x if e.location else 50.0,
            'y': e.location.y if e.location else 50.0,
            'outcome': str(e.outcome or '')
        } for e in events])
        df['minute'] = df['minute'].clip(lower=0, upper=90)
        summary = df.groupby(['minute', 'team_id'])['xt'].sum().reset_index()
        minutes = range(0, max(int(summary['minute'].max()) + 1, 1))
        momentum = []
        last_delta = 0.0
        for minute in minutes:
            home_xt = float(summary.loc[(summary.minute == minute) & (summary.team_id == home_team_id), 'xt'].sum())
            away_xt = float(summary.loc[(summary.minute == minute) & (summary.team_id == away_team_id), 'xt'].sum())
            delta = home_xt - away_xt
            annotation = self._annotate_xt_momentum(delta, last_delta)
            momentum.append(XTMomentumPoint(minute=minute, home_xt=home_xt, away_xt=away_xt, momentum_delta=delta, annotation=annotation))
            last_delta = delta
        return momentum

    async def simulate_substitution_impact(
        self,
        match: Match,
        events: List[MatchEvent],
        team_id: str,
        out_player_id: str,
        in_player_profile: Dict[str, Any],
        iterations: int = 300
    ) -> SubstitutionImpact:
        baseline = self._estimate_match_win_probability(match, events, team_id)
        scores = []
        for _ in range(iterations):
            delta = random.normalvariate(0.025, 0.03)
            profile_bonus = self._profile_contribution(in_player_profile)
            simulated = min(max(baseline + delta * profile_bonus, 0.0), 1.0)
            scores.append(simulated)
        after_probability = float(np.mean(scores))
        impact_score = after_probability - baseline
        recommendation = self._substitution_recommendation(team_id, out_player_id, in_player_profile, impact_score)
        return SubstitutionImpact(
            match_id=match.id,
            team_id=team_id,
            out_player_id=out_player_id,
            in_player_profile=in_player_profile,
            before_win_probability=float(round(baseline, 4)),
            after_win_probability=float(round(after_probability, 4)),
            impact_score=float(round(impact_score, 4)),
            confidence=float(min(0.95, 0.55 + abs(impact_score) * 2)),
            recommendation=recommendation
        )

    async def generate_tactical_brief(
        self,
        events: List[MatchEvent],
        current_minute: int,
        team_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        brief_events = [e for e in events if e.minute is not None and e.minute >= max(0, current_minute - 12)]
        prompt = f"""
        Generate a tactical coaching brief for minute {current_minute}.
        Team context: {json.dumps(team_context, indent=2)}
        Recent events: {json.dumps([{'minute': e.minute,'type': e.type,'subtype': e.subtype,'team_id': e.team_id,'player_id': e.player_id,'location': {'x': e.location.x, 'y': e.location.y} if e.location else None,'outcome': str(e.outcome)} for e in brief_events], indent=2)}
        Provide a concise expert-level analysis, momentum shift, formation advice, and pressing recommendation. Include a short tactical title and 3 coaching actions.
        """
        analysis = await self._call_gemini(prompt, temperature=0.3)
        return {
            'type': 'live_analysis',
            'timestamp': datetime.now().isoformat(),
            'title': 'Synthetic Coach Tactical Brief',
            'analysis': analysis,
            'confidence': 0.82,
            'supporting_data': {
                'events_analyzed': len(brief_events),
                'current_minute': current_minute
            },
            'recommendations': [line for line in analysis.splitlines() if line.strip()][:3]
        }

    async def generate_post_match_autopsy(self, match: Match, events: List[MatchEvent], team_stats: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""
        Create a professional post-match tactical autopsy.
        Match: {match.home_team_id} vs {match.away_team_id}, {match.home_score}-{match.away_score}.
        Events sample: {json.dumps([{'minute': e.minute,'type': e.type,'team_id': e.team_id,'player_id': e.player_id,'subtype': e.subtype,'xg': e.xg,'xt': e.xt} for e in events if e.minute and e.minute % 10 == 0][:20], indent=2)}
        Team stats: {json.dumps(team_stats, indent=2)}
        Provide executive summary, tactical performance, player recommendations, key moments, scouting narrative and opponent weaknesses.
        """
        autopsy_text = await self._call_gemini(prompt, temperature=0.25)
        return {
            'executive_summary': autopsy_text,
            'tactical_performance': {'analysis': 'AI-generated tactical performance narrative.'},
            'player_ratings': [{'player_id': e.player_id or 'unknown', 'rating': 7.0, 'note': 'consistent impact'} for e in events[:5]],
            'key_moments': [{'minute': e.minute, 'event': e.type, 'impact': 'high'} for e in events if e.type in ['goal', 'shot', 'card']][:6],
            'future_recommendations': ['Increase transitional speed', 'Close down wide overlaps', 'Rotate the central midfielder after 60 minutes'],
            'scouting_report': f"AI scouting summary for {match.home_team_id} and {match.away_team_id}."
        }

    async def generate_tactical_summary(self, match_id: str, events: List[MatchEvent]) -> Dict[str, Any]:
        prompt = f"""
        Generate a tactical summary for match {match_id}.
        Events: {json.dumps([{'minute': e.minute,'type': e.type,'team_id': e.team_id,'location': {'x': e.location.x, 'y': e.location.y} if e.location else None,'xg': e.xg} for e in events[:80]], indent=2)}
        """
        summary_text = await self._call_gemini(prompt, temperature=0.22)
        insights = [line.strip() for line in summary_text.splitlines() if line.strip()][:5]
        return {
            'match_id': match_id,
            'summary': summary_text,
            'key_insights': insights,
            'generated_at': datetime.now().isoformat()
        }

    async def analyze_tactical_pattern(self, query: str, events: List[MatchEvent], matches: List[Match]) -> List[TacticalPattern]:
        if not events:
            return []
        prompt = f"""
        Identify tactical patterns matching: '{query}'.
        Provide pattern type, description, confidence, and examples with match ids and minutes.
        Events sample: {json.dumps([{'match_id': e.match_id,'minute': e.minute,'type': e.type,'subtype': e.subtype,'team_id': e.team_id,'player_id': e.player_id,'location': {'x': e.location.x,'y': e.location.y} if e.location else None} for e in events[:80]], indent=2)}
        """
        pattern_text = await self._call_gemini(prompt, temperature=0.35)
        return [TacticalPattern(pattern_type='synthetic_pattern', description=pattern_text, confidence=0.72, examples=[{'match_id': matches[0].id if matches else 'unknown', 'description': query}], tactical_significance='High')] if matches else []

    async def ghosting_analysis(self, events: List[MatchEvent], tactical_frames: List[TacticalFrame]) -> List[GhostingInsight]:
        goals = [e for e in events if e.type == 'goal']
        insights = []
        for event in goals:
            ideal = self._estimate_defensive_position(event)
            actual = self._estimate_actual_defensive_position(event, tactical_frames)
            deviation = self._distance(ideal, actual)
            note = self._ghosting_coaching_note(event, deviation)
            insights.append(GhostingInsight(
                match_id=event.match_id,
                goal_event_id=event.id,
                ideal_defensive_point=ideal,
                actual_defensive_point=actual,
                deviation_meters=float(round(deviation, 2)),
                coaching_note=note
            ))
        return insights

    async def detect_formation_switches(self, frames: List[TacticalFrame], team_id: str) -> List[FormationSwitch]:
        if not frames:
            return []
        frame_data = [self._extract_team_positions(frame, team_id) for frame in frames]
        shapes = [self._estimate_shape_from_positions(positions) for positions in frame_data if positions]
        switches = []
        for i in range(1, len(shapes)):
            if shapes[i] != shapes[i-1]:
                switches.append(FormationSwitch(
                    team_id=team_id,
                    minute=frames[i].minute,
                    from_shape=shapes[i-1],
                    to_shape=shapes[i],
                    confidence=float(min(0.98, 0.3 + abs(hash(shapes[i]) - hash(shapes[i-1])) % 50 / 100))
                ))
        return switches

    async def build_pitch_control_voronoi(self, frames: List[TacticalFrame], current_minute: int) -> Dict[str, Any]:
        if not frames:
            return {'cells': [], 'annotations': []}
        recent_frame = next((frame for frame in reversed(frames) if frame.minute <= current_minute), frames[-1])
        home_points = [Point(p['x'], p['y']) for p in recent_frame.home_team_positions]
        away_points = [Point(p['x'], p['y']) for p in recent_frame.away_team_positions]
        cells = self._build_control_grid(home_points, away_points)
        return {'cells': [cell.model_dump() for cell in cells], 'annotations': self._build_voronoi_annotations(cells)}

    async def match_player_dna(self, player_id: str, players: List[Player], stats: List[PlayerStats], limit: int = 5) -> List[PlayerDNAResult]:
        if not players or not stats:
            return []
        feature_df = self._build_player_feature_matrix(players, stats)
        if player_id not in feature_df.index:
            return []
        target_row = feature_df.loc[player_id]
        similarities = self._player_similarity_scores(target_row, feature_df)
        results = []
        for twin_id, score in similarities[:limit]:
            results.append(PlayerDNAResult(
                source_player_id=player_id,
                twin_player_id=twin_id,
                similarity_score=float(round(score, 4)),
                shared_strengths=self._describe_shared_strengths(feature_df.loc[player_id], feature_df.loc[twin_id]),
                tactical_comparison=f"{player_id} and {twin_id} share a high work rate, chance creation profile, and pressing footprint."
            ))
        return results

    async def compute_pressing_heatmap(self, events: List[MatchEvent], home_team_id: str, away_team_id: str) -> Dict[str, Any]:
        if not events:
            return {'cells': []}
        df = pd.DataFrame([{
            'x': e.location.x if e.location else 50,
            'y': e.location.y if e.location else 50,
            'team_id': e.team_id,
            'ppda': float(e.ppda or 0.0),
            'type': e.type,
            'pressure': 1 if e.type == 'pressure' else 0
        } for e in events])
        cells = []
        for x in np.linspace(0, 100, 10):
            for y in np.linspace(0, 100, 8):
                subset = df[(df.x.between(x - 5, x + 5)) & (df.y.between(y - 6, y + 6))]
                pressures = subset.pressure.sum()
                avg_ppda = float(subset.ppda.mean()) if not subset.empty else 0.0
                team_id = subset.team_id.mode().iloc[0] if not subset.empty else None
                cells.append(PressingHeatmapCell(x=float(x), y=float(y), pressure_intensity=float(round(pressures, 2)), ppda=float(round(avg_ppda, 2)), team_id=team_id).model_dump())
        return {'cells': cells}

    async def simulate_biometric_decay(self, player_id: str, match_id: str, player_stats: PlayerStats, events: List[MatchEvent]) -> FatigueProjection:
        minutes = player_stats.minutes_played
        intensity_events = sum(1 for e in events if e.player_id == player_id and e.type in ['sprint', 'press', 'tackle', 'dribble'])
        decay_factor = min(0.45, max(0.05, (minutes / 90) * 0.35 + intensity_events * 0.01))
        return FatigueProjection(
            player_id=player_id,
            match_id=match_id,
            projected_speed_decline=float(round(decay_factor * 100, 2)),
            projected_pass_accuracy_decline=float(round(decay_factor * 80, 2)),
            recommendation="Rotate this player or reduce high-intensity sprint efforts after minute 70 to preserve decision-making and precision."
        )

    async def referee_bias_insight(self, events: List[MatchEvent], home_team_id: str, away_team_id: str) -> RefereeBiasSummary:
        if not events:
            return RefereeBiasSummary(referee_id=None, team_bias={home_team_id: 1.0, away_team_id: 1.0}, foul_rate_delta=0.0, card_rate_delta=0.0, tactical_adjustment='No major referee bias detected.')
        df = pd.DataFrame([{
            'team_id': e.team_id,
            'type': e.type,
            'subtype': e.subtype,
            'minute': e.minute or 0
        } for e in events])
        home_fouls = len(df[(df.team_id == home_team_id) & (df.type == 'foul')])
        away_fouls = len(df[(df.team_id == away_team_id) & (df.type == 'foul')])
        home_cards = len(df[(df.team_id == home_team_id) & (df.type == 'card')])
        away_cards = len(df[(df.team_id == away_team_id) & (df.type == 'card')])
        home_bias = float(round((home_fouls + home_cards * 1.5) / max(1, (away_fouls + away_cards * 1.5)), 3))
        away_bias = float(round((away_fouls + away_cards * 1.5) / max(1, (home_fouls + home_cards * 1.5)), 3))
        adjustment = "Encourage disciplined transitions and avoid tactical fouls in the first half if the referee is awarding free space to the opponent."
        return RefereeBiasSummary(
            referee_id=None,
            team_bias={home_team_id: home_bias, away_team_id: away_bias},
            foul_rate_delta=float(round(abs(home_fouls - away_fouls) / max(1, home_fouls + away_fouls), 3)),
            card_rate_delta=float(round(abs(home_cards - away_cards) / max(1, home_cards + away_cards), 3)),
            tactical_adjustment=adjustment
        )

    async def set_piece_threat_model(self, events: List[MatchEvent]) -> Dict[str, Any]:
        shots = [e for e in events if e.type == 'shot' and e.subtype in ['corner', 'free_kick', 'penalty']]
        threat_by_zone = Counter()
        for shot in shots:
            zone = self._zone_from_location(shot.location)
            threat_by_zone[zone] += float(shot.xg or 0.1)
        return {'set_piece_threat': dict(threat_by_zone)}

    async def compute_pass_network_insights(self, events: List[MatchEvent]) -> Dict[str, Any]:
        passes = [e for e in events if e.type == 'pass' and e.player_id and e.target_player_id]
        if not passes:
            return {'nodes': [], 'edges': []}
        graph = nx.DiGraph()
        for event in passes:
            source = event.player_id
            target = event.target_player_id
            graph.add_edge(source, target, weight=graph.get_edge_data(source, target, default={'weight': 0})['weight'] + 1)
        nodes = [{'player_id': n, 'degree': graph.degree(n), 'betweenness': nx.betweenness_centrality(graph).get(n, 0.0)} for n in graph.nodes()]
        edges = [{'source': u, 'target': v, 'weight': d['weight']} for u, v, d in graph.edges(data=True)]
        return {'nodes': nodes, 'edges': edges}

    async def compute_defensive_compactness(self, frames: List[TacticalFrame], team_id: str) -> Dict[str, Any]:
        positions = [self._extract_team_positions(frame, team_id) for frame in frames]
        compactness = []
        for pos in positions:
            if not pos:
                continue
            distances = [Point(a['x'], a['y']).distance(Point(b['x'], b['y'])) for i, a in enumerate(pos) for b in pos[i+1:]]
            compactness.append(float(np.mean(distances)))
        return {'average_compactness': float(round(np.mean(compactness), 2)) if compactness else 0.0}

    async def cluster_shot_quality(self, events: List[MatchEvent], clusters: int = 3) -> Dict[str, Any]:
        shots = [e for e in events if e.type == 'shot']
        if not shots:
            return {'clusters': []}
        df = pd.DataFrame([{
            'x': e.location.x if e.location else 50,
            'y': e.location.y if e.location else 50,
            'xg': float(e.xg or 0.0),
            'quality': float(e.xt or 0.0)
        } for e in shots])
        model = KMeans(n_clusters=min(clusters, len(df)), random_state=42)
        df['cluster'] = model.fit_predict(df[['x', 'y', 'xg', 'quality']])
        clusters_summary = []
        for cluster_id, group in df.groupby('cluster'):
            clusters_summary.append({'cluster_id': int(cluster_id), 'count': len(group), 'mean_xg': float(round(group.xg.mean(), 3)), 'center': model.cluster_centers_[cluster_id].tolist()})
        return {'clusters': clusters_summary}

    async def compute_transition_acceleration(self, events: List[MatchEvent]) -> Dict[str, Any]:
        sequences = []
        sorted_events = sorted(events, key=lambda e: (e.minute or 0) * 60 + (e.second or 0))
        for i in range(len(sorted_events) - 1):
            current = sorted_events[i]
            nxt = sorted_events[i + 1]
            if current.type == 'turnover' and nxt.type in ['pass', 'dribble', 'shot'] and current.team_id != nxt.team_id:
                dt = max(1, ((nxt.minute or 0) * 60 + (nxt.second or 0)) - ((current.minute or 0) * 60 + (current.second or 0)))
                sequences.append({'interval': dt, 'xg': float(nxt.xg or 0.0)})
        average_acceleration = float(round(np.mean([s['interval'] for s in sequences]) if sequences else 0.0, 2))
        return {'transition_acceleration_seconds': average_acceleration, 'sequence_count': len(sequences)}

    async def detect_overloads(self, events: List[MatchEvent]) -> Dict[str, Any]:
        overloads = []
        grouped: Dict[Tuple[str, str, str], List[MatchEvent]] = {}
        for event in events:
            zone = self._zone_from_location(event.location)
            key = (event.match_id, event.team_id, zone)
            grouped.setdefault(key, []).append(event)
        for (match_id, team_id, zone), chunk in grouped.items():
            if len(chunk) >= 4 and any(e.type == 'pass' for e in chunk):
                overloads.append({'match_id': match_id, 'team_id': team_id, 'zone': zone, 'event_count': len(chunk)})
        return {'overloads': overloads}

    async def forecast_opponent_tactical_trends(self, matches: List[Match], events: List[MatchEvent], team_id: str) -> Dict[str, Any]:
        trends = ["high press", "quick transition", "wide overloads", "deep block"]
        return {'predicted_trends': trends[:3], 'confidence': 0.8}

    async def generate_pitch_annotations(self, events: List[MatchEvent]) -> Dict[str, Any]:
        arrows = []
        circles = []
        for event in events[-8:]:
            if event.type in ['pass', 'dribble'] and event.location and event.target_player_id:
                arrows.append({'from': {'x': event.location.x, 'y': event.location.y}, 'to': {'x': (event.location.x + 5) % 100, 'y': event.location.y}, 'team_id': event.team_id})
            if event.type == 'goal' and event.location:
                circles.append({'center': {'x': event.location.x, 'y': event.location.y}, 'radius': 5, 'color': 'red'})
        return {'arrows': arrows, 'circles': circles}

    def _estimate_match_win_probability(self, match: Match, events: List[MatchEvent], team_id: str) -> float:
        total_xg = sum(float(e.xg or 0.0) for e in events if e.team_id == team_id)
        opp_xg = sum(float(e.xg or 0.0) for e in events if e.team_id != team_id)
        base = 0.45 + 0.1 * (total_xg - opp_xg)
        score_diff = ((match.home_score or 0) - (match.away_score or 0)) if team_id == match.home_team_id else ((match.away_score or 0) - (match.home_score or 0))
        return float(min(max(base + 0.05 * score_diff, 0.02), 0.98))

    def _profile_contribution(self, profile: Dict[str, Any]) -> float:
        return float(min(1.5, max(0.7, 0.5 + sum(profile.get(metric, 0.0) for metric in ['pace', 'pass_accuracy', 'defensive_actions']) * 0.05)))

    def _substitution_recommendation(self, team_id: str, out_player_id: str, in_profile: Dict[str, Any], impact: float) -> str:
        if impact > 0.03:
            return f"Introduce {in_profile.get('name', 'the substitute')} to increase tempo and ball progression."
        return f"Keep the current shape; deploy {in_profile.get('name', 'the substitute')} only if the opponent drops deeper."

    def _annotate_xt_momentum(self, delta: float, last_delta: float) -> str:
        if delta > 0.3:
            return 'Home team building strong territorial threat'
        if delta < -0.3:
            return 'Away team mounting momentum in attack'
        if abs(delta - last_delta) > 0.2:
            return 'Momentum swing detected'
        return 'Stable territorial balance'

    def _estimate_defensive_position(self, event: MatchEvent) -> Dict[str, float]:
        if event.location is None:
            return {'x': 50.0, 'y': 50.0}
        x = max(0.0, min(100.0, event.location.x - 10 if event.team_id else event.location.x + 10))
        return {'x': x, 'y': event.location.y}

    def _estimate_actual_defensive_position(self, event: MatchEvent, frames: List[TacticalFrame]) -> Dict[str, float]:
        if not frames or event.location is None:
            return {'x': event.location.x if event.location else 50.0, 'y': event.location.y if event.location else 50.0}
        near_frame = min(frames, key=lambda frame: abs(frame.minute - (event.minute or 0)))
        combined = getattr(near_frame, 'home_team_positions', []) + getattr(near_frame, 'away_team_positions', [])
        if not combined:
            return {'x': event.location.x, 'y': event.location.y}
        point = random.choice(combined)
        return {'x': float(point['x']), 'y': float(point['y'])}

    def _distance(self, a: Dict[str, float], b: Dict[str, float]) -> float:
        return math.hypot(a['x'] - b['x'], a['y'] - b['y'])

    def _extract_team_positions(self, frame: TacticalFrame, team_id: str) -> List[Dict[str, float]]:
        if frame.home_team_positions and any(p.get('team_id') == team_id for p in frame.home_team_positions):
            return [p for p in frame.home_team_positions if p.get('team_id') == team_id]
        if frame.away_team_positions and any(p.get('team_id') == team_id for p in frame.away_team_positions):
            return [p for p in frame.away_team_positions if p.get('team_id') == team_id]
        return []

    def _estimate_shape_from_positions(self, positions: List[Dict[str, float]]) -> str:
        if not positions:
            return 'unknown'
        x_values = np.array([pos['x'] for pos in positions])
        if np.mean(x_values) < 35:
            return '4-4-2'
        if np.mean(x_values) < 50:
            return '4-2-3-1'
        return '3-4-3'

    def _build_control_grid(self, home_points: List[Point], away_points: List[Point]) -> List[PitchControlCell]:
        cells = []
        for x in np.linspace(0, 100, 10):
            for y in np.linspace(0, 100, 8):
                point = Point(x, y)
                home_dist = min((point.distance(p) for p in home_points), default=200)
                away_dist = min((point.distance(p) for p in away_points), default=200)
                home_prob = 1 / (1 + math.exp((home_dist - away_dist) / 10))
                controlling = None
                if abs(home_prob - 0.5) > 0.1:
                    controlling = 'home' if home_prob > 0.5 else 'away'
                cells.append(PitchControlCell(x=float(x), y=float(y), control_probability=float(round(home_prob, 3)), controlling_team_id=controlling))
        return cells

    def _build_voronoi_annotations(self, cells: List[PitchControlCell]) -> List[Dict[str, Any]]:
        if not cells:
            return []
        top_home = sorted([c for c in cells if c.controlling_team_id == 'home'], key=lambda c: c.control_probability, reverse=True)[:3]
        return [{'shape': 'circle', 'center': {'x': cell.x, 'y': cell.y}, 'radius': 6, 'team': 'home'} for cell in top_home]

    def _build_player_feature_matrix(self, players: List[Player], stats: List[PlayerStats]) -> pd.DataFrame:
        stats_df = pd.DataFrame([s.model_dump() if hasattr(s, 'model_dump') else s.__dict__ for s in stats])
        players_df = pd.DataFrame([p.model_dump() if hasattr(p, 'model_dump') else p.__dict__ for p in players]).set_index('id')
        merged = stats_df.set_index('player_id').join(players_df, how='inner')
        features = merged[['passes_completed', 'shots', 'successful_pressures', 'dribbles_completed', 'progressive_passes', 'minutes_played']].fillna(0)
        features.index = merged.index
        return features

    def _player_similarity_scores(self, target: pd.Series, feature_df: pd.DataFrame) -> List[Tuple[str, float]]:
        similarities = cosine_similarity([target.values], feature_df.values)[0]
        mapping = list(zip(feature_df.index.astype(str), similarities))
        mapping = [pair for pair in mapping if pair[0] != target.name]
        mapping.sort(key=lambda x: x[1], reverse=True)
        return mapping

    def _describe_shared_strengths(self, source: pd.Series, twin: pd.Series) -> List[str]:
        shared = []
        for metric in ['passes_completed', 'shots', 'progressive_passes', 'successful_pressures']:
            if abs(source[metric] - twin[metric]) / max(1, source[metric]) < 0.25:
                shared.append(metric)
        return shared or ['positional balance', 'attacking instinct']

    def _zone_from_location(self, location: Optional[Any]) -> str:
        if not location:
            return 'central'
        if location.y < 33:
            return 'left_third'
        if location.y > 66:
            return 'right_third'
        return 'central_third'


class EventEmbeddingStore:
    def __init__(self, events: List[MatchEvent]):
        self.events = events
        self.vectorizer = TfidfVectorizer(max_features=1024, ngram_range=(1, 2))
        self.embeddings: Optional[np.ndarray] = None
        self.texts: List[str] = []
        self.ids: List[str] = []
        self.match_ids: List[str] = []
        self.size = 0

    def build_index(self) -> None:
        self.texts = [self._event_to_text(event) for event in self.events]
        self.embeddings = self.vectorizer.fit_transform(self.texts).toarray()
        self.ids = [event.id for event in self.events]
        self.match_ids = [event.match_id for event in self.events]
        self.size = len(self.events)

    def query(self, query: str, top_k: int = 20) -> List[Dict[str, Any]]:
        if self.embeddings is None or self.size == 0:
            return []
        query_vec = self.vectorizer.transform([query]).toarray()
        sims = cosine_similarity(query_vec, self.embeddings)[0]
        top_idx = sims.argsort()[::-1][:top_k]
        hits = []
        for idx in top_idx:
            event = self.events[idx]
            hits.append({
                'match_id': self.match_ids[idx],
                'event_id': self.ids[idx],
                'score': float(round(float(sims[idx]), 4)),
                'description': self._event_to_text(event),
                'event_json': {
                    'minute': event.minute,
                    'type': event.type,
                    'subtype': event.subtype,
                    'team_id': event.team_id,
                    'player_id': event.player_id,
                    'location': {'x': event.location.x, 'y': event.location.y} if event.location else None,
                    'outcome': event.outcome,
                    'xg': event.xg,
                    'xt': event.xt
                }
            })
        return hits

    def _event_to_text(self, event: MatchEvent) -> str:
        parts = [event.type or '', event.subtype or '', event.team_id or '', event.player_id or '']
        if event.location:
            parts.append(f"x{event.location.x:.1f}y{event.location.y:.1f}")
        parts.append(str(event.outcome or ''))
        return ' '.join(parts)
