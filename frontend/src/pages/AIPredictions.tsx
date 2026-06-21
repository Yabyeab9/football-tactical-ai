import { BrainCircuit, TrendingUp, WandSparkles } from "lucide-react";

import { MainLayout } from "@/components/layouts/MainLayout";
import { MetricCard } from "@/components/platform/MetricCard";
import { PageHero } from "@/components/platform/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardSummary } from "@/db/api";
import { usePollingResource } from "@/hooks/use-polling-resource";

export default function AIPredictions() {
  const { data, loading, error } = usePollingResource({
    fetcher: getDashboardSummary,
    intervalMs: 45000,
  });

  const predictions = data?.predictionBoard ?? [];

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <PageHero
          eyebrow="Predictions Hub"
          title="Outcome framing and tactical scenario tracking."
          description="Surface the prediction layer: match-level probabilities and the tactical reason behind them."
          badge="Decision support"
        />

        {error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-[1.25rem]" />)
          ) : (
            <>
              <MetricCard label="Modelled" value={predictions.length} icon={BrainCircuit} />
              <MetricCard
                label="Home Lean"
                value={
                  predictions.length
                    ? `${Math.round(
                        predictions.reduce(
                          (sum, item) => sum + (item.prediction.homeWin ?? 0),
                          0
                        ) / predictions.length
                      )}%`
                    : "0%"
                }
                icon={TrendingUp}
              />
              <MetricCard label="Scenario" value="Active" icon={WandSparkles} tone="highlight" />
            </>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-[1.75rem]" />)
            : predictions.map((item) => (
                  <Card key={item.matchId} className="rounded-[2rem] border-white/5 bg-[#0A0C10] overflow-hidden group hover:border-primary/30 transition-all">
                    <CardHeader className="p-6 pb-2">
                       <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Neural Outcome Framing</div>
                       <CardTitle className="text-xl font-black">{item.matchLabel}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <p className="text-xs font-medium leading-relaxed text-white/60 italic line-clamp-2">
                        "{item.prediction.verdict}"
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'HOME', val: item.prediction.homeWin ?? 0, color: 'text-primary' },
                          { label: 'DRAW', val: item.prediction.draw ?? 0, color: 'text-white/40' },
                          { label: 'AWAY', val: item.prediction.awayWin ?? 0, color: 'text-blue-400' }
                        ].map(prob => (
                          <div key={prob.label} className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                            <div className={`text-xl font-black ${prob.color}`}>{prob.val}%</div>
                            <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">{prob.label}</div>
                          </div>
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
