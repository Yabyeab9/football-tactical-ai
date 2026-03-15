import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPlayers, searchPlayers } from '@/db/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router';
import { UserCircle, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Player } from '@/types';

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadPlayers() {
      try {
        const data = await getPlayers(100, 0);
        setPlayers(data);
      } catch (error) {
        console.error('Error loading players:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPlayers();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const data = await searchPlayers(searchTerm);
          setPlayers(data);
        } catch (error) {
          console.error('Error searching players:', error);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else if (searchTerm.length === 0) {
      loadInitialPlayers();
    }
  }, [searchTerm]);

  async function loadInitialPlayers() {
    try {
      const data = await getPlayers(100, 0);
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Players</h1>
          <p className="text-muted-foreground mt-2">
            Individual player statistics and performance metrics
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by player name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 bg-muted" />
                  <Skeleton className="h-4 w-24 bg-muted" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : players.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <Link key={player.player_id} to={`/players/${player.player_id}`}>
                <Card className="hover:shadow-hover transition-shadow h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <UserCircle className="h-5 w-5 text-primary" />
                          {player.player_name}
                        </CardTitle>
                        {player.player_nickname && (
                          <p className="text-sm text-muted-foreground mt-1">
                            "{player.player_nickname}"
                          </p>
                        )}
                      </div>
                      {player.jersey_number && (
                        <Badge variant="outline" className="text-lg">
                          #{player.jersey_number}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="space-y-1">
                      {player.position && (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary">{player.position}</Badge>
                        </div>
                      )}
                      {player.country && (
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3" />
                          {player.country}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No players found' : 'No players available'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
