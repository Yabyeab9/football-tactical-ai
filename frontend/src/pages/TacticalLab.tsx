import { Brain, Radar, Swords, WandSparkles } from "lucide-react";
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

export default function TacticalLab() {
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

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="Tactical Engine"
          title="Provider-backed tactical inference for formations, strengths, weaknesses, and likely outcomes."
          description="This module is the coaching console: formation snapshots, attacking pressure, tactical warnings, and probabilistic outcome framing grounded in the backend tactical engine."
          badge="Tactical inference"
        />

        <Card className="border-border/60">
          <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl">Choose a match</CardTitle>
            {loadingLive ? (
              <Skeleton className="h-10 w-72 rounded-2xl" />
            ) : (
              <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                <SelectTrigger className="w-full lg:w-[30rem]">
                  <SelectValue placeholder="Select a match for tactical analysis" />
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
              <Tabs defaultValue="formations" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="formations">Formations</TabsTrigger>
                  <TabsTrigger value="battle">Battle Map</TabsTrigger>
                  <TabsTrigger value="prediction">Prediction</TabsTrigger>
                </TabsList>

                <TabsContent value="formations" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-border/60 bg-muted/25">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Radar className="h-4 w-4 text-primary" />
                          Home Shape
                        </div>
                        <div className="mt-4 text-3xl font-black">{analysis.analysis.formations.home}</div>
                        <div className="mt-2 text-sm text-muted-foreground">{analysis.match.home_team.name}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 bg-muted/25">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Radar className="h-4 w-4 text-primary" />
                          Away Shape
                        </div>
                        <div className="mt-4 text-3xl font-black">{analysis.analysis.formations.away}</div>
                        <div className="mt-2 text-sm text-muted-foreground">{analysis.match.away_team.name}</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="battle" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-border/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Swords className="h-5 w-5 text-primary" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysis.analysis.strengths.map((item) => (
                          <div key={item} className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm">{item}</div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="border-border/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Brain className="h-5 w-5 text-primary" />
                          Weaknesses
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysis.analysis.weaknesses.map((item) => (
                          <div key={item} className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm">{item}</div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="prediction" className="space-y-4">
                  <Card className="border-border/60 bg-muted/25">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <WandSparkles className="h-4 w-4 text-primary" />
                        Engine verdict
                      </div>
                      <p className="mt-4 text-lg font-semibold">{analysis.analysis.prediction.verdict}</p>
                      <div className="mt-6 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-background px-4 py-4 text-center">
                          <div className="text-2xl font-black">{analysis.analysis.prediction.home_win}%</div>
                          <div className="text-sm text-muted-foreground">Home</div>
                        </div>
                        <div className="rounded-2xl bg-background px-4 py-4 text-center">
                          <div className="text-2xl font-black">{analysis.analysis.prediction.draw}%</div>
                          <div className="text-sm text-muted-foreground">Draw</div>
                        </div>
                        <div className="rounded-2xl bg-background px-4 py-4 text-center">
                          <div className="text-2xl font-black">{analysis.analysis.prediction.away_win}%</div>
                          <div className="text-sm text-muted-foreground">Away</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
