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
  stadium: string | null;
  referee: string | null;
  match_status: string;
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
