import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router';
import {
  Activity, Calendar, Clock, TrendingUp, Zap, Radio, ChevronRight, Trophy, Target, Brain,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Note: You may need to update your types.ts to match this structure!
export default function Dashboard() {
  const [featuredMatch, setFeaturedMatch] = useState<any | null>(null);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch("http://localhost:8000/live-matches");
        const data = await res.json();

        // ✅ API-Sports Status Codes
        const liveCodes = ["1h", "2h", "ht", "et", "p", "live"];
        const upcomingCodes = ["ns", "tbd"];
        const finishedCodes = ["ft", "aet", "pen"];

        // ✅ LIVE MATCHES
        const live = data.filter((m: any) => liveCodes.includes(m.status?.toLowerCase()));

        // ✅ FEATURED MATCH (best live one)
        const featured = live.length > 0 ? live[0] : null;

        // ✅ UPCOMING
        const upcoming = data
          .filter((m: any) => upcomingCodes.includes(m.status?.toLowerCase()))
          .slice(0, 6);

        // ✅ RECENT (finished matches)
        const recent = data
          .filter((m: any) => finishedCodes.includes(m.status?.toLowerCase()))
          .slice(0, 6);

        setLiveMatches(live);
        setFeaturedMatch(featured);
        setUpcomingMatches(upcoming);
        setRecentMatches(recent);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (["1h", "2h", "ht", "et", "live"].includes(s)) {
      return <Badge variant="destructive" className="animate-pulse">⚡ LIVE</Badge>;
    }
    if (["ns", "tbd"].includes(s)) {
      return <Badge variant="secondary">Upcoming</Badge>;
    }
    if (["ft", "aet", "pen"].includes(s)) {
      return <Badge variant="outline">FT</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  // Helper to format the ISO time string
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return {
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Football Tactical AI</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Live matches, advanced analytics, and AI-powered insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-destructive animate-pulse" />
            <span className="text-sm font-medium">{liveMatches.length} Live Now</span>
          </div>
        </div>

        {/* Featured Live Match */}
        {loading ? (
          <Skeleton className="h-64 w-full bg-muted" />
        ) : featuredMatch ? (
          <Card className="pitch-gradient border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <CardTitle>Featured Match</CardTitle>
                </div>
                <Badge variant="destructive" className="animate-pulse text-base px-4 py-1">
                  ⚡ {featuredMatch.status}
                </Badge>
              </div>
              <CardDescription className="text-base">
                {featuredMatch.league}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={`/matches/${featuredMatch.id}`}>
                <div className="flex items-center justify-between py-6 hover:opacity-80 transition-opacity">
                  <div className="flex-1 text-center">
                    <h3 className="text-2xl font-bold mb-2">{featuredMatch.home_team}</h3>
                    <div className="text-6xl font-bold mt-4">{featuredMatch.home_score ?? 0}</div>
                  </div>

                  <div className="px-8 text-center">
                    <div className="text-3xl font-bold text-muted-foreground">VS</div>
                    <Button asChild variant="outline" className="mt-4">
                      <Link to={`/matches/${featuredMatch.id}`}>
                        View Details<ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>

                  <div className="flex-1 text-center">
                    <h3 className="text-2xl font-bold mb-2">{featuredMatch.away_team}</h3>
                    <div className="text-6xl font-bold mt-4">{featuredMatch.away_score ?? 0}</div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {/* Quick Actions (Unchanged) */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover:shadow-hover transition-shadow cursor-pointer">
            <Link to="/injury-analysis">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Injury Analysis</CardTitle>
                <Activity className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Track Risk</div>
                <p className="text-xs text-muted-foreground mt-1">Injury-prone players & predictions</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-hover transition-shadow cursor-pointer">
            <Link to="/manager-analysis">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Manager Insights</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">EPL Experts</div>
                <p className="text-xs text-muted-foreground mt-1">Specialists & survival rates</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-hover transition-shadow cursor-pointer">
            <Link to="/ai-predictions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Predictions</CardTitle>
                <Brain className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">ML Insights</div>
                <p className="text-xs text-muted-foreground mt-1">Powered by machine learning</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-hover transition-shadow cursor-pointer">
            <Link to="/undiscovered-insights">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hidden Metrics</CardTitle>
                <Zap className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Discover</div>
                <p className="text-xs text-muted-foreground mt-1">Untapped analytical areas</p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-destructive animate-pulse" />
                  <CardTitle>Live Matches</CardTitle>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/matches">View All<ChevronRight className="h-4 w-4 ml-2" /></Link>
                </Button>
              </div>
              <CardDescription>Matches happening right now</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {liveMatches.map((match) => (
                    <Link key={match.id} to={`/matches/${match.id}`}>
                      <div className="p-4 rounded-lg border border-border hover:bg-accent transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="animate-pulse">
                              {match.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {match.league}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{match.home_team}</span>
                              <span className="text-2xl font-bold">{match.home_score ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{match.away_team}</span>
                              <span className="text-2xl font-bold">{match.away_score ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Matches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle>Upcoming Matches</CardTitle>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/matches">View All<ChevronRight className="h-4 w-4 ml-2" /></Link>
                </Button>
              </div>
              <CardDescription>Scheduled fixtures</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full bg-muted" />
                  ))}
                </div>
              ) : upcomingMatches.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMatches.map((match) => {
                    const { date, time } = formatTime(match.time);
                    return (
                      <Link key={match.id} to={`/matches/${match.id}`}>
                        <div className="p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3" />
                              <span className="text-muted-foreground">{date} • {time}</span>
                            </div>
                            {getStatusBadge(match.status)}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{match.home_team}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span className="font-medium">{match.away_team}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {match.league}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">No upcoming matches</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-chart-2" />
                  <CardTitle>Recent Results</CardTitle>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/matches">View All<ChevronRight className="h-4 w-4 ml-2" /></Link>
                </Button>
              </div>
              <CardDescription>Latest finished matches</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full bg-muted" />
                  ))}
                </div>
              ) : recentMatches.length > 0 ? (
                <div className="space-y-3">
                  {recentMatches.map((match) => {
                     const { date } = formatTime(match.time);
                     return (
                      <Link key={match.id} to={`/matches/${match.id}`}>
                        <div className="p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3" />
                              <span className="text-muted-foreground">{date}</span>
                            </div>
                            {getStatusBadge(match.status)}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm items-center">
                            <span className="font-medium text-right">{match.home_team}</span>
                            <div className="text-center">
                              <span className="font-bold text-lg">
                                {match.home_score} - {match.away_score}
                              </span>
                            </div>
                            <span className="font-medium text-left">{match.away_team}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 text-center">
                            {match.league}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">No recent matches</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}