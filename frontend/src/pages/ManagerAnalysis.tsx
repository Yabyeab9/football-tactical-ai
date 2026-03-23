import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Shield, TrendingUp, Target } from 'lucide-react';
import { getEPLSpecialists, getRelegationSpecialists } from '@/db/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ManagerPerformance } from '@/types';
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

export default function ManagerAnalysis() {
  const [eplSpecialists, setEplSpecialists] = useState<ManagerPerformance[]>([]);
  const [relegationExperts, setRelegationExperts] = useState<ManagerPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [epl, relegation] = await Promise.all([
          getEPLSpecialists(),
          getRelegationSpecialists(),
        ]);
        setEplSpecialists(epl);
        setRelegationExperts(relegation);
      } catch (error) {
        console.error('Error loading manager data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const eplChartData = eplSpecialists.slice(0, 8).map(perf => ({
    name: perf.manager?.manager_name.split(' ').pop() || 'Unknown',
    ppg: perf.points_per_game || 0,
    wins: perf.wins,
    win_rate: ((perf.wins / perf.matches_managed) * 100).toFixed(1),
  }));

  const relegationChartData = relegationExperts.slice(0, 8).map(perf => ({
    name: perf.manager?.manager_name.split(' ').pop() || 'Unknown',
    points_from_relegation: perf.points_from_relegation || 0,
    matches: perf.matches_managed,
    ppg: perf.points_per_game || 0,
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manager Analysis</h1>
          <p className="text-muted-foreground mt-2">
            EPL specialists and relegation survival experts
          </p>
        </div>

        <Tabs defaultValue="epl" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="epl">EPL Specialists</TabsTrigger>
            <TabsTrigger value="relegation">Relegation Experts</TabsTrigger>
          </TabsList>

          <TabsContent value="epl" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Manager</CardTitle>
                  <Trophy className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {eplSpecialists[0]?.manager?.manager_name || '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {eplSpecialists[0]?.points_per_game?.toFixed(2) || '-'} PPG
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Win Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-chart-2" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {eplSpecialists.length > 0
                      ? (
                          (eplSpecialists.reduce(
                            (sum, p) => sum + (p.wins / p.matches_managed) * 100,
                            0
                          ) /
                            eplSpecialists.length)
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">EPL specialists</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                  <Target className="h-4 w-4 text-chart-3" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {eplSpecialists.reduce((sum, p) => sum + p.matches_managed, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Managed in EPL</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Best PPG</CardTitle>
                  <Trophy className="h-4 w-4 text-chart-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.max(...eplSpecialists.map(p => p.points_per_game || 0)).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Points per game</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>EPL Performance Comparison</CardTitle>
                <CardDescription>Points per game and win rates</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full bg-muted" />
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={eplChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ppg" fill="hsl(var(--chart-1))" name="Points Per Game" />
                      <Bar dataKey="wins" fill="hsl(var(--chart-2))" name="Total Wins" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  EPL-Favoured Managers
                </CardTitle>
                <CardDescription>
                  Managers with exceptional Premier League records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full bg-muted" />
                    ))}
                  </div>
                ) : eplSpecialists.length > 0 ? (
                  <div className="space-y-3">
                    {eplSpecialists.map((perf, index) => (
                      <div
                        key={perf.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold text-muted-foreground">
                                #{index + 1}
                              </span>
                              <div>
                                <h3 className="font-semibold">
                                  {perf.manager?.manager_name || 'Unknown'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary">
                                    {perf.manager?.coaching_style || 'N/A'}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {perf.manager?.nationality || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">PPG</span>
                                <p className="font-medium">{perf.points_per_game?.toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Matches</span>
                                <p className="font-medium">{perf.matches_managed}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Win Rate</span>
                                <p className="font-medium">
                                  {((perf.wins / perf.matches_managed) * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Record</span>
                                <p className="font-medium">
                                  {perf.wins}W-{perf.draws}D-{perf.losses}L
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Position</span>
                                <p className="font-medium">{perf.final_position || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relegation" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Survivor</CardTitle>
                  <Shield className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {relegationExperts[0]?.manager?.manager_name || '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{relegationExperts[0]?.points_from_relegation || 0} pts from drop
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-chart-2" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {relegationExperts.length > 0
                      ? (
                          (relegationExperts.filter(p => p.survival_success).length /
                            relegationExperts.length) *
                          100
                        ).toFixed(0)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">Survival rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Battles Won</CardTitle>
                  <Trophy className="h-4 w-4 text-chart-3" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {relegationExperts.filter(p => p.survival_success).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Successful survivals</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
                  <Target className="h-4 w-4 text-chart-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {relegationExperts.length > 0
                      ? (
                          relegationExperts.reduce(
                            (sum, p) => sum + (p.points_from_relegation || 0),
                            0
                          ) / relegationExperts.length
                        ).toFixed(1)
                      : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Points from drop</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Relegation Battle Performance</CardTitle>
                <CardDescription>Points from relegation zone</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full bg-muted" />
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={relegationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="points_from_relegation"
                        fill="hsl(var(--chart-1))"
                        name="Points From Relegation"
                      />
                      <Bar dataKey="ppg" fill="hsl(var(--chart-2))" name="Points Per Game" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Relegation Survival Specialists
                </CardTitle>
                <CardDescription>
                  Managers who excel at keeping teams in the league
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full bg-muted" />
                    ))}
                  </div>
                ) : relegationExperts.length > 0 ? (
                  <div className="space-y-3">
                    {relegationExperts.map((perf, index) => (
                      <div
                        key={perf.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold text-muted-foreground">
                                #{index + 1}
                              </span>
                              <div>
                                <h3 className="font-semibold">
                                  {perf.manager?.manager_name || 'Unknown'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary">
                                    {perf.manager?.coaching_style || 'N/A'}
                                  </Badge>
                                  {perf.survival_success && (
                                    <Badge variant="outline" className="text-primary">
                                      ✓ Survived
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Pts From Drop</span>
                                <p className="font-medium">+{perf.points_from_relegation}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">PPG</span>
                                <p className="font-medium">{perf.points_per_game?.toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Matches</span>
                                <p className="font-medium">{perf.matches_managed}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Record</span>
                                <p className="font-medium">
                                  {perf.wins}W-{perf.draws}D-{perf.losses}L
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Position</span>
                                <p className="font-medium">{perf.final_position || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card className="pitch-gradient">
              <CardHeader>
                <CardTitle>Survival Tactics</CardTitle>
                <CardDescription>Key strategies for relegation battles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Common Approaches</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Defensive organization and discipline</li>
                      <li>• Set-piece effectiveness</li>
                      <li>• Home fortress mentality</li>
                      <li>• Experienced squad additions</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Success Factors</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Strong team morale and unity</li>
                      <li>• Tactical flexibility</li>
                      <li>• Winning crucial 6-pointer matches</li>
                      <li>• Late-season momentum</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}