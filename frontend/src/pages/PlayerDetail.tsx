import { ArrowLeft, Clock3, Goal, LineChart, ShieldAlert } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { MainLayout } from "@/components/layouts/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInjuries, getPlayer, type InjuryWatchResponse, type PlayerAnalyticsResponse } from "@/db/api";

export default function PlayerDetail() {
  const { playerId } = useParams<{ playerId: string }>();
  const [player, setPlayer] = useState<PlayerAnalyticsResponse | null>(null);
  const [risk, setRisk] = useState<InjuryWatchResponse["watchlist"][number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!playerId) {
        setError("No player id provided.");
        setLoading(false);
        return;
      }

      try {
        const [playerResult, injuryResult] = await Promise.all([getPlayer(playerId), getInjuries()]);
        if (active) {
          setPlayer(playerResult);
          setRisk(injuryResult.watchlist.find((entry) => entry.player_id === playerId) ?? null);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load player intelligence.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [playerId]);

  const trendData =
    player?.recent_matches.map((match, index) => ({
      label: match.competition || `Match ${index + 1}`,
      availability: player.analytics.availability_rate ?? 0,
      contributions: player.analytics.goal_contributions_per_90 ?? 0,
    })) ?? [];

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Button asChild variant="ghost" className="w-fit">
          <Link to="/players">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to player intelligence
          </Link>
        </Button>

        {loading ? (
          <Skeleton className="h-[40rem] w-full rounded-[2rem]" />
        ) : error || !player ? (
          <Card className="border-destructive/30">
            <CardContent className="py-10 text-sm text-destructive">{error ?? "No player data found."}</CardContent>
          </Card>
        ) : (
          <>
            <section className="rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,0.02))] p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <Badge className="bg-primary/10 text-primary">{player.player.position || "Role pending"}</Badge>
                  <h1 className="mt-4 text-4xl font-black tracking-tight">{player.player.name}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {player.player.current_team?.name} • {player.player.nationality}
                  </p>
                </div>
                {risk ? (
                  <Badge variant={risk.status === "HIGH_RISK" ? "destructive" : "secondary"}>{risk.status} • risk {risk.risk_score}</Badge>
                ) : (
                  <Badge variant="outline">No current injury alert</Badge>
                )}
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    Contribution Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReLineChart data={trendData}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} hide />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="availability" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="contributions" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                      </ReLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3">
                      <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /> Minutes</span>
                      <span className="font-semibold">{player.analytics.minutes_played ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3">
                      <span className="flex items-center gap-2"><Goal className="h-4 w-4 text-primary" /> Goal contributions / 90</span>
                      <span className="font-semibold">{player.analytics.goal_contributions_per_90 ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3">
                      <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary" /> Availability</span>
                      <span className="font-semibold">{player.analytics.availability_rate ?? 0}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>Recent Matches</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {player.recent_matches.map((match) => (
                      <div key={match.id} className="rounded-2xl border border-border/60 p-4">
                        <div className="font-semibold">{match.opponent}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {match.competition} • {match.status}
                        </div>
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
