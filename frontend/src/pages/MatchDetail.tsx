import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getMatchById,
  getTacticalMetricsByMatch,
  getPlayerStatsByMatch
} from '@/db/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Shirt,
  Target,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Match, TacticalMetric, PlayerStats } from '@/types';

// Helper component for sleek progress/possession visualization
const ProgressBar = ({ value }: { value: number }) => (
  <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden mt-1.5">
    <div
      className="h-full bg-primary transition-all duration-500 ease-out"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [tacticalMetrics, setTacticalMetrics] = useState<TacticalMetric[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatchData() {
      if (!matchId) return;

      try {
        const [matchData, metrics, stats] = await Promise.all([
          getMatchById(Number.parseInt(matchId)),
          getTacticalMetricsByMatch(Number.parseInt(matchId)),
          getPlayerStatsByMatch(Number.parseInt(matchId)),
        ]);

        setMatch(matchData);
        setTacticalMetrics(metrics);
        setPlayerStats(stats);
      } catch (error) {
        console.error('Error loading match data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMatchData();
  }, [matchId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 bg-muted" />
          <Skeleton className="h-64 w-full bg-muted" />
          <Skeleton className="h-96 w-full bg-muted" />
        </div>
      </MainLayout>
    );
  }

  if (!match) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Match not found</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/matches">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Matches
            </Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const homeMetrics = tacticalMetrics.filter(m => m.team_id === match.home_team_id);
  const awayMetrics = tacticalMetrics.filter(m => m.team_id === match.away_team_id);
  const homePlayerStats = playerStats.filter(s => s.team_id === match.home_team_id);
  const awayPlayerStats = playerStats.filter(s => s.team_id === match.away_team_id);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link to="/matches">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Match Details</h1>
            <p className="text-muted-foreground mt-1">
              {match.competition?.competition_name} • {match.season_name}
            </p>
          </div>
        </div>

        <Card className="pitch-gradient shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold tracking-tight">{match.home_team?.team_name}</h2>
                </div>
                  {match.home_team_manager && (
                  <p className="text-sm text-muted-foreground font-medium">
                    Manager: {match.home_team_manager}
                  </p>
                )}
                <div className="text-6xl font-bold mt-4 tracking-tighter">{match.home_score}</div>
              </div>

              <div className="text-center space-y-2">
                <Badge variant="outline" className="text-lg px-4 py-2 border-primary/20 bg-background/50 backdrop-blur-sm">
                  {match.match_status}
                </Badge>
                <div className="text-4xl font-bold text-muted-foreground/50 font-mono">VS</div>
                {match.match_week && (
                  <Badge variant="secondary" className="font-mono">Week {match.match_week}</Badge>
                )}
              </div>

              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold tracking-tight">{match.away_team?.team_name}</h2>
                </div>
                {match.away_team_manager && (
                  <p className="text-sm text-muted-foreground font-medium">
                    Manager: {match.away_team_manager}
                  </p>
                )}
                <div className="text-6xl font-bold mt-4 tracking-tighter">{match.away_score}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Date</CardTitle>
              <Calendar className="h-4 w-4 text-primary/70" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{match.match_date}</div>
              {match.kick_off && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Kick-off: {match.kick_off.slice(0, 5)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stadium</CardTitle>
              <MapPin className="h-4 w-4 text-primary/70" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{match.stadium || 'N/A'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {match.country || 'Unknown'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Competition</CardTitle>
              <Trophy className="h-4 w-4 text-primary/70" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{match.competition?.competition_name}</div>
              <p className="text-xs text-muted-foreground mt-1">
               Match Week {match.match_week || 'Regular Season'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Referee</CardTitle>
              <Shirt className="h-4 w-4 text-primary/70" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{match.referee || 'N/A'}</div>
              <p className="text-xs text-muted-foreground mt-1">Match Official</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Player Stats</TabsTrigger>
            <TabsTrigger value="tactical">Tactical Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {match.home_team?.team_name}
                  </CardTitle>
                  <CardDescription>Home Team Overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/30">
                    <span className="text-muted-foreground">Manager</span>
                    <span className="font-medium">{match.home_team_manager || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/30">
                    <span className="text-muted-foreground">Goals Scored</span>
                    <span className="font-bold text-lg">{match.home_score}</span>
                  </div>
                  {homePlayerStats.length > 0 && (
                    <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/30">
                      <span className="text-muted-foreground">Players Used</span>
                      <span className="font-medium font-mono">{homePlayerStats.length}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {match.away_team?.team_name}
                  </CardTitle>
                  <CardDescription>Away Team Overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/30">
                    <span className="text-muted-foreground">Manager</span>
                    <span className="font-medium">{match.away_team_manager || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/30">
                    <span className="text-muted-foreground">Goals Scored</span>
                    <span className="font-bold text-lg">{match.away_score}</span>
                  </div>
                  {awayPlayerStats.length > 0 && (
                    <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/30">
                      <span className="text-muted-foreground">Players Used</span>
                      <span className="font-medium font-mono">{awayPlayerStats.length}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Match Information</CardTitle>
                <CardDescription>Additional context and metadata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/50 bg-muted/10">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" /> Kick-off
                    </div>
                    <span className="font-medium font-mono text-foreground">{match.kick_off?.slice(0, 5) || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/50 bg-muted/10">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Trophy className="h-4 w-4" /> Stage
                    </div>
                    <span className="font-medium text-foreground">{match.competition_stage || 'Regular Season'}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/50 bg-muted/10">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Target className="h-4 w-4" /> Match Week
                    </div>
                    <span className="font-medium font-mono text-foreground">{match.match_week || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/50 bg-muted/10">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Activity className="h-4 w-4" /> Status
                    </div>
                    <div><Badge variant="outline" className="font-normal">{match.match_status}</Badge></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm border-border/50">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                  <CardTitle className="text-lg font-semibold tracking-tight">{match.home_team?.team_name}</CardTitle>
                  <CardDescription>Individual player performance</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {homePlayerStats.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {homePlayerStats.map((stat) => {
                        const passCompletion = stat.passes_attempted > 0
                          ? (stat.passes_completed / stat.passes_attempted) * 100
                          : 0;

                        return (
                          <div key={stat.id} className="p-4 hover:bg-muted/20 transition-colors flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm text-foreground">
                                {stat.player?.player_name || 'Unknown Player'}
                              </span>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md font-mono">
                                {stat.minutes_played}'
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-6 text-sm">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Passes</span>
                                  <span className="font-medium font-mono">{stat.passes_completed}/{stat.passes_attempted}</span>
                                </div>
                                <ProgressBar value={passCompletion} />
                              </div>
                              <div className="flex flex-col items-end justify-center">
                                <span className="text-muted-foreground text-xs mb-1">Shots</span>
                                <span className="font-semibold text-foreground font-mono">{stat.shots}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      No player statistics available
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/50">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                  <CardTitle className="text-lg font-semibold tracking-tight">{match.away_team?.team_name}</CardTitle>
                  <CardDescription>Individual player performance</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {awayPlayerStats.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {awayPlayerStats.map((stat) => {
                        const passCompletion = stat.passes_attempted > 0
                          ? (stat.passes_completed / stat.passes_attempted) * 100
                          : 0;

                        return (
                          <div key={stat.id} className="p-4 hover:bg-muted/20 transition-colors flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm text-foreground">
                                {stat.player?.player_name || 'Unknown Player'}
                              </span>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md font-mono">
                                {stat.minutes_played}'
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-6 text-sm">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Passes</span>
                                  <span className="font-medium font-mono">{stat.passes_completed}/{stat.passes_attempted}</span>
                                </div>
                                <ProgressBar value={passCompletion} />
                              </div>
                              <div className="flex flex-col items-end justify-center">
                                <span className="text-muted-foreground text-xs mb-1">Shots</span>
                                <span className="font-semibold text-foreground font-mono">{stat.shots}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      No player statistics available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tactical" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm border-border/50">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                  <CardTitle className="text-lg font-semibold tracking-tight">{match.home_team?.team_name}</CardTitle>
                  <CardDescription>Team tactical indicators</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {homeMetrics.length > 0 ? (
                    <div className="space-y-6">
                      {homeMetrics.map((metric) => (
                        <div key={metric.id} className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{metric.metric_name}</span>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{metric.metric_type}</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight font-mono">
                              {metric.metric_name === 'Possession'
                                ? `${metric.metric_value?.toFixed(1)}%`
                                : metric.metric_value?.toFixed(2)}
                            </span>
                          </div>
                          {metric.metric_name === 'Possession' && (
                            <ProgressBar value={metric.metric_value} />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      No tactical metrics available
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/50">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                  <CardTitle className="text-lg font-semibold tracking-tight">{match.away_team?.team_name}</CardTitle>
                  <CardDescription>Team tactical indicators</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {awayMetrics.length > 0 ? (
                    <div className="space-y-6">
                      {awayMetrics.map((metric) => (
                        <div key={metric.id} className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{metric.metric_name}</span>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{metric.metric_type}</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight font-mono">
                              {metric.metric_name === 'Possession'
                                ? `${metric.metric_value?.toFixed(1)}%`
                                : metric.metric_value?.toFixed(2)}
                            </span>
                          </div>
                          {metric.metric_name === 'Possession' && (
                            <ProgressBar value={metric.metric_value} />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      No tactical metrics available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}