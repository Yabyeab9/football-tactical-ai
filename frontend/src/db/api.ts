import axios, { type AxiosError } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  timeout: 20000,
});

type ApiError = {
  code?: number;
  message: string;
  details?: Record<string, unknown>;
  type?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: ApiError;
  timestamp: string;
};

export type ProviderStatus = {
  provider: string;
  success: boolean;
  latencyMs?: number | null;
  latency_ms?: number | null;
  itemCount?: number;
  item_count?: number;
  error: string | null;
  stale: boolean;
};

export type TeamRef = {
  id: string | null;
  name: string;
  shortName?: string | null;
  short_name?: string | null;
  crest?: string | null;
  providerIds?: Record<string, string>;
  provider_ids?: Record<string, string>;
};

export type LiveMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  kickoff: string;
  score: {
    home: number;
    away: number;
  };
  venue: string | null;
  source: string;
  competition: {
    id?: string | null;
    name: string;
    code?: string | null;
    country?: string | null;
  };
  minute: number;
  providers: string[];
  externalIds: Record<string, string>;
  external_ids: Record<string, string>;
  homeTeamRef: TeamRef;
  awayTeamRef: TeamRef;
  home_team: TeamRef;
  away_team: TeamRef;
  scheduledAt: string;
  scheduled_at: string;
};

export type LiveMatchesResponse = {
  matches: LiveMatch[];
  summary: {
    totalMatches: number;
    total_matches: number;
    liveMatches: number;
    live_matches: number;
    trackedCompetitions: number;
    tracked_competitions: number;
  };
  providerStatus: ProviderStatus[];
  provider_status: ProviderStatus[];
};

export type MatchHistoryResponse = {
  team: {
    id: string;
    name: string;
    shortName?: string;
    crest?: string | null;
    venue?: string | null;
  };
  matches: Array<{
    id: string;
    date: string;
    competition: string;
    venue: string;
    opponent: string;
    status: string;
    score: { for: number; against: number };
    outcome: "W" | "D" | "L";
    metrics?: Record<string, number>;
  }>;
  trends: {
    form: string[];
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goals_for: number;
    goalsAgainst: number;
    goals_against: number;
    pointsPerMatch: number;
    points_per_match: number;
    formIndex: number;
    form_index: number;
    attackStrength: number;
    attack_strength: number;
    defenseStrength: number;
    defense_strength: number;
    estimatedPossessionTrend: number;
    estimated_possession_trend: number;
  };
  teamStats: {
    formIndex: number;
    attackStrength: number;
    defenseStrength: number;
    estimatedPossessionTrend: number;
  };
  team_stats: {
    form_index: number;
    attack_strength: number;
    defense_strength: number;
    estimated_possession_trend: number;
  };
  providerStatus: ProviderStatus[];
  provider_status: ProviderStatus[];
};

export type PlayerAnalyticsResponse = {
  player: {
    id: string;
    name: string;
    position?: string | null;
    nationality?: string | null;
    shirtNumber?: number | null;
    shirt_number?: number | null;
    role?: string | null;
    currentTeam?: TeamRef;
    current_team?: TeamRef;
  };
  analytics: {
    minutesPlayed?: number;
    minutes_played?: number;
    matchesOnPitch?: number;
    matches_on_pitch?: number;
    starts?: number;
    goals?: number;
    assists?: number;
    minutesPerMatch?: number;
    minutes_per_match?: number;
    goalsPer90?: number;
    goals_per_90?: number;
    assistsPer90?: number;
    assists_per_90?: number;
    goalContributionsPer90?: number;
    goal_contributions_per_90?: number;
    availabilityRate?: number;
    availability_rate?: number;
    formIndex?: number;
    form_index?: number;
    performanceRating?: number;
    performance_rating?: number;
    inferredShotsPer90?: number;
    inferred_shots_per_90?: number;
    inferredKeyPassesPer90?: number;
    inferred_key_passes_per_90?: number;
    contributionHeat?: Record<string, number>;
    contribution_heat?: Record<string, number>;
    roleProfile?: {
      primaryRole: string;
      primary_role: string;
      styleTags: string[];
      style_tags: string[];
    };
    role_profile?: {
      primaryRole: string;
      primary_role: string;
      styleTags: string[];
      style_tags: string[];
    };
  };
  recentMatches: Array<{
    id: string;
    date: string;
    competition: string;
    opponent: string | null;
    score: { home?: number; away?: number };
    status: string;
    performanceRating?: number;
    performance_rating?: number;
  }>;
  recent_matches: Array<{
    id: string;
    date: string;
    competition: string;
    opponent: string | null;
    score: { home?: number; away?: number };
    status: string;
    performanceRating?: number;
    performance_rating?: number;
  }>;
  providerStatus: ProviderStatus[];
  provider_status: ProviderStatus[];
};

export type InjuryWatchResponse = {
  watchlist: Array<{
    playerId: string;
    player_id: string;
    playerName: string;
    player_name: string;
    position?: string | null;
    shirtNumber?: number | null;
    shirt_number?: number | null;
    team: {
      id: string;
      name: string;
      crest?: string | null;
    };
    riskScore: number;
    risk_score: number;
    status: "HIGH_RISK" | "MONITOR" | "AVAILABLE";
    fatigueIndex: number;
    fatigue_index: number;
    fatigueLevel: string;
    fatigue_level: string;
    minutesPlayedRecent: number;
    minutes_played_recent: number;
    averageMinutes: number;
    average_minutes: number;
    startsRecent: number;
    starts_recent: number;
    overloadDetected: boolean;
    overload_detected: boolean;
    reasons: string[];
  }>;
  summary: {
    highRisk: number;
    high_risk: number;
    monitor: number;
    available: number;
  };
  providerStatus: ProviderStatus[];
  provider_status: ProviderStatus[];
};

export type TeamIntelligenceResponse = {
  team: {
    id: string;
    name: string;
    shortName?: string;
    logo?: string | null;
    crest?: string | null;
    venue?: string | null;
    website?: string | null;
    clubColors?: string | null;
    club_colors?: string | null;
    founded?: number | null;
    league?: Record<string, unknown>;
    manager?: {
      id: string;
      name: string;
      nationality?: string | null;
    };
  };
  stats: Record<string, number>;
  recentForm: MatchHistoryResponse["trends"];
  recent_form: MatchHistoryResponse["trends"];
  squadSummary: Record<string, number>;
  squad_summary: Record<string, number>;
  squad: Array<{
    id: string;
    name: string;
    position?: string | null;
    shirtNumber?: number | null;
    shirt_number?: number | null;
    nationality?: string | null;
    age?: number | null;
    availability?: {
      status: string;
      riskScore?: number;
      risk_score?: number;
      label?: string;
    };
    roleCategory?: string;
    role_category?: string;
  }>;
  providerStatus: ProviderStatus[];
  provider_status: ProviderStatus[];
};

export type TeamSquadResponse = {
  team: TeamIntelligenceResponse["team"];
  squad: TeamIntelligenceResponse["squad"];
  startingXI: TeamIntelligenceResponse["squad"];
  starting_xi: TeamIntelligenceResponse["squad"];
  bench: TeamIntelligenceResponse["squad"];
  availabilitySummary: Record<string, number>;
  availability_summary: Record<string, number>;
  providerStatus: ProviderStatus[];
  provider_status: ProviderStatus[];
};

export type ManagerProfileResponse = {
  manager: {
    id: string;
    name: string;
    nationality?: string | null;
    dateOfBirth?: string | null;
    date_of_birth?: string | null;
    team: {
      id: string;
      name: string;
      crest?: string | null;
    };
    tacticalStyle: {
      label: string;
      summary: string;
      traits: string[];
    };
    tactical_style: {
      label: string;
      summary: string;
      traits: string[];
    };
  };
  record: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    pointsPerMatch: number;
    points_per_match: number;
  };
  teamHistory: MatchHistoryResponse["matches"];
  team_history: MatchHistoryResponse["matches"];
  providerStatus: ProviderStatus[];
  provider_status: ProviderStatus[];
};

export type TacticalAnalysisResponse = {
  match: LiveMatch & {
    competition: {
      name: string;
      code?: string | null;
      country?: string | null;
    };
  };
  team_analysis: {
    teamName: string;
    team_name: string;
    formation: string;
    strengths: string[];
    weaknesses: string[];
    metrics: Record<string, number>;
    momentum: number;
  };
  opponent_analysis: {
    teamName: string;
    team_name: string;
    formation: string;
    strengths: string[];
    weaknesses: string[];
    metrics: Record<string, number>;
    momentum: number;
  };
  prediction: string;
  key_players: Array<{
    playerId: string;
    player_id: string;
    name: string;
    team: string;
    role: string;
    availability: string;
  }>;
  analysis: {
    formations: {
      home: string;
      away: string;
    };
    metrics: {
      home: Record<string, number>;
      away: Record<string, number>;
    };
    strengths: string[];
    weaknesses: string[];
    momentum?: {
      home: number;
      away: number;
      label: string;
    };
    prediction: {
      homeWin?: number;
      home_win?: number;
      draw: number;
      awayWin?: number;
      away_win?: number;
      verdict: string;
    };
  };
  timeline: Array<{
    minute: number;
    type: string;
    team: string;
    description: string;
  }>;
  context: {
    homeForm?: MatchHistoryResponse["trends"];
    home_form?: MatchHistoryResponse["trends"];
    awayForm?: MatchHistoryResponse["trends"];
    away_form?: MatchHistoryResponse["trends"];
    [key: string]: unknown;
  };
  providerStatus: ProviderStatus[];
  provider_status: ProviderStatus[];
};

export type DashboardSummaryResponse = {
  overviewCards: Array<{
    label: string;
    value: number;
    tone: string;
  }>;
  overview_cards: Array<{
    label: string;
    value: number;
    tone: string;
  }>;
  systemStatus: ProviderStatus[];
  system_status: ProviderStatus[];
  liveBoard: LiveMatch[];
  live_board: LiveMatch[];
  featuredMatch: LiveMatch | null;
  featured_match: LiveMatch | null;
  tacticalSpotlight: TacticalAnalysisResponse | null;
  tactical_spotlight: TacticalAnalysisResponse | null;
  injuryWatch: InjuryWatchResponse["watchlist"];
  injury_watch: InjuryWatchResponse["watchlist"];
  featuredPlayers: Array<{
    player: PlayerAnalyticsResponse["player"];
    analytics: PlayerAnalyticsResponse["analytics"];
    risk: {
      score: number;
      status: string;
    };
  }>;
  featured_players: Array<{
    player: PlayerAnalyticsResponse["player"];
    analytics: PlayerAnalyticsResponse["analytics"];
    risk: {
      score: number;
      status: string;
    };
  }>;
  featuredTeams: TeamIntelligenceResponse[];
  featured_teams: TeamIntelligenceResponse[];
  featuredManagers: ManagerProfileResponse[];
  featured_managers: ManagerProfileResponse[];
  predictionBoard: Array<{
    matchId: string;
    match_id: string;
    matchLabel: string;
    match_label: string;
    prediction: TacticalAnalysisResponse["analysis"]["prediction"];
  }>;
  prediction_board: Array<{
    matchId: string;
    match_id: string;
    matchLabel: string;
    match_label: string;
    prediction: TacticalAnalysisResponse["analysis"]["prediction"];
  }>;
};

export type AIChatResponse = {
  reply: string;
  engine: string;
  contextSummary?: Record<string, unknown>;
  context_summary?: Record<string, unknown>;
  generatedAt?: string;
  generated_at?: string;
};

function normalizeApiError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiEnvelope<unknown>>;
  const message =
    axiosError.response?.data?.error?.message ??
    axiosError.message ??
    "The football intelligence API request failed.";
  return new Error(message);
}

async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  try {
    const response = await request;
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "API request failed");
    }
    return response.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export function getLiveMatches() {
  return unwrap<LiveMatchesResponse>(api.get("/api/live-matches"));
}

export function getMatchHistory(teamId: string) {
  return unwrap<MatchHistoryResponse>(api.get(`/api/match-history/${teamId}`));
}

export function getTeamStats(teamId: string) {
  return unwrap<MatchHistoryResponse>(api.get(`/api/team-stats/${teamId}`));
}

export function getTeam(teamId: string) {
  return unwrap<TeamIntelligenceResponse>(api.get(`/api/teams/${teamId}`));
}

export function getTeamSquad(teamId: string) {
  return unwrap<TeamSquadResponse>(api.get(`/api/teams/${teamId}/squad`));
}

export function getPlayer(playerId: string) {
  return unwrap<PlayerAnalyticsResponse>(api.get(`/api/player/${playerId}`));
}

export function getPlayerStats(playerId: string) {
  return unwrap<PlayerAnalyticsResponse>(api.get(`/api/player-stats/${playerId}`));
}

export function getPlayerAnalysis(playerId: string) {
  return unwrap<PlayerAnalyticsResponse>(api.get(`/api/player-analysis/${playerId}`));
}

export function getManager(teamId: string) {
  return unwrap<ManagerProfileResponse>(api.get(`/api/managers/${teamId}`));
}

export function getInjuries(params?: { teamId?: string; matchId?: string }) {
  return unwrap<InjuryWatchResponse>(
    api.get("/api/injuries", {
      params: {
        team_id: params?.teamId,
        match_id: params?.matchId,
      },
    })
  );
}

export function getTacticalAnalysis(matchId: string) {
  return unwrap<TacticalAnalysisResponse>(api.get(`/api/tactical-analysis/${matchId}`));
}

export function getMatchAnalysis(matchId: string) {
  return unwrap<TacticalAnalysisResponse>(api.get(`/api/match/${matchId}/analysis`));
}

export function getMatchDetails(matchId: string) {
  return unwrap<TacticalAnalysisResponse>(api.get(`/api/match-details/${matchId}`));
}

export function getDashboardSummary() {
  return unwrap<DashboardSummaryResponse>(api.get("/api/dashboard-summary"));
}

export function sendAIChat(payload: {
  message: string;
  match_id?: string;
  player_id?: string;
  team_id?: string;
  conversation?: Array<{ role: string; content: string }>;
}) {
  return unwrap<AIChatResponse>(api.post("/api/ai-chat", payload));
}

export async function getTeams(): Promise<TeamIntelligenceResponse[]> {
  const summary = await getDashboardSummary();
  const featuredTeams = summary.featured_teams ?? summary.featuredTeams ?? [];
  if (featuredTeams.length) {
    return featuredTeams;
  }
  const live = await getLiveMatches();
  const teamIds = new Set<string>();
  const teams: TeamIntelligenceResponse[] = [];
  for (const match of live.matches) {
    for (const team of [match.home_team, match.away_team]) {
      if (team.id && !teamIds.has(team.id)) {
        teamIds.add(team.id);
        teams.push(await getTeam(team.id));
      }
    }
  }
  return teams;
}

export async function getManagers(): Promise<ManagerProfileResponse[]> {
  const summary = await getDashboardSummary();
  const featuredManagers = summary.featured_managers ?? summary.featuredManagers ?? [];
  if (featuredManagers.length) {
    return featuredManagers;
  }
  const teams = await getTeams();
  const managerPayloads = await Promise.all(
    teams.slice(0, 6).map((team) => getManager(team.team.id))
  );
  return managerPayloads;
}

export async function getAIPredictions(): Promise<DashboardSummaryResponse["prediction_board"]> {
  const summary = await getDashboardSummary();
  return summary.prediction_board ?? summary.predictionBoard ?? [];
}

export async function getCompetitions(): Promise<
  Array<{
    id: number;
    competition_id: number;
    competition_name: string;
    country_name: string | null;
    season_id: number;
    season_name: string;
    created_at: string;
  }>
> {
  const live = await getLiveMatches();
  return live.matches.reduce<
    Array<{
      id: number;
      competition_id: number;
      competition_name: string;
      country_name: string | null;
      season_id: number;
      season_name: string;
      created_at: string;
    }>
  >((items, match, index) => {
    const identifier = Number.parseInt(String(match.competition.id ?? index + 1), 10) || index + 1;
    if (!items.find((item) => item.competition_id === identifier)) {
      items.push({
        id: identifier,
        competition_id: identifier,
        competition_name: match.competition.name,
        country_name: match.competition.country ?? null,
        season_id: 2026,
        season_name: "Current Season",
        created_at: new Date().toISOString(),
      });
    }
    return items;
  }, []);
}

export async function getInjuryPronePlayersAnalysis(): Promise<InjuryWatchResponse["watchlist"]> {
  const injuries = await getInjuries();
  return injuries.watchlist;
}

export async function getEPLSpecialists(): Promise<ManagerProfileResponse[]> {
  return getManagers();
}

export async function getRelegationSpecialists(): Promise<ManagerProfileResponse[]> {
  return getManagers();
}

export async function getUndiscoveredMetrics(): Promise<
  Array<{
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
  }>
> {
  const summary = await getDashboardSummary();
  return [
    {
      id: 1,
      metric_name: "Provider stack coverage",
      metric_category: "management",
      entity_type: "system",
      entity_id: 1,
      metric_value: summary.system_status.length,
      percentile: 82,
      season_id: 2026,
      calculation_method: "Count of active normalized providers",
      insights: `${summary.system_status.length} providers are currently feeding the intelligence layer.`,
      metadata: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      metric_name: "Prediction board depth",
      metric_category: "performance",
      entity_type: "platform",
      entity_id: 2,
      metric_value: (summary.prediction_board ?? []).length,
      percentile: 78,
      season_id: 2026,
      calculation_method: "Count of tactical predictions ready for operator review",
      insights: `${(summary.prediction_board ?? []).length} matches are currently modelled by the tactical engine.`,
      metadata: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      metric_name: "Injury watch density",
      metric_category: "mental",
      entity_type: "platform",
      entity_id: 3,
      metric_value: (summary.injury_watch ?? []).length,
      percentile: 74,
      season_id: 2026,
      calculation_method: "Tracked players under active availability review",
      insights: `${(summary.injury_watch ?? []).length} players are on the current injury and fatigue watchlist.`,
      metadata: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 4,
      metric_name: "Manager intelligence coverage",
      metric_category: "management",
      entity_type: "platform",
      entity_id: 4,
      metric_value: (summary.featured_managers ?? []).length,
      percentile: 80,
      season_id: 2026,
      calculation_method: "Managers profiled in the dashboard intelligence layer",
      insights: `${(summary.featured_managers ?? []).length} managers currently have tactical-style summaries available.`,
      metadata: null,
      created_at: new Date().toISOString(),
    },
  ];
}
