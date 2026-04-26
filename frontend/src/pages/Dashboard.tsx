import { Activity, AlertTriangle, ArrowRight, BrainCircuit, Radio, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { MainLayout } from "@/components/layouts/MainLayout";
import { MetricCard } from "@/components/platform/MetricCard";
import { PageHero } from "@/components/platform/PageHero";
import { ProviderStatusStrip } from "@/components/platform/ProviderStatusStrip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardSummary } from "@/db/api";
import { usePollingResource } from "@/hooks/use-polling-resource";

export default function Dashboard() {
  const { data, loading, error } = usePollingResource({
    fetcher: getDashboardSummary,
    intervalMs: 30000,
  });

  const overviewCards = data?.overview_cards ?? [];
  const featuredMatch = data?.featured_match;

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="Football Intelligence Platform"
          title="Operate matches, players, and tactical context from one command surface."
          description="This platform is designed as an aggregation and intelligence layer, not a simple dashboard. Live providers feed the backend, services normalize the data, and each frontend module exposes a focused football workflow."
          badge="Multi-source intelligence"
          actions={
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/matches">
                  Open live feed
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/ai-assistant">Launch assistant</Link>
              </Button>
            </div>
          }
        />

        {error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-[1.75rem]" />)
            : overviewCards.map((card, index) => {
                const icon = [Activity, Radio, AlertTriangle, Target][index] ?? Users;
                return <MetricCard key={card.label} label={card.label} value={card.value} hint="Refreshed from backend intelligence services" icon={icon} />;
              })}
        </div>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-xl">Provider Health</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-12 w-full rounded-2xl" /> : <ProviderStatusStrip statuses={data?.system_status ?? []} />}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/60">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-2xl">Featured Match Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <Skeleton className="h-72 w-full rounded-[1.75rem]" />
              ) : featuredMatch && data?.tactical_spotlight ? (
                <div className="grid gap-6">
                  <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.25em] text-emerald-200">{featuredMatch.competition.name}</div>
                        <div className="mt-2 text-sm text-white/70">
                          {featuredMatch.status} {featuredMatch.minute ? `• ${featuredMatch.minute}'` : ""}
                        </div>
                      </div>
                      <Badge className="border-0 bg-white/10 text-white">{featuredMatch.providers.join(" + ")}</Badge>
                    </div>
                    <div className="mt-8 grid items-center gap-4 text-center md:grid-cols-[1fr_auto_1fr]">
                      <div className="text-2xl font-black">{featuredMatch.home_team.name}</div>
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-8 py-5 text-5xl font-black tabular-nums">
                        {featuredMatch.score.home} - {featuredMatch.score.away}
                      </div>
                      <div className="text-2xl font-black">{featuredMatch.away_team.name}</div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-muted/30 p-5">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Prediction</div>
                      <p className="mt-3 text-lg font-semibold">{data.tactical_spotlight.analysis.prediction.verdict}</p>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-2xl bg-background px-3 py-3 text-center">
                          <div className="font-black">{data.tactical_spotlight.analysis.prediction.home_win}%</div>
                          <div className="text-muted-foreground">Home</div>
                        </div>
                        <div className="rounded-2xl bg-background px-3 py-3 text-center">
                          <div className="font-black">{data.tactical_spotlight.analysis.prediction.draw}%</div>
                          <div className="text-muted-foreground">Draw</div>
                        </div>
                        <div className="rounded-2xl bg-background px-3 py-3 text-center">
                          <div className="font-black">{data.tactical_spotlight.analysis.prediction.away_win}%</div>
                          <div className="text-muted-foreground">Away</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[1.5rem] bg-muted/30 p-5">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tactical leverage</div>
                      <div className="mt-3 space-y-3 text-sm">
                        {data.tactical_spotlight.analysis.strengths.slice(0, 2).map((item) => (
                          <div key={item} className="rounded-2xl bg-background px-4 py-3">{item}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-border p-10 text-center text-muted-foreground">
                  No featured match intelligence is available right now.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  Prediction Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-2xl" />)
                  : data?.prediction_board.slice(0, 4).map((item) => (
                      <div key={item.match_id} className="rounded-2xl border border-border/60 p-4">
                        <div className="font-semibold">{item.match_label}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{item.prediction.verdict}</div>
                      </div>
                    ))}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-xl">Injury Watch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-2xl" />)
                  : data?.injury_watch.slice(0, 4).map((player) => (
                      <div key={player.player_id} className="rounded-2xl border border-border/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold">{player.player_name}</div>
                            <div className="text-sm text-muted-foreground">{player.team.name}</div>
                          </div>
                          <Badge variant={player.status === "HIGH_RISK" ? "destructive" : player.status === "MONITOR" ? "secondary" : "outline"}>
                            {player.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
