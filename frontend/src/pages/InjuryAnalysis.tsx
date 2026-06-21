import { AlertTriangle, Clock3, ShieldAlert } from "lucide-react";

import { MainLayout } from "@/components/layouts/MainLayout";
import { MetricCard } from "@/components/platform/MetricCard";
import { PageHero } from "@/components/platform/PageHero";
import { ProviderStatusStrip } from "@/components/platform/ProviderStatusStrip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInjuries } from "@/db/api";
import { usePollingResource } from "@/hooks/use-polling-resource";

export default function InjuryAnalysis() {
  const { data, loading, error } = usePollingResource({
    fetcher: getInjuries,
    intervalMs: 60000,
  });

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="Injury Center"
          title="Operational injury watch built from real player availability and load data."
          description="Where public APIs do not expose direct medical states, the backend derives risk from starts, minutes, recent congestion, and rotation patterns so the module stays grounded in real provider data."
          badge="Load and risk monitoring"
        />

        {error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
           <MetricCard label="High Risk" value={data?.summary.highRisk ?? 0} icon={AlertTriangle} tone="warning" />
           <MetricCard label="Monitor" value={data?.summary.monitor ?? 0} icon={Clock3} tone="highlight" />
           <MetricCard label="Available" value={data?.summary.available ?? 0} icon={ShieldAlert} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-[1.75rem]" />)
            : data?.watchlist.map((player) => (
                  <Card key={player.playerId} className="rounded-[2rem] border-white/5 bg-[#0A0C10] overflow-hidden group hover:border-primary/30 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-lg font-black text-white">{player.playerName}</div>
                          <div className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                            {player.team.name} • {player.position}
                          </div>
                        </div>
                        <Badge className={player.status === "HIGH_RISK" ? "bg-red-500/10 text-red-500 border-red-500/20" : player.status === "MONITOR" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"}>
                          {player.riskScore}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { label: 'AVG MIN', val: player.averageMinutes },
                          { label: 'STARTS', val: player.startsRecent },
                          { label: 'REC MIN', val: player.minutesPlayedRecent }
                        ].map(stat => (
                          <div key={stat.label} className="bg-white/5 rounded-xl p-2 text-center">
                            <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">{stat.label}</div>
                            <div className="text-xs font-bold text-white">{stat.val}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {player.reasons.slice(0, 2).map((reason) => (
                          <span key={reason} className="text-[9px] font-bold text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
        </div>
      </div>
    </MainLayout>
  );
}
