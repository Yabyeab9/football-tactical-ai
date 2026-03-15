import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Activity, UserCircle, TrendingUp, Target } from 'lucide-react';
import { getDashboardStats, getMatches } from '@/db/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import type { Match } from '@/types';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_competitions: 0,
    total_teams: 0,
    total_matches: 0,
    total_players: 0,
  });
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashboardStats, matches] = await Promise.all([
          getDashboardStats(),
          getMatches(5, 0),
        ]);
        setStats(dashboardStats);
        setRecentMatches(matches);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const statCards = [
    {
      title: 'Competitions',
      value: stats.total_competitions,
      icon: Trophy,
      description: 'Active competitions',
      color: 'text-chart-1',
    },
    {
      title: 'Teams',
      value: stats.total_teams,
      icon: Users,
      description: 'Teams tracked',
      color: 'text-chart-2',
    },
    {
      title: 'Matches',
      value: stats.total_matches,
      icon: Activity,
      description: 'Matches analyzed',
      color: 'text-chart-3',
    },
    {
      title: 'Players',
      value: stats.total_players,
      icon: UserCircle,
      description: 'Players profiled',
      color: 'text-chart-4',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text">
            Football Tactical AI
          </h1>
          <p className="text-muted-foreground mt-2">
            Advanced football analytics powered by StatsBomb open data
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24 bg-muted" />
                  <Skeleton className="h-8 w-8 rounded-full bg-muted" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 bg-muted" />
                  <Skeleton className="h-3 w-32 mt-2 bg-muted" />
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map((stat) => (
              <Card key={stat.title} className="hover:shadow-hover transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Matches
              </CardTitle>
              <CardDescription>Latest analyzed matches</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-muted" />
                  ))}
                </div>
              ) : recentMatches.length > 0 ? (
                <div className="space-y-3">
                  {recentMatches.map((match) => (
                    <Link
                      key={match.match_id}
                      to={`/matches/${match.match_id}`}
                      className="block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span>{match.home_team?.team_name || 'Home'}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span>{match.away_team?.team_name || 'Away'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {match.competition?.competition_name} • {match.match_date}
                          </div>
                        </div>
                        <div className="text-lg font-bold">
                          {match.home_score} - {match.away_score}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No matches available</p>
              )}
              <Button asChild variant="outline" className="w-full mt-4">
                <Link to="/matches">View All Matches</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Explore tactical insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/tactical-lab">
                  <Target className="h-4 w-4 mr-2" />
                  Tactical Lab
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Advanced Analytics
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/scouting">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Player Scouting
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/ai-assistant">
                  <Activity className="h-4 w-4 mr-2" />
                  AI Assistant
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="pitch-gradient">
          <CardHeader>
            <CardTitle>Platform Features</CardTitle>
            <CardDescription>Comprehensive football analytics tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Tactical Analysis</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pass networks visualization</li>
                  <li>• Progressive passes tracking</li>
                  <li>• Pressing intensity maps</li>
                  <li>• Possession chains analysis</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Player Analytics</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Player influence maps</li>
                  <li>• xG shot maps</li>
                  <li>• Carry distance metrics</li>
                  <li>• Player comparisons</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">AI Insights</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Natural language queries</li>
                  <li>• Tactical recommendations</li>
                  <li>• Performance predictions</li>
                  <li>• Match analysis reports</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
