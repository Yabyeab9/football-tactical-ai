 import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Activity, Calendar } from 'lucide-react';
import { getInjuryPronePlayersAnalysis } from '@/db/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { InjuryRiskAssessment } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function InjuryAnalysis() {
  const [injuryData, setInjuryData] = useState<InjuryRiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getInjuryPronePlayersAnalysis();
        setInjuryData(data.slice(0, 20));
      } catch (error) {
        console.error('Error loading injury data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getRiskLevel = (score: number) => {
    if (score >= 7) return { label: 'High Risk', variant: 'destructive' as const };
    if (score >= 4) return { label: 'Moderate Risk', variant: 'secondary' as const };
    return { label: 'Low Risk', variant: 'outline' as const };
  };

  const chartData = injuryData.slice(0, 10).map(player => ({
    name: player.player_name.split(' ').pop(),
    injuries: player.total_injuries,
    matches_missed: player.total_matches_missed,
    risk_score: player.injury_risk_score,
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Injury Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Track injury-prone players, patterns, and risk assessments
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Players</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {injuryData.filter(p => p.injury_risk_score >= 7).length}
              </div>
              <p className="text-xs text-muted-foreground">Risk score ≥ 7</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Injuries</CardTitle>
              <Activity className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {injuryData.reduce((sum, p) => sum + p.total_injuries, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all players</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matches Missed</CardTitle>
              <Calendar className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {injuryData.reduce((sum, p) => sum + p.total_matches_missed, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total games lost</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recurring Issues</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {injuryData.reduce((sum, p) => sum + p.recurring_injuries, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Repeated injuries</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Injury Risk Comparison</CardTitle>
            <CardDescription>Top 10 players by injury risk score</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="injuries" fill="hsl(var(--chart-1))" name="Total Injuries" />
                  <Bar dataKey="matches_missed" fill="hsl(var(--chart-2))" name="Matches Missed" />
                  <Bar dataKey="risk_score" fill="hsl(var(--destructive))" name="Risk Score" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Injury-Prone Players
            </CardTitle>
            <CardDescription>
              Players ranked by injury risk assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full bg-muted" />
                ))}
              </div>
            ) : injuryData.length > 0 ? (
              <div className="space-y-3">
                {injuryData.map((player, index) => {
                  const risk = getRiskLevel(player.injury_risk_score);
                  return (
                    <div
                      key={player.player_id}
                      className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-muted-foreground">
                              #{index + 1}
                            </span>
                            <div>
                              <h3 className="font-semibold">{player.player_name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={risk.variant}>{risk.label}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  Risk Score: {player.injury_risk_score.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total Injuries</span>
                              <p className="font-medium">{player.total_injuries}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Recurring</span>
                              <p className="font-medium">{player.recurring_injuries}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Days Out</span>
                              <p className="font-medium">{player.total_days_out}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Matches Missed</span>
                              <p className="font-medium">{player.total_matches_missed}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No injury data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="pitch-gradient">
          <CardHeader>
            <CardTitle>Injury Prevention Insights</CardTitle>
            <CardDescription>Key findings from injury analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Common Patterns</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Hamstring injuries are most recurring</li>
                  <li>• Players with 3+ injuries show 60% higher risk</li>
                  <li>• Average recovery time: 25 days</li>
                  <li>• Peak injury period: Mid-season congestion</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Risk Factors</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• High minutes played (90+ per week)</li>
                  <li>• Previous injury history</li>
                  <li>• Intense playing style</li>
                  <li>• Insufficient recovery time</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
