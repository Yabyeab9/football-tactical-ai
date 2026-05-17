import { Activity, AlertTriangle, ArrowRight, BrainCircuit, Radio, Target, Users, Zap, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { MainLayout } from "@/components/layouts/MainLayout";
import { MetricCard } from "@/components/platform/MetricCard";
import { PageHero } from "@/components/platform/PageHero";
import { ProviderStatusStrip } from "@/components/platform/ProviderStatusStrip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardSummary } from "@/db/api";
import { usePollingResource } from "@/hooks/use-polling-resource";

export default function Dashboard() {
  const { data, loading, error } = usePollingResource({
    fetcher: getDashboardSummary,
    intervalMs: 30000,
  });

  const overviewCards = data?.overview_cards ?? [];
  const featuredMatch = data?.featured_match;

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="Intelligence System"
          title="Elite-grade football tactical workstation."
          description="Powered by live StatsBomb events and multi-provider normalization."
          badge="Live Command"
          actions={
            <div className="flex gap-3">
              <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-white border-0 shadow-lg shadow-primary/20 px-6">
                <Link to="/matches">
                  Open Feed
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6">
                <Link to="/ai-assistant">Tactical AI</Link>
              </Button>
            </div>
          }
        />

        {error ? (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-6 flex items-center gap-4 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            <div className="text-sm font-semibold">{error}</div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />)
            : overviewCards.map((card, index) => {
                const Icon = [Activity, Radio, AlertTriangle, Target][index] ?? Users;
                return (
                  <Card key={card.label} className="glass-panel border-0 hover:bg-white/10 transition-colors duration-300">
                    <CardContent className="p-6">
                       <div className="flex items-center justify-between">
                         <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                           <Icon className="h-5 w-5 text-primary" />
                         </div>
                         <div className="text-xs font-bold uppercase tracking-widest text-white/40">LIVE</div>
                       </div>
                       <div className="mt-4">
                         <div className="text-3xl font-black text-white">{card.value}</div>
                         <div className="text-sm font-medium text-white/60">{card.label}</div>
                       </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="glass-panel border-0 overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Tactical Spotlight
                </CardTitle>
                <Badge className="bg-primary/20 text-primary border-0 rounded-lg uppercase text-[10px] tracking-widest px-2">Featured</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <Skeleton className="h-96 w-full rounded-none" />
              ) : featuredMatch && data?.tactical_spotlight ? (
                <div className="p-8">
                  <div className="rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-950 p-8 text-white relative overflow-hidden ring-1 ring-white/10">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-[0.3em] font-black text-primary/80">{featuredMatch.competition.name}</div>
                        <div className="flex items-center gap-3">
                          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm font-bold text-white/50">{featuredMatch.status} {featuredMatch.minute ? `• ${featuredMatch.minute}'` : ""}</span>
                        </div>
                      </div>
                      <div className="mt-10 flex items-center justify-around gap-8">
                        <div className="flex-1 text-center group cursor-default">
                          <div className="h-24 w-24 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl font-black mb-4 group-hover:border-primary/50 transition-colors">
                            {featuredMatch.home_team.name[0]}
                          </div>
                          <div className="text-2xl font-black">{featuredMatch.home_team.name}</div>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="text-7xl font-black tracking-tighter tabular-nums mb-2">
                            {featuredMatch.score.home} <span className="text-white/20">:</span> {featuredMatch.score.away}
                          </div>
                          <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black tracking-widest uppercase">MATCH SCORE</div>
                        </div>
                        <div className="flex-1 text-center group cursor-default">
                          <div className="h-24 w-24 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl font-black mb-4 group-hover:border-primary/50 transition-colors">
                            {featuredMatch.away_team.name[0]}
                          </div>
                          <div className="text-2xl font-black">{featuredMatch.away_team.name}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div className="glass-card rounded-[2rem] p-6">
                      <div className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-4 flex items-center gap-2">
                        <BrainCircuit className="h-3 w-3 text-primary" />
                        AI Prediction
                      </div>
                      <p className="text-lg font-bold leading-tight mb-6">{data?.tactical_spotlight?.analysis?.prediction?.verdict ?? "No prediction available"}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/5 rounded-2xl p-4 text-center">
                          <div className="text-xl font-black text-white">{data?.tactical_spotlight?.analysis?.prediction?.home_win ?? 0}%</div>
                          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">HOME</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 text-center">
                          <div className="text-xl font-black text-white">{data?.tactical_spotlight?.analysis?.prediction?.draw ?? 0}%</div>
                          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">DRAW</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 text-center">
                          <div className="text-xl font-black text-white">{data?.tactical_spotlight?.analysis?.prediction?.away_win ?? 0}%</div>
                          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">AWAY</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-card rounded-[2rem] p-6">
                       <div className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-4 flex items-center gap-2">
                         <Target className="h-3 w-3 text-primary" />
                         Tactical Leverage
                       </div>
                       <div className="space-y-3">
                         {(data?.tactical_spotlight?.analysis?.strengths ?? []).slice(0, 2).map((item) => (
                           <div key={item} className="bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4 text-sm font-semibold text-primary-foreground/90 leading-snug">
                             {item}
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-20 text-center text-white/20 font-black tracking-widest uppercase">
                  No match modelled
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="glass-panel border-0">
              <CardHeader className="flex-row items-center justify-between bg-white/5 border-b border-white/5">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  Health Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? <Skeleton className="h-20 w-full" /> : <ProviderStatusStrip statuses={data?.system_status ?? []} />}
              </CardContent>
            </Card>

            <Card className="glass-panel border-0">
              <CardHeader className="bg-white/5 border-b border-white/5">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Prediction Board
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)
                  : data?.prediction_board?.slice(0, 4).map((item) => (
                      <div key={item.match_id} className="glass-card rounded-2xl p-5 hover:bg-white/10 transition-colors">
                        <div className="text-[10px] font-black tracking-widest text-primary uppercase mb-2">LIVE MODEL</div>
                        <div className="font-black text-lg text-white mb-1">{item.match_label}</div>
                        <div className="text-xs font-medium text-white/50 leading-relaxed">{item.prediction.verdict}</div>
                      </div>
                    ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
