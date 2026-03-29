// Football Tactical AI Platform Types

export interface Competition {
  id: number;
  competition_id: number;
  competition_name: string;
  country_name: string | null;
  season_id: number;
  season_name: string;
  created_at: string;
}

export interface Team {
  id: number;
  team_id: number;
  team_name: string;
  country: string | null;
  created_at: string;
}

export interface Match {
  id: number;
  match_id: number;
  competition_id: number | null;
  season_id: number;
  match_date: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number;
  away_score: number;
  live_home_score: number;
  live_away_score: number;
  stadium: string | null;
  referee: string | null;
  match_status: string;
  match_status_live: 'scheduled' | 'upcoming' | 'live' | 'finished' | 'postponed';
  current_minute: number | null;
  is_featured: boolean;
  kick_off: string | null;
  match_week: number | null;
  competition_stage: string | null;
  season_name: string | null;
  home_team_manager: string | null;
  away_team_manager: string | null;
  created_at: string;
  home_team?: Team;
  away_team?: Team;
  competition?: Competition;
}

export interface Player {
  id: number;
  player_id: number;
  player_name: string;
  player_nickname: string | null;
  jersey_number: number | null;
  country: string | null;
  position: string | null;
  created_at: string;
}

export interface Event {
  id: number;
  event_id: string;
  match_id: number | null;
  event_index: number;
  period: number;
  timestamp: string;
  minute: number | null;
  second: number | null;
  event_type: string;
  team_id: number | null;
  player_id: number | null;
  position_x: number | null;
  position_y: number | null;
  end_position_x: number | null;
  end_position_y: number | null;
  outcome: string | null;
  body_part: string | null;
  technique: string | null;
  xg: number | null;
  pass_length: number | null;
  pass_angle: number | null;
  pass_height: string | null;
  pass_type: string | null;
  carry_distance: number | null;
  under_pressure: boolean;
  counterpress: boolean;
  created_at: string;
  player?: Player;
  team?: Team;
}

export interface TacticalMetric {
  id: number;
  match_id: number | null;
  team_id: number | null;
  metric_type: string;
  metric_name: string;
  metric_value: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  team?: Team;
}

export interface PlayerStats {
  id: number;
  player_id: number | null;
  match_id: number | null;
  team_id: number | null;
  minutes_played: number;
  passes_completed: number;
  passes_attempted: number;
  progressive_passes: number;
  shots: number;
  shots_on_target: number;
  total_xg: number;
  carries: number;
  carry_distance: number;
  progressive_carries: number;
  pressures: number;
  successful_pressures: number;
  dribbles_completed: number;
  dribbles_attempted: number;
  interceptions: number;
  tackles: number;
  created_at: string;
  player?: Player;
  team?: Team;
  match?: Match;
}

// Analytics specific types
export interface PassNetworkNode {
  player_id: number;
  player_name: string;
  position_x: number;
  position_y: number;
  passes_received: number;
  passes_made: number;
}

export interface PassNetworkEdge {
  from_player_id: number;
  to_player_id: number;
  pass_count: number;
  success_rate: number;
}

export interface ShotMapData {
  position_x: number;
  position_y: number;
  xg: number;
  outcome: string;
  player_name: string;
  minute: number;
}

export interface HeatMapData {
  position_x: number;
  position_y: number;
  intensity: number;
}

export interface PlayerComparison {
  player_id: number;
  player_name: string;
  metrics: {
    [key: string]: number;
  };
}

// Advanced Analytics Types
export interface Manager {
  id: number;
  manager_id: number;
  manager_name: string;
  nationality: string | null;
  date_of_birth: string | null;
  coaching_style: string | null;
  preferred_formation: string | null;
  created_at: string;
}

export interface ManagerPerformance {
  id: number;
  manager_id: number | null;
  team_id: number | null;
  season_id: number;
  competition_id: number | null;
  matches_managed: number;
  wins: number;
  draws: number;
  losses: number;
  points_per_game: number | null;
  goals_scored: number;
  goals_conceded: number;
  final_position: number | null;
  points_from_relegation: number | null;
  is_relegation_battle: boolean;
  survival_success: boolean | null;
  epl_specialist: boolean;
  created_at: string;
  manager?: Manager;
  team?: Team;
  competition?: Competition;
}

export interface Injury {
  id: number;
  player_id: number | null;
  injury_type: string;
  injury_severity: string | null;
  injury_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  days_out: number | null;
  matches_missed: number;
  body_part: string | null;
  recurring: boolean;
  created_at: string;
  player?: Player;
}

export interface AIPrediction {
  id: number;
  prediction_type: string;
  entity_type: string;
  entity_id: number;
  prediction_value: number | null;
  confidence_score: number | null;
  prediction_date: string;
  actual_value: number | null;
  accuracy: number | null;
  model_version: string | null;
  features: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UndiscoveredMetric {
  id: number;
  metric_name: string;
  metric_category: string;
  entity_type: string;
  entity_id: number;
  metric_value: number | null;
  percentile: number | null;
  season_id: number | null;
  calculation_method: string | null;
  insights: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface InjuryRiskAssessment {
  player_id: number;
  player_name: string;
  total_injuries: number;
  recurring_injuries: number;
  total_days_out: number;
  total_matches_missed: number;
  injury_risk_score: number;
  most_common_injury: string;
  last_injury_date: string | null;
}