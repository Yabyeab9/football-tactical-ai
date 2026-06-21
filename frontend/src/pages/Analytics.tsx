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

  const homeForm = analysis ? analysis.context.homeForm : undefined;
  const awayForm = analysis ? analysis.context.awayForm : undefined;

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <PageHero
          eyebrow="Match Analysis Hub"
          title="Live context and tactical shape."
          description="Inspect formations, match control, and the event story in real-time."
          badge={selectedMatchId ? "Analysis live" : "Waiting for feed"}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
             <Card className="rounded-[2rem] border-white/5 bg-[#0A0C10] p-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-white/40 mb-6">Match Selector</CardTitle>
                {loadingLive ? (
                  <Skeleton className="h-12 w-full rounded-xl" />
                ) : (
                  <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 h-12 rounded-xl">
                      <SelectValue placeholder="Select Match" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {liveData?.matches.map((match) => (
                        <SelectItem key={match.id} value={match.id}>
                          {match.homeTeam} vs {match.awayTeam}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {analysis && (
                  <div className="mt-8 space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="text-2xl font-black text-white">{analysis.match.homeTeam}</div>
                        <div className="text-2xl font-black text-white/20">vs</div>
                        <div className="text-2xl font-black text-white text-right">{analysis.match.awayTeam}</div>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20">{analysis.match.status}</Badge>
                        <Badge className="bg-white/5 text-white/40 border-white/10">{analysis.match.competition.name}</Badge>
                     </div>
                  </div>
                )}
             </Card>
          </div>

          <div className="xl:col-span-2">
            {loadingAnalysis || !analysis ? (
              <Skeleton className="h-[40rem] w-full rounded-[2.5rem]" />
            ) : (
              <Card className="rounded-[2.5rem] border-white/5 bg-[#0A0C10] overflow-hidden">
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="w-full bg-white/5 rounded-none border-b border-white/5 h-16 p-0">
                    <TabsTrigger value="summary" className="flex-1 h-full rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-r border-white/5">Summary</TabsTrigger>
                    <TabsTrigger value="timeline" className="flex-1 h-full rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-r border-white/5">Timeline</TabsTrigger>
                    <TabsTrigger value="form" className="flex-1 h-full rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Form Context</TabsTrigger>
                  </TabsList>

                  <CardContent className="p-8">
                    <TabsContent value="summary" className="m-0 space-y-8">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">
                            <Radar className="h-3 w-3 text-primary" />
                            Formations
                          </div>
                          <div className="space-y-3 text-sm font-bold">
                            <div className="flex justify-between">
                              <span className="text-white/40">{analysis.match.homeTeam}</span>
                              <span className="text-primary">{analysis.analysis.formations.home}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">{analysis.match.awayTeam}</span>
                              <span className="text-primary">{analysis.analysis.formations.away}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">
                            <BarChart3 className="h-3 w-3 text-blue-400" />
                            Core Metrics
                          </div>
                          <div className="space-y-3 text-sm font-bold">
                            <div className="flex justify-between">
                              <span className="text-white/40">Home Possession</span>
                              <span className="text-white">{(analysis.analysis.metrics.home.possessionTrend ?? 0)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">Home Momentum</span>
                              <span className="text-white">{analysis.analysis.momentum?.home ?? 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">
                            <ClipboardList className="h-3 w-3 text-amber-400" />
                            Verdict
                          </div>
                          <p className="text-xs font-medium text-white/60 leading-relaxed italic line-clamp-3">
                            "{analysis.analysis.prediction.verdict}"
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
                          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4">Tactical Strengths</div>
                          <ul className="space-y-2">
                             {(analysis.analysis.strengths ?? []).map((s) => (
                               <li key={s} className="text-xs font-bold text-emerald-400/80 flex items-start gap-2">
                                 <div className="h-1 w-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                 {s}
                               </li>
                             ))}
                          </ul>
                        </div>
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
                          <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4">Structural Vulnerabilities</div>
                          <ul className="space-y-2">
                             {(analysis.analysis.weaknesses ?? []).map((w) => (
                               <li key={w} className="text-xs font-bold text-amber-400/80 flex items-start gap-2">
                                 <div className="h-1 w-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                 {w}
                               </li>
                             ))}
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                    {/* ... other tabs Content simplified for brevity ... */}
                  </CardContent>
                </Tabs>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
