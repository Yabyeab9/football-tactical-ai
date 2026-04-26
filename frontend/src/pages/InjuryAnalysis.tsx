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

        <div className="grid gap-4 md:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-[1.75rem]" />)
          ) : (
            <>
              <MetricCard label="High Risk" value={data?.summary.high_risk ?? 0} hint="Players needing immediate workload review" icon={AlertTriangle} />
              <MetricCard label="Monitor" value={data?.summary.monitor ?? 0} hint="Players in managed workload territory" icon={Clock3} />
              <MetricCard label="Available" value={data?.summary.available ?? 0} hint="Players without major load flags" icon={ShieldAlert} />
            </>
          )}
        </div>

        <Card className="border-border/60">
          <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl">Provider Coverage</CardTitle>
            {loading ? <Skeleton className="h-10 w-64 rounded-2xl" /> : <ProviderStatusStrip statuses={data?.provider_status ?? []} />}
          </CardHeader>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-xl">Risk Watchlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-[1.5rem]" />)
              : data?.watchlist.map((player) => (
                  <div key={player.player_id} className="rounded-[1.5rem] border border-border/60 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-xl font-semibold">{player.player_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {player.team.name} • {player.position}
                        </div>
                      </div>
                      <Badge variant={player.status === "HIGH_RISK" ? "destructive" : player.status === "MONITOR" ? "secondary" : "outline"}>
                        {player.status} • {player.risk_score}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-muted/30 px-4 py-3 text-sm">
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Average minutes</div>
                        <div className="mt-1 font-semibold">{player.average_minutes}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/30 px-4 py-3 text-sm">
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Starts recent</div>
                        <div className="mt-1 font-semibold">{player.starts_recent}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/30 px-4 py-3 text-sm">
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Minutes recent</div>
                        <div className="mt-1 font-semibold">{player.minutes_played_recent}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {player.reasons.map((reason) => (
                        <Badge key={reason} variant="outline" className="whitespace-normal text-left">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
