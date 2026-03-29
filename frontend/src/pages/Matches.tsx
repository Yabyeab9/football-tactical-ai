import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router';
import { Activity, Calendar, Filter, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function Matches() {
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort States
  const [sortBy, setSortBy] = useState<'time' | 'league' | 'goals'>('time');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Fetch live match data
  useEffect(() => {
    async function fetchLiveMatches() {
      try {
        const res = await fetch("http://localhost:8000/live-matches");
        const data = await res.json();
        setAllMatches(data);
      } catch (error) {
        console.error("Failed to fetch live matches:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // 2. Client-side Filtering & Sorting
  useEffect(() => {
    let result = [...allMatches];

    // Filter by League
    if (selectedLeague !== 'all') {
      result = result.filter(m => m.league === selectedLeague);
    }

    // Filter by Status
    if (selectedStatus !== 'all') {
      result = result.filter(m => {
        const s = m.status?.toLowerCase();
        if (selectedStatus === 'live') return ["1h", "2h", "ht", "et", "p", "live"].includes(s);
        if (selectedStatus === 'finished') return ["ft", "aet", "pen"].includes(s);
        if (selectedStatus === 'upcoming') return ["ns", "tbd"].includes(s);
        return true;
      });
    }

    // Search by Team
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.home_team?.toLowerCase().includes(q) ||
        m.away_team?.toLowerCase().includes(q)
      );
    }

    // Sort Data
    result.sort((a, b) => {
      let valA, valB;

      if (sortBy === 'time') {
        valA = new Date(a.time).getTime();
        valB = new Date(b.time).getTime();
      } else if (sortBy === 'league') {
        valA = a.league;
        valB = b.league;
      } else if (sortBy === 'goals') {
        valA = (a.home_score || 0) + (a.away_score || 0);
        valB = (b.home_score || 0) + (b.away_score || 0);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredMatches(result);
  }, [allMatches, sortBy, sortOrder, selectedLeague, selectedStatus, searchQuery]);

  // Extract unique leagues dynamically for the dropdown
  const uniqueLeagues = Array.from(new Set(allMatches.map(m => m.league))).sort() as string[];

  // Helper for badges
  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (["1h", "2h", "ht", "et", "live", "p"].includes(s)) return <Badge variant="destructive" className="animate-pulse">⚡ LIVE</Badge>;
    if (["ns", "tbd"].includes(s)) return <Badge variant="secondary">Upcoming</Badge>;
    if (["ft", "aet", "pen"].includes(s)) return <Badge variant="outline">FT</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Matches</h1>
          <p className="text-muted-foreground mt-2">
            Browse and track today's live global fixtures
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filter & Sort Options
            </CardTitle>
            <CardDescription>
              Customize your match view based on live data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Search Team</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search teams..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Match Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Matches</SelectItem>
                    <SelectItem value="live">Live Now</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>League / Competition</Label>
                <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {uniqueLeagues.map(league => (
                      <SelectItem key={league} value={league}>
                        {league}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Kick-off Time</SelectItem>
                    <SelectItem value="league">League Name</SelectItem>
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
        ) : filteredMatches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map((match) => {
              const dateObj = new Date(match.time);
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <Link key={match.id} to={`/matches/${match.id}`}>
                  <Card className="hover:shadow-hover transition-shadow h-full flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardDescription className="flex items-center gap-2 text-xs font-semibold text-primary">
                          <Activity className="h-3 w-3" />
                          {match.league}
                        </CardDescription>
                        {getStatusBadge(match.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right">
                          <div className="font-bold text-lg leading-tight">{match.home_team}</div>
                        </div>
                        <div className="px-4 text-center">
                          <div className="bg-muted px-3 py-1 rounded-md font-mono text-xl font-bold">
                            {match.home_score ?? '-'} : {match.away_score ?? '-'}
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-bold text-lg leading-tight">{match.away_team}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Today • {timeStr}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No matches found</p>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or search query.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}