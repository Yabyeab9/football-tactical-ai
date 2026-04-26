import { BarChart3, ClipboardList, Radar } from "lucide-react";
import { useEffect, useState } from "react";

import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHero } from "@/components/platform/PageHero";
import { ProviderStatusStrip } from "@/components/platform/ProviderStatusStrip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLiveMatches, getTacticalAnalysis, type TacticalAnalysisResponse } from "@/db/api";
import { usePollingResource } from "@/hooks/use-polling-resource";

export default function Analytics() {
  const { data: liveData, loading: loadingLive } = usePollingResource({
    fetcher: getLiveMatches,
    intervalMs: 30000,
  });
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [analysis, setAnalysis] = useState<TacticalAnalysisResponse | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  useEffect(() => {
    if (liveData?.matches.length && !selectedMatchId) {
      setSelectedMatchId(liveData.matches[0].id);
    }
  }, [liveData, selectedMatchId]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!selectedMatchId) {
        return;
      }
      setLoadingAnalysis(true);
      try {
        const result = await getTacticalAnalysis(selectedMatchId);
        if (active) {
          setAnalysis(result);
        }
      } finally {
        if (active) {
          setLoadingAnalysis(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [selectedMatchId]);

  const homeForm = analysis ? (analysis.context.home_form ?? analysis.context.homeForm) : undefined;
  const awayForm = analysis ? (analysis.context.away_form ?? analysis.context.awayForm) : undefined;

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="Match Analysis Hub"
          title="Live context, tactical shape, and event narrative in one workflow."
          description="This module bridges the live feed and the tactical engine so we can inspect formations, match control, recent form, and the event story without leaving the analysis surface."
          badge={selectedMatchId ? "Analysis live" : "Waiting for feed"}
        />

        <Card className="border-border/60">
          <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl">Match Selector</CardTitle>
            {loadingLive ? (
              <Skeleton className="h-10 w-72 rounded-2xl" />
            ) : (
              <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                <SelectTrigger className="w-full lg:w-[28rem]">
                  <SelectValue placeholder="Select a match" />
                </SelectTrigger>
                <SelectContent>
                  {liveData?.matches.map((match) => (
                    <SelectItem key={match.id} value={match.id}>
                      {match.home_team.name} vs {match.away_team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardHeader>
        </Card>

        {loadingAnalysis || !analysis ? (
          <Skeleton className="h-[34rem] w-full rounded-[2rem]" />
        ) : (
          <Card className="border-border/60">
            <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {analysis.match.home_team.name} vs {analysis.match.away_team.name}
                </CardTitle>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{analysis.match.status}</Badge>
                  <Badge variant="secondary">{analysis.match.competition.name}</Badge>
                </div>
              </div>
              <ProviderStatusStrip statuses={analysis.provider_status} />
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="form">Form Context</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-border/60 bg-muted/25">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Radar className="h-4 w-4 text-primary" />
                          Formations
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                          <div>{analysis.match.home_team.name}: {analysis.analysis.formations.home}</div>
                          <div>{analysis.match.away_team.name}: {analysis.analysis.formations.away}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/60 bg-muted/25">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          Home Metrics
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                          <div>Possession: {analysis.analysis.metrics.home.possessionTrend ?? analysis.analysis.metrics.home.possession_trend ?? 0}%</div>
                          <div>Projected shots: {analysis.analysis.metrics.home.projectedShots ?? analysis.analysis.metrics.home.projected_shots ?? 0}</div>
                          <div>Momentum: {analysis.analysis.momentum?.home ?? analysis.team_analysis.momentum ?? 0}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/60 bg-muted/25">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <ClipboardList className="h-4 w-4 text-primary" />
                          Model Verdict
                        </div>
                        <div className="mt-4 text-sm text-muted-foreground">{analysis.analysis.prediction.verdict}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      {analysis.analysis.strengths.map((item) => (
                        <div key={item} className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {analysis.analysis.weaknesses.map((item) => (
                        <div key={item} className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  {analysis.timeline.length > 0 ? (
                    analysis.timeline.map((event) => (
                      <div key={`${event.minute}-${event.description}`} className="rounded-2xl border border-border/60 p-4">
                        <div className="font-semibold">{event.minute}' • {event.type}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {event.team} • {event.description}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                      This provider snapshot does not include a rich timeline for the selected match.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="form" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-border/60">
                      <CardHeader>
                        <CardTitle className="text-lg">{analysis.match.home_team.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>Recent form: {(homeForm?.form ?? []).join(" • ") || "N/A"}</div>
                        <div>Points per match: {homeForm?.points_per_match ?? homeForm?.pointsPerMatch ?? 0}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60">
                      <CardHeader>
                        <CardTitle className="text-lg">{analysis.match.away_team.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>Recent form: {(awayForm?.form ?? []).join(" • ") || "N/A"}</div>
                        <div>Points per match: {awayForm?.points_per_match ?? awayForm?.pointsPerMatch ?? 0}</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
