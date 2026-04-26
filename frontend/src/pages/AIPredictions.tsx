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

  const predictions = data?.prediction_board ?? [];

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="Predictions Hub"
          title="Outcome framing and tactical scenario tracking."
          description="This module surfaces the prediction layer of the platform: match-level probabilities, the tactical reason behind them, and the decision board we can act on across the rest of the system."
          badge="Decision support"
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
              <MetricCard label="Prediction cards" value={predictions.length} hint="Matches currently modelled" icon={BrainCircuit} />
              <MetricCard
                label="Avg home lean"
                value={
                  predictions.length
                    ? `${Math.round(
                        predictions.reduce(
                          (sum, item) => sum + (item.prediction.home_win ?? item.prediction.homeWin ?? 0),
                          0
                        ) / predictions.length
                      )}%`
                    : "0%"
                }
                hint="Average home win projection"
                icon={TrendingUp}
              />
              <MetricCard label="Scenario engine" value="Active" hint="Predictions driven by the tactical engine layer" icon={WandSparkles} />
            </>
          )}
        </div>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-xl">Prediction Board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-[1.5rem]" />)
              : predictions.map((item) => (
                  <div key={item.match_id} className="rounded-[1.5rem] border border-border/60 p-5">
                    <div className="text-xl font-semibold">{item.match_label}</div>
                    <div className="mt-2 text-sm text-muted-foreground">{item.prediction.verdict}</div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-muted/30 px-4 py-4 text-center">
                        <div className="text-2xl font-black">{item.prediction.home_win ?? item.prediction.homeWin ?? 0}%</div>
                        <div className="text-sm text-muted-foreground">Home win</div>
                      </div>
                      <div className="rounded-2xl bg-muted/30 px-4 py-4 text-center">
                        <div className="text-2xl font-black">{item.prediction.draw}%</div>
                        <div className="text-sm text-muted-foreground">Draw</div>
                      </div>
                      <div className="rounded-2xl bg-muted/30 px-4 py-4 text-center">
                        <div className="text-2xl font-black">{item.prediction.away_win ?? item.prediction.awayWin ?? 0}%</div>
                        <div className="text-sm text-muted-foreground">Away win</div>
                      </div>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
