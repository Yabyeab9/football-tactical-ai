import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom'; // Note: usually react-router-dom for React web
import {
  Activity, Calendar, Clock, TrendingUp, Zap, Radio, ChevronRight, Trophy, Target, Brain, BarChart2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [featuredMatch, setFeaturedMatch] = useState<any | null>(null);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch("http://localhost:8000/live-matches");
        const data = await res.json();

        const liveCodes = ["1h", "2h", "ht", "et", "p", "live"];
        const upcomingCodes = ["ns", "tbd"];
        const finishedCodes = ["ft", "aet", "pen"];

        const allLive = data.filter((m: any) => liveCodes.includes(m.status?.toLowerCase()));
        setLiveCount(allLive.length); // Fixed scope issue

        const live = allLive.slice(0, 5);
        const featured = live.length > 0 ? live[0] : null;

        const upcoming = data
          .filter((m: any) => upcomingCodes.includes(m.status?.toLowerCase()))
          .slice(0, 6);

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
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (["1h", "2h", "ht", "et", "live"].includes(s)) {
      return (
        <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0 flex items-center gap-1.5 font-mono text-xs shadow-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          {status.toUpperCase()}
        </Badge>
      );
    }
    if (["ns", "tbd"].includes(s)) {
      return <Badge variant="secondary" className="bg-secondary/50 font-mono text-xs">UPCOMING</Badge>;
    }
    if (["ft", "aet", "pen"].includes(s)) {
      return <Badge variant="outline" className="font-mono text-xs bg-muted/30">FT</Badge>;
    }
    return <Badge variant="outline" className="font-mono text-xs">{status}</Badge>;
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return {
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <MainLayout>
      <div className="space-y-8 pb-8 max-w-[1600px] mx-auto">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-mono text-sm tracking-wider uppercase mb-2">
              <BarChart2 className="h-4 w-4" /> Elshadi Analytics Engine
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Match Intelligence</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Live tactical data, predictive metrics, and real-time event tracking.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-full border shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-semibold tracking-wide">
              {liveCount} {liveCount === 1 ? 'Match' : 'Matches'} Live
            </span>
          </div>
        </div>

        {/* Featured Broadcast Scoreboard */}
        {loading ? (
          <Skeleton className="h-64 w-full rounded-2xl bg-muted/50" />
        ) : featuredMatch ? (
          <Link to={`/matches/${featuredMatch.id}`} className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-800 shadow-2xl transition-all duration-300 hover:shadow-primary/5 hover:border-primary/30">
              {/* Abstract background graphics */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

              <div className="relative p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 bg-slate-950/50 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/5 text-white/80 text-sm font-medium">
                    <Trophy className="h-4 w-4 text-primary" />
                    {featuredMatch.league}
                  </div>
                  {getStatusBadge(featuredMatch.status)}
                </div>

                <div className="flex items-center justify-between gap-4">
                  {/* Home Team */}
                  <div className="flex-1 text-right">
                    <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-sm">
                      {featuredMatch.home_team}
                    </h3>
                  </div>

                  {/* Score Box */}
                  <div className="flex items-center gap-4 px-6 md:px-12">
                    <div className="bg-slate-950/80 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 flex items-center gap-4 shadow-inner">
                      <span className="text-5xl md:text-7xl font-black text-white font-mono tabular-nums">
                        {featuredMatch.home_score ?? 0}
                      </span>
                      <span className="text-2xl text-slate-500 font-bold">-</span>
                      <span className="text-5xl md:text-7xl font-black text-white font-mono tabular-nums">
                        {featuredMatch.away_score ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 text-left">
                    <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-sm">
                      {featuredMatch.away_team}
                    </h3>
                  </div>
                </div>

                <div className="mt-8 flex justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 absolute bottom-6 left-1/2 -translate-x-1/2">
                  <span className="flex items-center text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20 backdrop-blur-md">
                    Open Match Center <ChevronRight className="h-4 w-4 ml-1" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ) : null}

        {/* Tactical Modules (Quick Actions) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: "/injury-analysis", title: "Injury Risk", icon: Activity, metric: "Risk Models", desc: "Predictive injury analytics", color: "text-red-500", bg: "bg-red-500/10" },
            { to: "/manager-analysis", title: "Manager Profiles", icon: Target, metric: "Tactical DNA", desc: "Playstyle & survival mapping", color: "text-blue-500", bg: "bg-blue-500/10" },
            { to: "/ai-predictions", title: "Match Predictor", icon: Brain, metric: "ML Forecasts", desc: "Data-driven outcomes", color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { to: "/undiscovered-insights", title: "Deep Metrics", icon: Zap, metric: "xG & Beyond", desc: "Advanced hidden variables", color: "text-amber-500", bg: "bg-amber-500/10" }
          ].map((item, i) => (
            <Link key={i} to={item.to} className="block group">
              <Card className="h-full border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:shadow-md hover:border-primary/20 transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.title}
                    </CardTitle>
                    <div className={`p-2 rounded-md ${item.bg}`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold tracking-tight">{item.metric}</div>
                  <p className="text-xs text-muted-foreground mt-1.5">{item.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Data Grids */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Live Matches Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-semibold tracking-tight">Live Tracker</h2>
              </div>
              <Button asChild variant="link" size="sm" className="h-auto p-0 text-muted-foreground hover:text-primary">
                <Link to="/matches">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>

            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl bg-muted/50" />)
            ) : liveMatches.length > 0 ? (
              <div className="space-y-3">
                {liveMatches.map((match) => (
                  <Link key={match.id} to={`/matches/${match.id}`} className="block group">
                    <div className="p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all duration-200">
                      <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{match.league}</span>
                        {getStatusBadge(match.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{match.home_team}</span>
                          <span className="font-mono font-bold text-lg">{match.home_score ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{match.away_team}</span>
                          <span className="font-mono font-bold text-lg">{match.away_score ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-border/50 bg-card/30">
                <p className="text-sm text-muted-foreground">No matches currently live</p>
              </div>
            )}
          </div>

          {/* Upcoming & Recent Columns */}
          <div className="lg:col-span-2 space-y-6">

            {/* Recent Results */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold tracking-tight">Latest Outcomes</h2>
                </div>
              </div>

              <Card className="overflow-hidden border-border/50 shadow-sm">
                <div className="divide-y divide-border/50">
                  {loading ? (
                     Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-none bg-muted/20" />)
                  ) : recentMatches.length > 0 ? (
                    recentMatches.map((match) => {
                      const { date } = formatTime(match.time);
                      const homeWon = match.home_score > match.away_score;
                      const awayWon = match.away_score > match.home_score;

                      return (
                        <Link key={match.id} to={`/matches/${match.id}`} className="block hover:bg-muted/30 transition-colors">
                          <div className="flex items-center p-3 sm:p-4 text-sm">
                            <div className="w-24 shrink-0 text-muted-foreground flex flex-col">
                              <span className="font-mono text-xs">{date}</span>
                              <span className="text-[10px] uppercase truncate pr-2">{match.league}</span>
                            </div>

                            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                              <div className={`text-right truncate ${homeWon ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                {match.home_team}
                              </div>
                              <div className="bg-background px-3 py-1 rounded-md border border-border/50 font-mono font-bold tracking-widest min-w-[64px] text-center">
                                {match.home_score} - {match.away_score}
                              </div>
                              <div className={`text-left truncate ${awayWon ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                {match.away_team}
                              </div>
                            </div>

                            <div className="w-16 shrink-0 flex justify-end">
                              {getStatusBadge(match.status)}
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground">No recent matches found.</div>
                  )}
                </div>
              </Card>
            </div>

            {/* Upcoming Fixtures */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold tracking-tight">Upcoming Fixtures</h2>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl bg-muted/50" />)
                ) : upcomingMatches.length > 0 ? (
                  upcomingMatches.map((match) => {
                    const { date, time } = formatTime(match.time);
                    return (
                      <Link key={match.id} to={`/matches/${match.id}`} className="block group">
                        <Card className="p-4 h-full border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                              <Clock className="h-3 w-3" /> {date} • {time}
                            </div>
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">{match.league}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate flex-1">{match.home_team}</span>
                            <span className="text-muted-foreground text-xs font-medium px-2">VS</span>
                            <span className="font-medium text-sm truncate flex-1 text-right">{match.away_team}</span>
                          </div>
                        </Card>
                      </Link>
                    )
                  })
                ) : (
                  <div className="col-span-2 p-8 text-center rounded-xl border border-dashed border-border/50 bg-card/30">
                    <p className="text-sm text-muted-foreground">No upcoming fixtures scheduled.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}