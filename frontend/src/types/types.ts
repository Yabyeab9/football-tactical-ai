// Football Tactical AI Platform Types

export type EntityId = string;

export interface PitchCoordinate {
  x: number;
  y: number;
}

export interface TeamSummary {
  id: EntityId;
  name: string;
  shortName: string;
  competition: string;
  rank: number;
  possession: number;
  passAccuracy: number;
  ppda: number;
  xgPer90: number;
  xgaPer90: number;
  createdAt: string;
}

export interface PlayerProfile {
  id: EntityId;
  name: string;
  position: string;
  squadNumber: number | null;
  nationality: string | null;
  heightCm: number | null;
  weightKg: number | null;
  dominantFoot: "left" | "right" | "both" | null;
  role: string;
  marketValue: number | null;
  currentTeamId: EntityId;
  createdAt: string;
}

export interface MatchMetadata {
  id: EntityId;
  competition: string;
  season: string;
  venue: string | null;
  kickoffUtc: string;
  homeTeamId: EntityId;
  awayTeamId: EntityId;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "finished" | "postponed";
  minute: number | null;
  attendance?: number | null;
}

export interface MatchEvent {
  id: EntityId;
  matchId: EntityId;
  eventIndex: number;
  period: number;
  minute: number;
  second: number;
  type: string;
  subtype: string | null;
  teamId: EntityId;
  playerId: EntityId | null;
  targetPlayerId: EntityId | null;
  location: PitchCoordinate | null;
  endLocation: PitchCoordinate | null;
  outcome: "successful" | "failed" | "blocked" | "intercepted" | "uncertain";
  xg: number | null;
  xT: number | null;
  ppda: number | null;
  passLength: number | null;
  passAngle: number | null;
  passHeight: string | null;
  passType: string | null;
  carryDistance: number | null;
  underPressure: boolean;
  createdAt: string;
}

export interface MatchSummary {
  metadata: MatchMetadata;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  events: MatchEvent[];
}

export interface PitchControlCell {
  x: number;
  y: number;
  controlProbability: number;
  controllingTeamId: EntityId | null;
}

export interface PassNetworkNode {
  id: EntityId;
  name: string;
  role: string;
  teamId: EntityId;
  passesReceived: number;
  passesCompleted: number;
  x: number;
  y: number;
  degreeCentrality: number;
  betweenness: number;
}

export interface PassNetworkEdge {
  source: EntityId;
  target: EntityId;
  weight: number;
  successRate: number;
  combinedActions: number;
}

export interface TacticalMetric {
  id: EntityId;
  matchId: EntityId;
  teamId: EntityId | null;
  playerId: EntityId | null;
  name: string;
  category: string;
  value: number;
  rank: number | null;
  percentile: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PitchMapDatum {
  coordinate: PitchCoordinate;
  intensity: number;
  metric: string;
}

export interface ShotMapPoint {
  coordinate: PitchCoordinate;
  xg: number;
  expectedThreat: number;
  outcome: string;
  playerId: EntityId;
  minute: number;
}

export interface PlayerComparisonRow {
  playerId: EntityId;
  playerName: string;
  metrics: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: {
    schemaVersion: string;
    [key: string]: unknown;
  };
}

export interface InsightFlag {
  id: string;
  category: "trend" | "anomaly" | "tactical" | "player";
  headline: string;
  detail: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
}
