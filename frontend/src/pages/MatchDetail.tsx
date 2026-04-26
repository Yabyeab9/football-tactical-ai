import { ArrowLeft, BrainCircuit, ShieldAlert, TrendingUp } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { MainLayout } from "@/components/layouts/MainLayout";
import { ProviderStatusStrip } from "@/components/platform/ProviderStatusStrip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTacticalAnalysis, type TacticalAnalysisResponse } from "@/db/api";

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const [details, setDetails] = useState<TacticalAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!matchId) {
        setError("No match id provided.");
        setLoading(false);
        return;
      }

      try {
        const result = await getTacticalAnalysis(matchId);
        if (active) {
          setDetails(result);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load tactical analysis.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const timer = window.setInterval(load, 25000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [matchId]);

  const chartData = details
    ? [
        {
          label: details.match.home_team.name,
          possession: Number(details.analysis.metrics.home.possessionTrend ?? details.analysis.metrics.home.possession_trend ?? 0),
          shots: Number(details.analysis.metrics.home.projectedShots ?? details.analysis.metrics.home.projected_shots ?? 0),
          pressure: Number(details.analysis.momentum?.home ?? details.team_analysis.momentum ?? 0),
        },
        {
          label: details.match.away_team.name,
          possession: Number(details.analysis.metrics.away.possessionTrend ?? details.analysis.metrics.away.possession_trend ?? 0),
          shots: Number(details.analysis.metrics.away.projectedShots ?? details.analysis.metrics.away.projected_shots ?? 0),
          pressure: Number(details.analysis.momentum?.away ?? details.opponent_analysis.momentum ?? 0),
        },
      ]
    : [];

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Button asChild variant="ghost" className="w-fit">
          <Link to="/matches">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to live matches
          </Link>
        </Button>

        {loading ? (
          <Skeleton className="h-[44rem] w-full rounded-[2rem]" />
        ) : error || !details ? (
          <Card className="border-destructive/30">
            <CardContent className="py-10 text-sm text-destructive">{error ?? "No match data available."}</CardContent>
          </Card>
        ) : (
          <>
            <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-slate-950 p-8 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-emerald-200">{details.match.competition.name}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="border-0 bg-white/10 text-white">{details.match.status}</Badge>
                    {details.match.minute ? <span className="text-sm text-white/70">{details.match.minute}'</span> : null}
                  </div>
                </div>
                <ProviderStatusStrip statuses={details.provider_status} />
              </div>

              <div className="mt-10 grid items-center gap-6 text-center md:grid-cols-[1fr_auto_1fr]">
                <div className="text-3xl font-black">{details.match.home_team.name}</div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 px-10 py-6 text-6xl font-black tabular-nums">
                  {details.match.score.home} - {details.match.score.away}
                </div>
                <div className="text-3xl font-black">{details.match.away_team.name}</div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-6">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Match Control Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="4 4" vertical={false} />
                          <XAxis dataKey="label" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey="possession" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="shots" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="pressure" fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-[1.5rem] bg-muted/30 p-5">
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Formations</div>
                        <div className="mt-3 text-lg font-semibold">
                          {details.match.home_team.name}: {details.analysis.formations.home}
                        </div>
                        <div className="text-lg font-semibold">
                          {details.match.away_team.name}: {details.analysis.formations.away}
                        </div>
                      </div>
                      <div className="rounded-[1.5rem] bg-muted/30 p-5">
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Prediction board</div>
                        <div className="mt-3 text-sm text-muted-foreground">{details.analysis.prediction.verdict}</div>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                          <div className="rounded-2xl bg-background px-3 py-3">
                            <div className="font-black">{details.analysis.prediction.home_win}%</div>
                            <div className="text-xs text-muted-foreground">Home</div>
                          </div>
                          <div className="rounded-2xl bg-background px-3 py-3">
                            <div className="font-black">{details.analysis.prediction.draw}%</div>
                            <div className="text-xs text-muted-foreground">Draw</div>
                          </div>
                          <div className="rounded-2xl bg-background px-3 py-3">
                            <div className="font-black">{details.analysis.prediction.away_win}%</div>
                            <div className="text-xs text-muted-foreground">Away</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Match Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {details.timeline.length > 0 ? (
                      details.timeline.map((item) => (
                        <div key={`${item.minute}-${item.description}`} className="flex gap-4 rounded-2xl border border-border/60 p-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary">
                            {item.minute}'
                          </div>
                          <div>
                            <div className="font-semibold">{item.type}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.team} • {item.description}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                        No event timeline is available for this provider snapshot.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="h-5 w-5 text-primary" />
                      Tactical Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {details.analysis.strengths.map((item) => (
                      <div key={item} className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm">
                        {item}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-primary" />
                      Weaknesses to Manage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {details.analysis.weaknesses.map((item) => (
                      <div key={item} className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm">
                        {item}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
