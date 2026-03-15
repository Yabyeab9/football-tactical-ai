import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompetitions } from '@/db/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router';
import { Trophy, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Competition } from '@/types';

export default function Competitions() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompetitions() {
      try {
        const data = await getCompetitions();
        setCompetitions(data);
      } catch (error) {
        console.error('Error loading competitions:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCompetitions();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Competitions</h1>
          <p className="text-muted-foreground mt-2">
            Browse competitions and tournament data
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 bg-muted" />
                  <Skeleton className="h-4 w-24 bg-muted" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : competitions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {competitions.map((competition) => (
              <Link key={competition.competition_id} to={`/competitions/${competition.competition_id}`}>
                <Card className="hover:shadow-hover transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      {competition.competition_name}
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      {competition.country_name && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {competition.country_name}
                        </div>
                      )}
                      <div>
                        <Badge variant="secondary">{competition.season_name}</Badge>
                      </div>
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No competitions available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
