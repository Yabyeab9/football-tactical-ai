import { Brain, Radar, Swords, WandSparkles, Share2, Activity } from "lucide-react";
import { useEffect, useState } from "react";

import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHero } from "@/components/platform/PageHero";
import { ProviderStatusStrip } from "@/components/platform/ProviderStatusStrip";
import { TacticalPitch, PitchNode, PitchEdge } from "@/components/platform/TacticalPitch";
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
  const [passNetwork, setPassNetwork] = useState<{nodes: any[], edges: any[]} | null>(null);

  useEffect(() => {
    if (liveData?.matches.length && !selectedMatchId) {
      setSelectedMatchId(liveData.matches[0].id);
    }
  }, [liveData, selectedMatchId]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!selectedMatchId) return;
      setLoadingAnalysis(true);
      try {
        const result = await getTacticalAnalysis(selectedMatchId);
        // Also fetch pass network for home team as default
        const passResp = await api.get(`/api/analytics/pass-networks?match_id=${selectedMatchId}&team_id=${result.match.home_team.id}`);
        
        if (active) {
          setAnalysis(result);
          setPassNetwork(passResp.data.data);
        }
      } catch (err) {
        console.error("Failed to load tactical data", err);
      } finally {
        if (active) setLoadingAnalysis(false);
      }
    };

    load();
    return () => { active = false; };
  }, [selectedMatchId]);

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="Tactical Command Center"
          title="Broadcast-quality tactical inference and network analysis."
          description="Direct remote data feed. No static datasets. Pure intelligence."
          badge="Live Engine"
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="flex flex-col gap-6">
            <Card className="glass-panel border-0">
              <CardHeader className="flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {loadingLive ? (
                    <Skeleton className="h-10 w-64 rounded-xl" />
                  ) : (
                    <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                      <SelectTrigger className="w-[18rem] bg-white/5 border-white/10 rounded-xl">
                        <SelectValue placeholder="Select Match" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {liveData?.matches.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.home_team.name} vs {m.away_team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {analysis && (
                    <div className="hidden items-center gap-2 md:flex">
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {analysis.match.status}
                      </Badge>
                      <span className="text-xs text-white/40">{analysis.match.competition.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="text-white/60 hover:text-white">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pass-network" className="space-y-6">
                  <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl w-fit">
                    <TabsTrigger value="pass-network" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                      Pass Network
                    </TabsTrigger>
                    <TabsTrigger value="formations" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                      Shape
                    </TabsTrigger>
                    <TabsTrigger value="battle" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                      Insights
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pass-network">
                    {loadingAnalysis ? (
                      <Skeleton className="aspect-[105/68] w-full rounded-[2rem]" />
                    ) : (
                      <TacticalPitch 
                        overlay={
                          <div className="glass-panel p-4 flex items-center justify-between gap-6 rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Activity className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Network Density</div>
                                <div className="text-lg font-black text-white">High Intensity</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Centrality Apex</div>
                              <div className="text-lg font-black text-primary">
                                {passNetwork?.nodes.sort((a,b) => b.passes_completed - a.passes_completed)[0]?.name || "N/A"}
                              </div>
                            </div>
                          </div>
                        }
                      >
                        {passNetwork?.edges.map((edge, idx) => (
                          <PitchEdge 
                            key={idx} 
                            x1={edge.source_x || 50} 
                            y1={edge.source_y || 50} 
                            x2={edge.target_x || 50} 
                            y2={edge.target_y || 50} 
                            weight={Math.max(1, edge.weight / 2)}
                          />
                        ))}
                        {passNetwork?.nodes.map((node) => (
                          <PitchNode 
                            key={node.player_id} 
                            x={node.x || 50} 
                            y={node.y || 50} 
                            label={node.name.split(' ').pop()} 
                            size={Math.max(8, node.passes_completed / 2)}
                          />
                        ))}
                      </TacticalPitch>
                    )}
                  </TabsContent>

                  <TabsContent value="formations" className="grid gap-6 md:grid-cols-2">
                    {/* Formation analysis cards here */}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
             <Card className="glass-panel border-0">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-lg">
                   <WandSparkles className="h-5 w-5 text-primary" />
                   AI Intelligence
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {loadingAnalysis ? (
                   <Skeleton className="h-40 w-full rounded-2xl" />
                 ) : (
                   <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                     <div className="text-xs uppercase tracking-widest text-white/40 font-bold mb-2">Verdict</div>
                     <p className="text-sm font-medium leading-relaxed text-white/90">
                       {analysis?.analysis.prediction.verdict}
                     </p>
                   </div>
                 )}
               </CardContent>
             </Card>

             <Card className="glass-panel border-0">
               <CardHeader>
                 <CardTitle className="text-lg">Tactical Health</CardTitle>
               </CardHeader>
               <CardContent>
                 <ProviderStatusStrip statuses={analysis?.provider_status || []} />
               </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
