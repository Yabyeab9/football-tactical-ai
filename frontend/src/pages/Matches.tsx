import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMatches, getCompetitions, getTeams } from '@/db/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router';
import { Activity, Calendar, MapPin, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Match, Competition, Team } from '@/types';

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [sortBy, setSortBy] = useState<'date' | 'competition' | 'match_week' | 'goals'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [goalRange, setGoalRange] = useState<string>('all');

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [comps, teamsList] = await Promise.all([
          getCompetitions(),
          getTeams(),
        ]);
        setCompetitions(comps);
        setTeams(teamsList);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadMatches() {
      setLoading(true);
      try {
        const filters: any = {
          sort_by: sortBy,
          sort_order: sortOrder,
        };

        if (selectedCompetition !== 'all') {
          filters.competition_id = Number.parseInt(selectedCompetition);
        }

        if (selectedTeam !== 'all') {
          filters.team_id = Number.parseInt(selectedTeam);
        }

        if (selectedSeason !== 'all') {
          filters.season_name = selectedSeason;
        }

        if (goalRange !== 'all') {
          const [min, max] = goalRange.split('-').map(Number);
          if (!Number.isNaN(min)) filters.min_goals = min;
          if (!Number.isNaN(max)) filters.max_goals = max;
        }

        const data = await getMatches(50, 0, filters);
        setMatches(data);
      } catch (error) {
        console.error('Error loading matches:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [sortBy, sortOrder, selectedCompetition, selectedTeam, selectedSeason, goalRange]);

  const seasons = Array.from(new Set(competitions.map(c => c.season_name)));

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Matches</h1>
          <p className="text-muted-foreground mt-2">
            Browse and analyze match data from StatsBomb
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filter & Sort Options
            </CardTitle>
            <CardDescription>
              Customize your match view with filters and sorting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="competition">Competition</SelectItem>
                    <SelectItem value="match_week">Match Week</SelectItem>
                    <SelectItem value="goals">Total Goals</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Competition</Label>
                <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Competitions</SelectItem>
                    {competitions.map(comp => (
                      <SelectItem key={comp.competition_id} value={comp.competition_id.toString()}>
                        {comp.competition_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.slice(0, 20).map(team => (
                      <SelectItem key={team.team_id} value={team.team_id.toString()}>
                        {team.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Season</Label>
                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons</SelectItem>
                    {seasons.map(season => (
                      <SelectItem key={season} value={season}>
                        {season}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Goal Range</Label>
                <Select value={goalRange} onValueChange={setGoalRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Matches</SelectItem>
                    <SelectItem value="0-0">0 Goals (0-0)</SelectItem>
                    <SelectItem value="1-2">Low Scoring (1-2)</SelectItem>
                    <SelectItem value="3-4">Medium Scoring (3-4)</SelectItem>
                    <SelectItem value="5-10">High Scoring (5+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48 bg-muted" />
                  <Skeleton className="h-4 w-32 bg-muted" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <Link key={match.match_id} to={`/matches/${match.match_id}`}>
                <Card className="hover:shadow-hover transition-shadow h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {match.home_team?.team_name || 'Home'} vs {match.away_team?.team_name || 'Away'}
                      </CardTitle>
                      <Badge variant="outline">{match.match_status}</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Activity className="h-3 w-3" />
                      {match.competition?.competition_name}
                      {match.match_week && ` • Week ${match.match_week}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-center gap-8 py-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{match.home_score}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {match.home_team?.team_name}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-muted-foreground">-</div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{match.away_score}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {match.away_team?.team_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {match.match_date}
                        {match.kick_off && ` • ${match.kick_off.slice(0, 5)}`}
                      </div>
                      {match.stadium && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {match.stadium}
                        </div>
                      )}
                    </div>
                    {match.season_name && (
                      <div className="text-xs text-muted-foreground">
                        Season: {match.season_name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No matches found with current filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
