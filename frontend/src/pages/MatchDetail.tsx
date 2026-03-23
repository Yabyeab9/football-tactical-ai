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

        <Card className="pitch-gradient">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold">{match.home_team?.team_name}</h2>
                </div>
                  {match.home_team?.managers?.[0]?.name && (
                  <p className="text-sm text-muted-foreground">
                    Manager: a
                  </p>
                )}
                <div className="text-6xl font-bold mt-4">{match.home_score}</div>
              </div>

              <div className="text-center space-y-2">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {match.match_status}
                </Badge>
                <div className="text-4xl font-bold text-muted-foreground">VS</div>
                {match.match_week && (
                  <Badge variant="secondary">Week {match.match_week}</Badge>
                )}
              </div>

              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold">{match.away_team?.team_name}</h2>
                </div>
                {match.away_team_manager && (
                  <p className="text-sm text-muted-foreground">
                    Manager: {match.away_team_manager}
                  </p>
                )}
                <div className="text-6xl font-bold mt-4">{match.away_score}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{match.match_date}</div>
              {match.kick_off && (
                <p className="text-xs text-muted-foreground mt-1">
                  Kick-off: {match.kick_off.slice(0, 5)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stadium</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{match.stadium || 'N/A'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {match.home_team?.country || 'Unknown'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Competition</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{match.competition?.competition_name}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {match.competition_stage || 'Regular Season'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referee</CardTitle>
              <Shirt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{match.referee || 'N/A'}</div>
              <p className="text-xs text-muted-foreground mt-1">Match Official</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Player Stats</TabsTrigger>
            <TabsTrigger value="tactical">Tactical Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {match.home_team?.team_name}
                  </CardTitle>
                  <CardDescription>Home Team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Manager</span>
                    <span className="font-medium">{match.home_team_manager || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-medium">{match.home_team?.country || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Goals Scored</span>
                    <span className="font-medium text-lg">{match.home_score}</span>
                  </div>
                  {homePlayerStats.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Players Used</span>
                      <span className="font-medium">{homePlayerStats.length}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {match.away_team?.team_name}
                  </CardTitle>
                  <CardDescription>Away Team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Manager</span>
                    <span className="font-medium">{match.away_team_manager || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-medium">{match.away_team?.country || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Goals Scored</span>
                    <span className="font-medium text-lg">{match.away_score}</span>
                  </div>
                  {awayPlayerStats.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Players Used</span>
                      <span className="font-medium">{awayPlayerStats.length}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Match Information</CardTitle>
                <CardDescription>Additional details about this match</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Kick-off:</span>
                    <span className="font-medium">{match.kick_off?.slice(0, 5) || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Stage:</span>
                    <span className="font-medium">{match.competition_stage || 'Regular Season'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Match Week:</span>
                    <span className="font-medium">{match.match_week || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline">{match.match_status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{match.home_team?.team_name} Players</CardTitle>
                  <CardDescription>Player statistics for home team</CardDescription>
                </CardHeader>
                <CardContent>
                  {homePlayerStats.length > 0 ? (
                    <div className="space-y-3">
                      {homePlayerStats.map((stat) => (
                        <div
                          key={stat.id}
                          className="p-3 rounded-lg border border-border"
                        >
                          <div className="font-medium mb-2">
                            {stat.player?.player_name || 'Unknown Player'}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Minutes</span>
                              <p className="font-medium">{stat.minutes_played}'</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Passes</span>
                              <p className="font-medium">
                                {stat.passes_completed}/{stat.passes_attempted}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Shots</span>
                              <p className="font-medium">{stat.shots}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No player statistics available
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{match.away_team?.team_name} Players</CardTitle>
                  <CardDescription>Player statistics for away team</CardDescription>
                </CardHeader>
                <CardContent>
                  {awayPlayerStats.length > 0 ? (
                    <div className="space-y-3">
                      {awayPlayerStats.map((stat) => (
                        <div
                          key={stat.id}
                          className="p-3 rounded-lg border border-border"
                        >
                          <div className="font-medium mb-2">
                            {stat.player?.player_name || 'Unknown Player'}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Minutes</span>
                              <p className="font-medium">{stat.minutes_played}'</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Passes</span>
                              <p className="font-medium">
                                {stat.passes_completed}/{stat.passes_attempted}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Shots</span>
                              <p className="font-medium">{stat.shots}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No player statistics available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tactical" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{match.home_team?.team_name} Metrics</CardTitle>
                  <CardDescription>Tactical performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  {homeMetrics.length > 0 ? (
                    <div className="space-y-3">
                      {homeMetrics.map((metric) => (
                        <div
                          key={metric.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <div>
                            <p className="font-medium">{metric.metric_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {metric.metric_type}
                            </p>
                          </div>
                          <div className="text-lg font-bold">
                            {metric.metric_value?.toFixed(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tactical metrics available
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{match.away_team?.team_name} Metrics</CardTitle>
                  <CardDescription>Tactical performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  {awayMetrics.length > 0 ? (
                    <div className="space-y-3">
                      {awayMetrics.map((metric) => (
                        <div
                          key={metric.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <div>
                            <p className="font-medium">{metric.metric_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {metric.metric_type}
                            </p>
                          </div>
                          <div className="text-lg font-bold">
                            {metric.metric_value?.toFixed(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
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
