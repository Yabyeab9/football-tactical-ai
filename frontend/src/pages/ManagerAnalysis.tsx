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
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <PageHero
          eyebrow="Managers"
          title="Coach identity and tactical identity."
          description="Decoding how elite coaches control matches through structural tendencies and squad context."
          badge={`${managers.length} managers profiled`}
        />

        {error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
           <MetricCard label="Highest PPM" value={managers.length ? Math.max(...managers.map((item) => Number(item.record.pointsPerMatch ?? 0))).toFixed(2) : "0.00"} icon={Trophy} />
           <MetricCard label="Style Labels" value={new Set(managers.map((item) => item?.manager?.tacticalStyle?.label ?? "Unknown")).size} icon={BrainCircuit} />
           <MetricCard label="In Focus" value={managers.length} icon={Shield} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-[1.75rem]" />)
            : managers.map((entry) => (
                <Card key={entry.manager.id} className="rounded-[2rem] border-white/5 bg-[#0A0C10] overflow-hidden group hover:border-primary/30 transition-all">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-black">{entry.manager.name}</CardTitle>
                        <div className="text-xs font-medium text-white/40">{entry.manager.team.name}</div>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg">
                        {entry?.manager?.tacticalStyle?.label ?? "Standard"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'MP', val: entry.record.matches },
                        { label: 'W', val: entry.record.wins },
                        { label: 'D', val: entry.record.draws },
                        { label: 'PPM', val: Number(entry.record.pointsPerMatch ?? 0).toFixed(2) }
                      ].map(stat => (
                        <div key={stat.label} className="bg-white/5 rounded-xl p-2 text-center">
                          <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">{stat.label}</div>
                          <div className="text-sm font-bold text-white">{stat.val}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl bg-slate-950 p-4 border border-white/5">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-2">Identity</div>
                      <p className="text-xs leading-relaxed text-white/60 line-clamp-3">{entry?.manager?.tacticalStyle?.summary ?? "Tactical profiling in progress..."}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(entry?.manager?.tacticalStyle?.traits ?? []).slice(0, 3).map((trait) => (
                          <span key={trait} className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-bold text-white/40">
                            {trait}
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
