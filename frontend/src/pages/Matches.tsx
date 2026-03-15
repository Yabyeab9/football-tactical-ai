import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMatches } from '@/db/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router';
import { Activity, Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Match } from '@/types';

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        const data = await getMatches(50, 0);
        setMatches(data);
      } catch (error) {
        console.error('Error loading matches:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Matches</h1>
          <p className="text-muted-foreground mt-2">
            Browse and analyze match data from StatsBomb
          </p>
        </div>

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
                      </div>
                      {match.stadium && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {match.stadium}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No matches available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
