import { Building2, ShieldCheck, Users } from "lucide-react";

import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHero } from "@/components/platform/PageHero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTeams } from "@/db/api";
import { usePollingResource } from "@/hooks/use-polling-resource";

export default function Teams() {
  const { data, loading, error } = usePollingResource({
    fetcher: getTeams,
    intervalMs: 60000,
  });

  const teams = data ?? [];

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="Teams"
          title="Club structure, squad depth, and team-level strength in one intelligence module."
          description="This page combines normalized team profiles, recent form, squad status, and manager context so we can move from scoreboard reading into operational football decisions."
          badge={`${teams.length} clubs in focus`}
        />

        {error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-[1.75rem]" />)
            : teams.map((entry) => (
                <Card key={entry.team.id} className="rounded-[1.75rem] border-border/60">
                  <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                    <div>
                      <CardTitle className="text-xl">{entry.team.name}</CardTitle>
                      <div className="mt-2 text-sm text-muted-foreground">{String(entry.team.league?.name ?? "Competition pending")}</div>
                    </div>
                    <Badge variant="outline">{entry.team.manager?.name ?? "Coach pending"}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-muted/30 p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          Squad
                        </div>
                        <div className="mt-2 text-2xl font-black">{Number(entry.squadSummary.totalPlayers ?? entry.squad_summary.total_players ?? 0)}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/30 p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Defence
                        </div>
                        <div className="mt-2 text-2xl font-black">{Number(entry.stats.defenseStrength ?? entry.stats.defense_strength ?? 0).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl border border-border/60 p-3">
                        <div className="text-muted-foreground">Attack</div>
                        <div className="mt-1 text-lg font-semibold">{Number(entry.stats.attackStrength ?? entry.stats.attack_strength ?? 0).toFixed(2)}</div>
                      </div>
                      <div className="rounded-2xl border border-border/60 p-3">
                        <div className="text-muted-foreground">PPM</div>
                        <div className="mt-1 text-lg font-semibold">{Number(entry.stats.pointsPerMatch ?? entry.stats.points_per_match ?? 0).toFixed(2)}</div>
                      </div>
                      <div className="rounded-2xl border border-border/60 p-3">
                        <div className="text-muted-foreground">Possession</div>
                        <div className="mt-1 text-lg font-semibold">{Number(entry.stats.estimatedPossessionTrend ?? entry.stats.estimated_possession_trend ?? 50).toFixed(0)}%</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-950 p-4 text-white">
                      <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Form</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(entry.recentForm.form ?? []).map((result, index) => (
                          <span
                            key={`${entry.team.id}-${index}`}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              result === "W"
                                ? "bg-emerald-400/20 text-emerald-100"
                                : result === "L"
                                ? "bg-rose-400/20 text-rose-100"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {entry.team.venue ?? "Venue pending"}
                      </div>
                      <div className="mt-2">
                        High-risk availability flags: {Number(entry.squadSummary.highRisk ?? entry.squad_summary.high_risk ?? 0)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </MainLayout>
  );
}
