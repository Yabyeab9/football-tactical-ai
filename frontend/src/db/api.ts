import { supabase } from './supabase';
import type {
  Competition,
  Team,
  Match,
  Player,
  Event,
  TacticalMetric,
  PlayerStats,
  Manager,
  ManagerPerformance,
  Injury,
  InjuryRiskAssessment,
  AIPrediction,
  UndiscoveredMetric,
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
export async function getMatches(
  limit = 50,
  offset = 0,
  filters?: {
    competition_id?: number;
    team_id?: number;
    season_name?: string;
    sort_by?: 'date' | 'competition' | 'match_week' | 'goals';
    sort_order?: 'asc' | 'desc';
    min_goals?: number;
    max_goals?: number;
  }
) {
  try {
    const modules = import.meta.glob('/src/data/matches/*/*.json');

    const allMatches: any[] = [];

    // load all files
    for (const path in modules) {
      const mod: any = await modules[path]();
      const data = mod.default;

      // some files are arrays, some single object
      if (Array.isArray(data)) {
        allMatches.push(...data);
      } else {
        allMatches.push(data);
      }
    }

    let matches = allMatches;

    // ✅ filtering
    if (filters?.competition_id) {
      matches = matches.filter(m => m.competition?.competition_id === filters.competition_id);
    }

    if (filters?.team_id) {
      matches = matches.filter(
        m =>
          m.home_team?.home_team_id === filters.team_id ||
          m.away_team?.away_team_id === filters.team_id
      );
    }

    if (filters?.season_name) {
      matches = matches.filter(m => m.season?.season_name === filters.season_name);
    }

    // ✅ goal filter
    if (filters?.min_goals !== undefined || filters?.max_goals !== undefined) {
      matches = matches.filter(m => {
        const total = (m.home_score || 0) + (m.away_score || 0);
        if (filters.min_goals !== undefined && total < filters.min_goals) return false;
        if (filters.max_goals !== undefined && total > filters.max_goals) return false;
        return true;
      });
    }

    // ✅ sorting
    const asc = filters?.sort_order === 'asc';

    matches.sort((a, b) => {
      switch (filters?.sort_by) {
        case 'competition':
          return asc
            ? a.competition?.competition_id - b.competition?.competition_id
            : b.competition?.competition_id - a.competition?.competition_id;

        case 'match_week':
          return asc ? a.match_week - b.match_week : b.match_week - a.match_week;

        case 'goals':
          const gA = (a.home_score || 0) + (a.away_score || 0);
          const gB = (b.home_score || 0) + (b.away_score || 0);
          return asc ? gA - gB : gB - gA;

        case 'date':
        default:
          return asc
            ? new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
            : new Date(b.match_date).getTime() - new Date(a.match_date).getTime();
      }
    });
    const formatted = matches.map(match => ({
      match_id: match.match_id,
      home_team: { team_name: match.home_team?.home_team_name },
      away_team: { team_name: match.away_team?.away_team_name },
      match_date: match.match_date,
      home_score: match.home_score,
      away_score: match.away_score,
      competition: match.competition,
    }));

    return formatted.slice(offset, offset + limit);

  } catch (err) {
    console.error("Failed to load matches:", err);
    return [];
  }
}
export async function getPlayerStatsByMatch(matchId: number): Promise<any[]> {
  try {
    const eventModules = import.meta.glob('/src/data/events/*.json');
    const eventPath = `/src/data/events/${matchId}.json`;

    if (!eventModules[eventPath]) return [];

    const mod: any = await eventModules[eventPath]();
    const events = mod.default;
    const playerMap = new Map();

    events.forEach((event: any) => {
      const teamId = event.team?.id;
      const player = event.player;

      if (player && teamId) {
        if (!playerMap.has(player.id)) {
          playerMap.set(player.id, {
            id: player.id,
            team_id: teamId,
            player: { player_name: player.name },
            minutes_played: 90, // Simplified; can be refined with sub events
            passes_attempted: 0,
            passes_completed: 0,
            shots: 0,
          });
        }

        const stats = playerMap.get(player.id);

        // Pass Aggregation
        if (event.type.name === 'Pass') {
          stats.passes_attempted++;
          // In StatsBomb, a pass is complete if it has no 'outcome' property
          if (!event.pass?.outcome) {
            stats.passes_completed++;
          }
        }

        // Shot Aggregation
        if (event.type.name === 'Shot') {
          stats.shots++;
        }
      }
    });

    return Array.from(playerMap.values());
  } catch (err) {
    console.error("Error fetching player stats:", err);
    return [];
  }
}

export async function getTacticalMetricsByMatch(matchId: number): Promise<any[]> {
  try {
    const eventModules = import.meta.glob('/src/data/events/*.json');
    const eventPath = `/src/data/events/${matchId}.json`;

    if (!eventModules[eventPath]) return [];

    const mod: any = await eventModules[eventPath]();
    const events = mod.default;

    let teamIds: number[] = [];
    const teamStats: Record<number, { passes: number; xG: number }> = {};

    events.forEach((event: any) => {
      const teamId = event.team?.id;
      if (!teamId) return;

      if (!teamStats[teamId]) {
        teamStats[teamId] = { passes: 0, xG: 0 };
        teamIds.push(teamId);
      }

      if (event.type.name === 'Pass') {
        teamStats[teamId].passes++;
      }

      if (event.type.name === 'Shot') {
        teamStats[teamId].xG += event.shot?.statsbomb_xg || 0;
      }
    });

    const totalPasses = Object.values(teamStats).reduce((acc, curr) => acc + curr.passes, 0);
    const metrics: any[] = [];

    teamIds.forEach((id) => {
      const stats = teamStats[id];

      // Possession Metric
      metrics.push({
        id: `pos-${id}`,
        team_id: id,
        metric_name: 'Possession',
        metric_type: 'control',
        metric_value: totalPasses > 0 ? (stats.passes / totalPasses) * 100 : 0
      });

      // xG Metric
      metrics.push({
        id: `xg-${id}`,
        team_id: id,
        metric_name: 'Expected Goals (xG)',
        metric_type: 'attack',
        metric_value: stats.xG
      });

      // Volume Metric
      metrics.push({
        id: `pass-${id}`,
        team_id: id,
        metric_name: 'Total Passes',
        metric_type: 'distribution',
        metric_value: stats.passes
      });
    });

    return metrics;
  } catch (err) {
    console.error("Error fetching tactical metrics:", err);
    return [];
  }
}
export async function getMatchById(matchId: number) {
  try {
    const modules = import.meta.glob('/src/data/matches/**/*.json');
    const events = import.meta.glob('/src/data/events/{matchId}.json');

    // Loop through all files
    for (const path in modules) {
      const mod: any = await modules[path]();
      const data = mod.default;

      // Find the match inside this file
      const match = data.find((m: any) => m.match_id === matchId);

      if (match) {
        // ✅ Format same as your list view
        return {
          match_id: match.match_id,
          home_team: { team_name: match.home_team?.home_team_name },
          away_team: { team_name: match.away_team?.away_team_name },
          match_date: match.match_date,
          home_score: match.home_score,
          away_score: match.away_score,
          stadium: match.stadium?.name,
          referee: match.referee?.name,
          country:match.stadium.country?.name,
          kick_off: match.kick_off,
          competition: match.competition,
           home_team_manager: match.home_team?.managers?.[0]?.name,
            away_team_manager: match.away_team?.managers?.[0]?.name,
            match_week: match.match_week,

        };
      }
    }

    // Not found
    return null;

  } catch (err) {
    console.error("Failed to load match:", err);
    return null;
  }
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
export async function getTacticalMet1ricsByMatch(matchId: number) {
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
export async function getPlayerSt1atsByMatch(matchId: number) {
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
  try {
    const res = await fetch('/src/data/dashboard.json');
    const data = await res.json();

    return {
      total_competitions: data.total_competitions || 0,
      total_teams: data.total_teams || 0,
      total_matches: data.total_matches || 0,
      total_players: data.total_players || 0,
    };
  } catch (err) {
    console.error("Failed to load dashboard stats:", err);
    return {
      total_competitions: 0,
      total_teams: 0,
      total_matches: 0,
      total_players: 0,
    };
  }

}

// Managers API
export async function getManagers() {
  const { data, error } = await supabase
    .from('managers')
    .select('*')
    .order('manager_name');

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Manager[];
}

export async function getManagerById(managerId: number) {
  const { data, error } = await supabase
    .from('managers')
    .select('*')
    .eq('manager_id', managerId)
    .maybeSingle();

  if (error) throw error;
  return data as Manager | null;
}

export async function getManagerPerformance(managerId: number) {
  const { data, error } = await supabase
    .from('manager_performance')
    .select(`
      *,
      manager:managers(manager_id, manager_name, nationality, coaching_style),
      team:teams(team_id, team_name),
      competition:competitions(competition_id, competition_name)
    `)
    .eq('manager_id', managerId)
    .order('season_id', { ascending: false });

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as ManagerPerformance[];
}

export async function getEPLSpecialists() {
  const { data, error } = await supabase
    .from('manager_performance')
    .select(`
      *,
      manager:managers(manager_id, manager_name, nationality, coaching_style, preferred_formation)
    `)
    .eq('epl_specialist', true)
    .order('points_per_game', { ascending: false })
    .limit(10);

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as ManagerPerformance[];
}

export async function getRelegationSpecialists() {
  const { data, error } = await supabase
    .from('manager_performance')
    .select(`
      *,
      manager:managers(manager_id, manager_name, nationality, coaching_style)
    `)
    .eq('is_relegation_battle', true)
    .eq('survival_success', true)
    .order('points_from_relegation', { ascending: true })
    .limit(10);

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as ManagerPerformance[];
}

// Injuries API
export async function getInjuriesByPlayer(playerId: number) {
  const { data, error } = await supabase
    .from('injuries')
    .select(`
      *,
      player:players(player_id, player_name, position)
    `)
    .eq('player_id', playerId)
    .order('injury_date', { ascending: false });

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Injury[];
}

export async function getInjuryPronePlayersAnalysis() {
  const { data, error } = await supabase
    .from('injuries')
    .select(`
      player_id,
      player:players(player_id, player_name, position),
      injury_type,
      days_out,
      matches_missed,
      recurring,
      injury_date
    `)
    .order('injury_date', { ascending: false });

  if (error) throw error;

  const injuryData = Array.isArray(data) ? data : [];

  // Aggregate injury data by player
  const playerInjuryMap = new Map<number, InjuryRiskAssessment>();

  injuryData.forEach((injury: any) => {
    const playerId = injury.player_id;
    if (!playerId) return;

    if (!playerInjuryMap.has(playerId)) {
      playerInjuryMap.set(playerId, {
        player_id: playerId,
        player_name: injury.player?.player_name || 'Unknown',
        total_injuries: 0,
        recurring_injuries: 0,
        total_days_out: 0,
        total_matches_missed: 0,
        injury_risk_score: 0,
        most_common_injury: '',
        last_injury_date: null,
      });
    }

    const assessment = playerInjuryMap.get(playerId)!;
    assessment.total_injuries++;
    if (injury.recurring) assessment.recurring_injuries++;
    assessment.total_days_out += injury.days_out || 0;
    assessment.total_matches_missed += injury.matches_missed || 0;
    if (!assessment.last_injury_date || injury.injury_date > assessment.last_injury_date) {
      assessment.last_injury_date = injury.injury_date;
    }
  });

  // Calculate risk scores
  const assessments = Array.from(playerInjuryMap.values()).map(assessment => ({
    ...assessment,
    injury_risk_score: Math.min(
      (assessment.total_injuries * 10 +
       assessment.recurring_injuries * 15 +
       assessment.total_matches_missed * 2) / 10,
      10
    ),
  }));

  return assessments.sort((a, b) => b.injury_risk_score - a.injury_risk_score);
}

// AI Predictions API
export async function getAIPredictions(predictionType?: string) {
  let query = supabase
    .from('ai_predictions')
    .select('*')
    .order('prediction_date', { ascending: false });

  if (predictionType) {
    query = query.eq('prediction_type', predictionType);
  }

  const { data, error } = await query.limit(50);

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as AIPrediction[];
}

export async function getAIPredictionsByEntity(entityType: string, entityId: number) {
  const { data, error } = await supabase
    .from('ai_predictions')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('prediction_date', { ascending: false });

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as AIPrediction[];
}

// Undiscovered Metrics API
export async function getUndiscoveredMetrics(category?: string) {
  let query = supabase
    .from('undiscovered_metrics')
    .select('*')
    .order('percentile', { ascending: false });

  if (category) {
    query = query.eq('metric_category', category);
  }

  const { data, error } = await query.limit(50);

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as UndiscoveredMetric[];
}

export async function getUndiscoveredMetricsByEntity(entityType: string, entityId: number) {
  const { data, error } = await supabase
    .from('undiscovered_metrics')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('percentile', { ascending: false });

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as UndiscoveredMetric[];
}
