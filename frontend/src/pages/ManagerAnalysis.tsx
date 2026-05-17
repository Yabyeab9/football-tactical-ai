import { BrainCircuit, Shield, Trophy } from "lucide-react";

import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHero } from "@/components/platform/PageHero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getManagers } from "@/db/api";
import { usePollingResource } from "@/hooks/use-polling-resource";

export default function ManagerAnalysis() {
  const { data, loading, error } = usePollingResource({
    fetcher: getManagers,
    intervalMs: 60000,
  });

  const managers = data ?? [];

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="Managers"
          title="Coach identity, tactical style, and performance context."
          description="Manager intelligence sits on top of team form, structural tendencies, and squad context. It is designed to answer how a coach wants to control matches, not just what the scoreline says."
          badge={`${managers.length} managers profiled`}
        />

        {error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-[1.75rem]" />)
          ) : (
            <>
              <Card className="rounded-[1.75rem] border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Trophy className="h-4 w-4 text-primary" />
                    Highest PPM
                  </div>
                  <div className="mt-3 text-2xl font-black">
                    {managers.length
                      ? Math.max(...managers.map((item) => Number(item.record.pointsPerMatch ?? item.record.points_per_match ?? 0))).toFixed(2)
                      : "0.00"}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[1.75rem] border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                    Style Labels
                  </div>
                  <div className="mt-3 text-2xl font-black">
                    {new Set(managers.map((item) => item?.manager?.tacticalStyle?.label ?? item?.manager?.tactical_style?.label ?? "Unknown")).size}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[1.75rem] border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Shield className="h-4 w-4 text-primary" />
                    Managers in focus
                  </div>
                  <div className="mt-3 text-2xl font-black">{managers.length}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-[1.75rem]" />)
            : managers.map((entry) => (
                <Card key={entry.manager.id} className="rounded-[1.75rem] border-border/60">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-2xl">{entry.manager.name}</CardTitle>
                        <div className="mt-2 text-sm text-muted-foreground">{entry.manager.team.name}</div>
                      </div>
                      <Badge variant="outline">{entry?.manager?.tacticalStyle?.label ?? entry?.manager?.tactical_style?.label ?? "Standard"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div className="rounded-2xl bg-muted/30 p-3">
                        <div className="text-muted-foreground">Matches</div>
                        <div className="mt-1 text-lg font-semibold">{entry.record.matches}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/30 p-3">
                        <div className="text-muted-foreground">Wins</div>
                        <div className="mt-1 text-lg font-semibold">{entry.record.wins}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/30 p-3">
                        <div className="text-muted-foreground">Draws</div>
                        <div className="mt-1 text-lg font-semibold">{entry.record.draws}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/30 p-3">
                        <div className="text-muted-foreground">PPM</div>
                        <div className="mt-1 text-lg font-semibold">{Number(entry.record.pointsPerMatch ?? entry.record.points_per_match ?? 0).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                      <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Tactical style</div>
                      <p className="mt-3 text-sm leading-6 text-white/85">{entry?.manager?.tacticalStyle?.summary ?? entry?.manager?.tactical_style?.summary ?? "No tactical summary available"}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(entry?.manager?.tacticalStyle?.traits ?? entry?.manager?.tactical_style?.traits ?? []).map((trait) => (
                          <span key={trait} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>Recent team history tracked: {(entry.teamHistory ?? entry.team_history ?? []).length} matches</div>
                      <div>Nationality: {entry.manager.nationality ?? "Unknown"}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </MainLayout>
  );
}
