import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHero } from "@/components/platform/PageHero";
import { ProviderStatusStrip } from "@/components/platform/ProviderStatusStrip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getLiveMatches } from "@/db/api";
import { usePollingResource } from "@/hooks/use-polling-resource";

function formatKickoff(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Matches() {
  const [query, setQuery] = useState("");
  const { data, loading, error } = usePollingResource({
    fetcher: getLiveMatches,
    intervalMs: 20000,
  });

  const filteredMatches = useMemo(() => {
    const matches = data?.matches ?? [];
    const search = query.trim().toLowerCase();
    if (!search) {
      return matches;
    }
    return matches.filter((match) =>
      [match.home_team.name, match.away_team.name, match.competition.name].some((value) => value.toLowerCase().includes(search))
    );
  }, [data?.matches, query]);

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="Live System"
          title="Real-time football feed aggregated from multiple providers."
          description="The backend polls TheSportsDB, football-data.org, and OpenLigaDB, merges equivalent fixtures, and exposes one frontend-ready feed with provider coverage attached."
          badge={loading ? "Updating…" : `${data?.summary.live_matches ?? 0} live fixtures`}
        />

        {error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <Card className="border-border/60">
          <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">Provider coverage</CardTitle>
            </div>
            {loading ? <Skeleton className="h-10 w-64 rounded-2xl" /> : <ProviderStatusStrip statuses={data?.provider_status ?? []} />}
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by team or competition" className="pl-9" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-[1.75rem]" />)
            : filteredMatches.map((match) => (
                <Link key={match.id} to={`/matches/${match.id}`}>
                  <Card className="h-full rounded-[1.75rem] border-border/60 transition-all hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="flex h-full flex-col gap-6 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{match.competition.name}</div>
                          <div className="mt-2 text-sm text-muted-foreground">{formatKickoff(match.scheduled_at)}</div>
                        </div>
                        <Badge variant={match.status === "SCHEDULED" ? "outline" : "destructive"}>
                          {match.status} {match.minute ? `• ${match.minute}'` : ""}
                        </Badge>
                      </div>

                      <div className="rounded-[1.5rem] bg-muted/30 p-5">
                        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                          <div className="text-lg font-semibold">{match.home_team.name}</div>
                          <div className="text-3xl font-black tabular-nums">{match.score.home}</div>
                          <div className="text-lg font-semibold">{match.away_team.name}</div>
                          <div className="text-3xl font-black tabular-nums">{match.score.away}</div>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 text-sm text-muted-foreground">
                        <span>{match.venue || "Venue pending"}</span>
                        <Badge variant="outline">{match.providers.join(" + ")}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>
      </div>
    </MainLayout>
  );
}
