import React from "react";
import { ShieldAlert, Activity, Cpu } from "lucide-react";

import { MainLayout } from "@/components/layouts/MainLayout";
import { DashboardHero } from "@/components/platform/DashboardHero";
import { LiveMatchCenter } from "@/components/platform/LiveMatchCenter";
import { TacticalInsightSection } from "@/components/platform/TacticalInsightSection";
import { ProviderStatusStrip } from "@/components/platform/ProviderStatusStrip";
import { IntelligenceTicker } from "@/components/platform/IntelligenceTicker";
import { getDashboardSummary } from "@/db/api";
import { usePollingResource } from "@/hooks/use-polling-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { data, loading, error } = usePollingResource({
    fetcher: getDashboardSummary,
    intervalMs: 15000, 
  });

  const liveMatches = data?.liveBoard ?? [];
  const tacticalSpotlight = data?.tacticalSpotlight;
  const systemStatus = data?.systemStatus ?? [];
  const intelligence = data?.intelligence;
  const overviewCards = data?.overviewCards ?? [];

  const tickerItems = (intelligence?.intelligenceAlerts || []).map((alert: any, idx: number) => ({
    id: `alert-${idx}`,
    type: alert.type || 'TACTICAL',
    message: alert.message,
    time: 'LIVE'
  }));

  if (tickerItems.length < 3) {
    tickerItems.push({ id: 'sys-1', type: 'TACTICAL', message: 'Neural engine monitoring 14 active elite competitions', time: 'NOW' });
    tickerItems.push({ id: 'sys-2', type: 'MOMENTUM', message: 'Analyzing live momentum streams for Premier League fixtures', time: 'NOW' });
  }

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 pb-12">
        <IntelligenceTicker items={tickerItems} />
        
        <DashboardHero overviewCards={overviewCards} />

        {error ? (
          <div className="rounded-[2rem] bg-red-500/10 border border-red-500/20 p-6 flex items-center gap-6 text-red-500 mb-6">
            <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-widest">Intelligence Link Offline</div>
              <div className="text-xs font-medium opacity-60">{error}</div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <section>
              <LiveMatchCenter matches={liveMatches} loading={loading} />
            </section>
            
            <section>
              <TacticalInsightSection spotlight={tacticalSpotlight} loading={loading} />
            </section>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[2.5rem] bg-[#0A0C10] border-white/5 overflow-hidden">
              <CardHeader className="p-6 border-b border-white/5">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                 <ProviderStatusStrip statuses={systemStatus} />
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] bg-[#0A0C10] border-white/5 overflow-hidden">
              <CardHeader className="p-6 border-b border-white/5">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  Global Momentum
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                 <div className="space-y-4">
                    {liveMatches.slice(0, 5).map((match, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-white/60 truncate max-w-[120px]">{match.homeTeam} vs {match.awayTeam}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden flex">
                            <div className="h-full bg-primary" style={{ width: `${40 + Math.random() * 20}%` }} />
                          </div>
                          <span className="text-primary font-bold">Live</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
