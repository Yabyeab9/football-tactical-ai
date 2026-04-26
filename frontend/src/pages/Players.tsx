import { ArrowRight, Gauge, Radar, UserRoundSearch } from "lucide-react";
import { Link } from "react-router-dom";

import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHero } from "@/components/platform/PageHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardSummary } from "@/db/api";
import { usePollingResource } from "@/hooks/use-polling-resource";

export default function Players() {
  const { data, loading, error } = usePollingResource({
    fetcher: getDashboardSummary,
    intervalMs: 45000,
  });

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="Player Intelligence"
          title="Per-90 output, availability context, and player risk in one module."
          description="The backend assembles person-level intelligence from football-data.org and combines it with the wider platform context so we can move from workload to output without stitching datasets by hand."
          badge="Scouting + operations"
        />

        {error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-[1.75rem]" />)
            : data?.featured_players.map((entry) => (
                <Card key={entry.player.id} className="rounded-[1.75rem] border-border/60">
                  <CardContent className="flex h-full flex-col gap-5 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-semibold">{entry.player.name}</div>
                        <div className="text-sm text-muted-foreground">{entry.player.current_team?.name}</div>
                      </div>
                      <Badge variant={entry.risk.status === "HIGH_RISK" ? "destructive" : entry.risk.status === "MONITOR" ? "secondary" : "outline"}>
                        {entry.risk.status}
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-2xl bg-muted/30 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Goal contributions / 90</div>
                        <div className="mt-1 text-2xl font-black">{entry.analytics.goal_contributions_per_90 ?? 0}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-muted/30 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Starts</div>
                          <div className="mt-1 text-xl font-semibold">{entry.analytics.starts ?? 0}</div>
                        </div>
                        <div className="rounded-2xl bg-muted/30 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Availability</div>
                          <div className="mt-1 text-xl font-semibold">{entry.analytics.availability_rate ?? 0}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Gauge className="h-4 w-4 text-primary" />
                      Risk score {entry.risk.score}
                    </div>

                    <Button asChild className="mt-auto">
                      <Link to={`/players/${entry.player.id}`}>
                        Open intelligence
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Radar className="h-5 w-5 text-primary" />
                What this module focuses on
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Availability and minutes load</p>
              <p>Goal and assist contribution rates</p>
              <p>Player role context inside the current team</p>
              <p>Operational links into the injury and tactical modules</p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserRoundSearch className="h-5 w-5 text-primary" />
                Platform usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Use Player Intelligence for role-based review.</p>
              <p>Open Tactical Engine when you want match-level leverage.</p>
              <p>Use Injury Center to understand whether high output is sustainable.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
