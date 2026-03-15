import { supabase } from './supabase';
import type {
  Competition,
  Team,
  Match,
  Player,
  Event,
  TacticalMetric,
  PlayerStats,
} from '@/types';

// Competitions API
export async function getCompetitions() {
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .order('competition_name');

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Competition[];
}

export async function getCompetitionById(competitionId: number) {
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('competition_id', competitionId)
    .maybeSingle();

  if (error) throw error;
  return data as Competition | null;
}

// Teams API
export async function getTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('team_name');

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Team[];
}

export async function getTeamById(teamId: number) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('team_id', teamId)
    .maybeSingle();

  if (error) throw error;
  return data as Team | null;
}

// Matches API
export async function getMatches(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(team_id, team_name, country),
      away_team:teams!matches_away_team_id_fkey(team_id, team_name, country),
      competition:competitions(competition_id, competition_name, season_name)
    `)
    .order('match_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Match[];
}

export async function getMatchById(matchId: number) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(team_id, team_name, country),
      away_team:teams!matches_away_team_id_fkey(team_id, team_name, country),
      competition:competitions(competition_id, competition_name, season_name)
    `)
    .eq('match_id', matchId)
    .maybeSingle();

  if (error) throw error;
  return data as Match | null;
}

export async function getMatchesByCompetition(competitionId: number) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(team_id, team_name, country),
      away_team:teams!matches_away_team_id_fkey(team_id, team_name, country)
    `)
    .eq('competition_id', competitionId)
    .order('match_date', { ascending: false });

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Match[];
}

export async function getMatchesByTeam(teamId: number) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(team_id, team_name, country),
      away_team:teams!matches_away_team_id_fkey(team_id, team_name, country),
      competition:competitions(competition_id, competition_name, season_name)
    `)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order('match_date', { ascending: false });

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Match[];
}

// Players API
export async function getPlayers(limit = 100, offset = 0) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('player_name')
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Player[];
}

export async function getPlayerById(playerId: number) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();

  if (error) throw error;
  return data as Player | null;
}

export async function searchPlayers(searchTerm: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .ilike('player_name', `%${searchTerm}%`)
    .order('player_name')
    .limit(20);

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Player[];
}

// Events API
export async function getEventsByMatch(matchId: number, eventType?: string) {
  let query = supabase
    .from('events')
    .select(`
      *,
      player:players(player_id, player_name, position),
      team:teams(team_id, team_name)
    `)
    .eq('match_id', matchId)
    .order('event_index');

  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Event[];
}

export async function getEventsByPlayer(playerId: number, limit = 100) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      player:players(player_id, player_name, position),
      team:teams(team_id, team_name)
    `)
    .eq('player_id', playerId)
    .order('id', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Event[];
}

// Tactical Metrics API
export async function getTacticalMetricsByMatch(matchId: number) {
  const { data, error } = await supabase
    .from('tactical_metrics')
    .select(`
      *,
      team:teams(team_id, team_name)
    `)
    .eq('match_id', matchId)
    .order('metric_type');

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as TacticalMetric[];
}

export async function getTacticalMetricsByTeam(teamId: number, metricType?: string) {
  let query = supabase
    .from('tactical_metrics')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (metricType) {
    query = query.eq('metric_type', metricType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as TacticalMetric[];
}

// Player Stats API
export async function getPlayerStatsByMatch(matchId: number) {
  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      *,
      player:players(player_id, player_name, position, jersey_number),
      team:teams(team_id, team_name)
    `)
    .eq('match_id', matchId)
    .order('minutes_played', { ascending: false });

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as PlayerStats[];
}

export async function getPlayerStatsByPlayer(playerId: number) {
  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      *,
      player:players(player_id, player_name, position),
      team:teams(team_id, team_name),
      match:matches(match_id, match_date, home_score, away_score)
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as PlayerStats[];
}

export async function getAggregatedPlayerStats(playerId: number) {
  const stats = await getPlayerStatsByPlayer(playerId);
  
  if (stats.length === 0) return null;

  const aggregated = stats.reduce((acc, stat) => ({
    total_matches: acc.total_matches + 1,
    total_minutes: acc.total_minutes + stat.minutes_played,
    total_passes_completed: acc.total_passes_completed + stat.passes_completed,
    total_passes_attempted: acc.total_passes_attempted + stat.passes_attempted,
    total_progressive_passes: acc.total_progressive_passes + stat.progressive_passes,
    total_shots: acc.total_shots + stat.shots,
    total_shots_on_target: acc.total_shots_on_target + stat.shots_on_target,
    total_xg: acc.total_xg + stat.total_xg,
    total_carries: acc.total_carries + stat.carries,
    total_carry_distance: acc.total_carry_distance + stat.carry_distance,
    total_progressive_carries: acc.total_progressive_carries + stat.progressive_carries,
    total_pressures: acc.total_pressures + stat.pressures,
    total_successful_pressures: acc.total_successful_pressures + stat.successful_pressures,
  }), {
    total_matches: 0,
    total_minutes: 0,
    total_passes_completed: 0,
    total_passes_attempted: 0,
    total_progressive_passes: 0,
    total_shots: 0,
    total_shots_on_target: 0,
    total_xg: 0,
    total_carries: 0,
    total_carry_distance: 0,
    total_progressive_carries: 0,
    total_pressures: 0,
    total_successful_pressures: 0,
  });

  return {
    ...aggregated,
    pass_completion_rate: aggregated.total_passes_attempted > 0 
      ? (aggregated.total_passes_completed / aggregated.total_passes_attempted) * 100 
      : 0,
    shot_accuracy: aggregated.total_shots > 0 
      ? (aggregated.total_shots_on_target / aggregated.total_shots) * 100 
      : 0,
    pressure_success_rate: aggregated.total_pressures > 0 
      ? (aggregated.total_successful_pressures / aggregated.total_pressures) * 100 
      : 0,
  };
}

// Dashboard API
export async function getDashboardStats() {
  const [competitions, teams, matches, players] = await Promise.all([
    supabase.from('competitions').select('id', { count: 'exact', head: true }),
    supabase.from('teams').select('id', { count: 'exact', head: true }),
    supabase.from('matches').select('id', { count: 'exact', head: true }),
    supabase.from('players').select('id', { count: 'exact', head: true }),
  ]);

  return {
    total_competitions: competitions.count || 0,
    total_teams: teams.count || 0,
    total_matches: matches.count || 0,
    total_players: players.count || 0,
  };
}
