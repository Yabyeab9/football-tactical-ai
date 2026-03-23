import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, Zap, Brain } from 'lucide-react';
import { getUndiscoveredMetrics } from '@/db/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UndiscoveredMetric } from '@/types';

export default function UndiscoveredInsights() {
  const [metrics, setMetrics] = useState<UndiscoveredMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getUndiscoveredMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const mentalMetrics = metrics.filter(m => m.metric_category === 'mental');
  const performanceMetrics = metrics.filter(m => m.metric_category === 'performance');
  const environmentalMetrics = metrics.filter(m => m.metric_category === 'environmental');
  const managementMetrics = metrics.filter(m => m.metric_category === 'management');

  const getPercentileColor = (percentile: number | null) => {
    if (!percentile) return 'secondary';
    if (percentile >= 95) return 'default';
    if (percentile >= 85) return 'secondary';
    return 'outline';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Undiscovered Insights</h1>
          <p className="text-muted-foreground mt-2">
            Unique metrics and untapped analytical areas
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Metrics</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.length}</div>
              <p className="text-xs text-muted-foreground">Unique insights</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Elite Performers</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.filter(m => (m.percentile || 0) >= 95).length}
              </div>
              <p className="text-xs text-muted-foreground">95th percentile+</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Brain className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(metrics.map(m => m.metric_category)).size}
              </div>
              <p className="text-xs text-muted-foreground">Metric types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <Zap className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.length > 0
                  ? (
                      metrics.reduce((sum, m) => sum + (m.metric_value || 0), 0) / metrics.length
                    ).toFixed(1)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">Out of 10</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="mental" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="mental">Mental</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="environmental">Environmental</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
          </TabsList>

          <TabsContent value="mental" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Mental & Psychological Metrics
                </CardTitle>
                <CardDescription>
                  Clutch performance, momentum, and mental strength indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full bg-muted" />
                    ))}
                  </div>
                ) : mentalMetrics.length > 0 ? (
                  <div className="space-y-3">
                    {mentalMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{metric.metric_name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{metric.insights}</p>
                          </div>
                          <Badge variant={getPercentileColor(metric.percentile)}>
                            {metric.percentile?.toFixed(1)}th %ile
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Score</span>
                            <p className="font-medium text-lg">{metric.metric_value?.toFixed(1)}/10</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entity Type</span>
                            <p className="font-medium capitalize">{metric.entity_type}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entity ID</span>
                            <p className="font-medium">{metric.entity_id}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Percentile</span>
                            <p className="font-medium">{metric.percentile?.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No metrics available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Late game impact, momentum building, and performance patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full bg-muted" />
                    ))}
                  </div>
                ) : performanceMetrics.length > 0 ? (
                  <div className="space-y-3">
                    {performanceMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{metric.metric_name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{metric.insights}</p>
                          </div>
                          <Badge variant={getPercentileColor(metric.percentile)}>
                            {metric.percentile?.toFixed(1)}th %ile
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Score</span>
                            <p className="font-medium text-lg">{metric.metric_value?.toFixed(1)}/10</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entity Type</span>
                            <p className="font-medium capitalize">{metric.entity_type}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entity ID</span>
                            <p className="font-medium">{metric.entity_id}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Percentile</span>
                            <p className="font-medium">{metric.percentile?.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No metrics available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environmental" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Environmental Metrics
                </CardTitle>
                <CardDescription>
                  Weather adaptability, pitch conditions, and external factors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full bg-muted" />
                    ))}
                  </div>
                ) : environmentalMetrics.length > 0 ? (
                  <div className="space-y-3">
                    {environmentalMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{metric.metric_name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{metric.insights}</p>
                          </div>
                          <Badge variant={getPercentileColor(metric.percentile)}>
                            {metric.percentile?.toFixed(1)}th %ile
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Score</span>
                            <p className="font-medium text-lg">{metric.metric_value?.toFixed(1)}/10</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entity Type</span>
                            <p className="font-medium capitalize">{metric.entity_type}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entity ID</span>
                            <p className="font-medium">{metric.entity_id}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Percentile</span>
                            <p className="font-medium">{metric.percentile?.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No metrics available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Management Metrics
                </CardTitle>
                <CardDescription>
                  Managerial specializations and unique coaching attributes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full bg-muted" />
                    ))}
                  </div>
                ) : managementMetrics.length > 0 ? (
                  <div className="space-y-3">
                    {managementMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{metric.metric_name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{metric.insights}</p>
                          </div>
                          <Badge variant={getPercentileColor(metric.percentile)}>
                            {metric.percentile?.toFixed(1)}th %ile
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Score</span>
                            <p className="font-medium text-lg">{metric.metric_value?.toFixed(1)}/10</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entity Type</span>
                            <p className="font-medium capitalize">{metric.entity_type}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entity ID</span>
                            <p className="font-medium">{metric.entity_id}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Percentile</span>
                            <p className="font-medium">{metric.percentile?.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No metrics available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="pitch-gradient">
          <CardHeader>
            <CardTitle>Why These Metrics Matter</CardTitle>
            <CardDescription>Exploring untapped analytical territory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Traditional vs. Undiscovered</h4>
                <p className="text-sm text-muted-foreground">
                  While traditional metrics like goals, assists, and pass completion are valuable,
                  these undiscovered metrics reveal hidden patterns in player psychology, environmental
                  adaptability, and situational performance that standard analytics miss.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Real-World Impact</h4>
                <p className="text-sm text-muted-foreground">
                  Understanding clutch performance, weather adaptability, and momentum building can
                  provide crucial insights for team selection, tactical planning, and player
                  development strategies that give teams a competitive edge.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
