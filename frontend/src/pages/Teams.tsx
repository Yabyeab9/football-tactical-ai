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
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <PageHero
          eyebrow="Teams"
          title="Club structure and squad depth."
          description="Operational football decisions derived from normalized team profiles and squad status."
          badge={`${teams.length} clubs in focus`}
        />

        {error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-[2rem]" />)
            : teams.map((entry) => (
                <Card key={entry.team.id} className="rounded-[2rem] border-white/5 bg-[#0A0C10] overflow-hidden group hover:border-primary/30 transition-all">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-black">{entry.team.name}</CardTitle>
                        <div className="text-xs font-medium text-white/40">{String(entry.team.league?.name ?? "Premier League")}</div>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg">
                        {entry.team.manager?.name || "Coach"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Squad Size</div>
                        <div className="mt-1 text-2xl font-black text-white">{Number(entry.squadSummary.totalPlayers ?? 0)}</div>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Defense Strength</div>
                        <div className="mt-1 text-2xl font-black text-emerald-400">{Number(entry.stats.defenseStrength ?? 0).toFixed(1)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'ATTACK', val: Number(entry.stats.attackStrength ?? 0).toFixed(1) },
                        { label: 'PPM', val: Number(entry.stats.pointsPerMatch ?? 0).toFixed(2) },
                        { label: 'POSS', val: `${Number(entry.stats.estimatedPossessionTrend ?? 50).toFixed(0)}%` }
                      ].map(stat => (
                        <div key={stat.label} className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                          <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">{stat.label}</div>
                          <div className="text-xs font-bold text-white">{stat.val}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl bg-slate-950 p-4 border border-white/5">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-2">Form Sequence</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(entry.recentForm.form ?? []).map((result, index) => (
                          <span
                            key={index}
                            className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                              result === "W"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : result === "L"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-white/5 text-white/60 border border-white/10"
                            }`}
                          >
                            {result}
                          </span>
                        ))}
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
