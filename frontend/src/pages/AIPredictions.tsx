import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, Target, Zap } from 'lucide-react';
import { getAIPredictions } from '@/db/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AIPrediction } from '@/types';

export default function AIPredictions() {
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAIPredictions();
        setPredictions(data);
      } catch (error) {
        console.error('Error loading predictions:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const injuryPredictions = predictions.filter(p => p.prediction_type === 'injury_risk');
  const relegationPredictions = predictions.filter(p => p.prediction_type === 'relegation_survival');
  const eplPredictions = predictions.filter(p => p.prediction_type === 'epl_success');

  const getConfidenceColor = (score: number | null) => {
    if (!score) return 'secondary';
    if (score >= 0.85) return 'default';
    if (score >= 0.7) return 'secondary';
    return 'outline';
  };

  const getRiskColor = (value: number | null) => {
    if (!value) return 'secondary';
    if (value >= 0.7) return 'destructive';
    if (value >= 0.4) return 'secondary';
    return 'outline';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Predictions</h1>
          <p className="text-muted-foreground mt-2">
            Machine learning-powered insights and predictions
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
              <Brain className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{predictions.length}</div>
              <p className="text-xs text-muted-foreground">Active predictions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <Target className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {predictions.length > 0
                  ? (
                      (predictions.reduce((sum, p) => sum + (p.confidence_score || 0), 0) /
                        predictions.length) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Model confidence</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <Zap className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {injuryPredictions.filter(p => (p.prediction_value || 0) >= 0.7).length}
              </div>
              <p className="text-xs text-muted-foreground">Injury risk alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Model Version</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">v1.0</div>
              <p className="text-xs text-muted-foreground">Latest model</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="injury" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="injury">Injury Risk</TabsTrigger>
            <TabsTrigger value="relegation">Relegation</TabsTrigger>
            <TabsTrigger value="epl">EPL Success</TabsTrigger>
          </TabsList>

          <TabsContent value="injury" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-destructive" />
                  Injury Risk Predictions
                </CardTitle>
                <CardDescription>
                  AI-powered injury probability assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full bg-muted" />
                    ))}
                  </div>
                ) : injuryPredictions.length > 0 ? (
                  <div className="space-y-3">
                    {injuryPredictions.map((pred) => (
                      <div
                        key={pred.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">Player ID: {pred.entity_id}</h3>
                              <Badge variant={getRiskColor(pred.prediction_value)}>
                                {((pred.prediction_value || 0) * 100).toFixed(0)}% Risk
                              </Badge>
                              <Badge variant={getConfidenceColor(pred.confidence_score)}>
                                {((pred.confidence_score || 0) * 100).toFixed(0)}% Confidence
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Prediction Date</span>
                                <p className="font-medium">{pred.prediction_date}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Model</span>
                                <p className="font-medium">{pred.model_version || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Risk Level</span>
                                <p className="font-medium">
                                  {(pred.prediction_value || 0) >= 0.7
                                    ? 'High'
                                    : (pred.prediction_value || 0) >= 0.4
                                      ? 'Moderate'
                                      : 'Low'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Features</span>
                                <p className="font-medium">
                                  {pred.features ? Object.keys(pred.features).length : 0} factors
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No predictions available</p>
                )}
              </CardContent>
            </Card>

            <Card className="pitch-gradient">
              <CardHeader>
                <CardTitle>Prediction Methodology</CardTitle>
                <CardDescription>How injury risk is calculated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Our AI model analyzes multiple factors to predict injury risk:
                  </p>
                  <ul className="text-muted-foreground space-y-1 ml-4">
                    <li>• Historical injury patterns and frequency</li>
                    <li>• Minutes played and workload intensity</li>
                    <li>• Age and physical condition indicators</li>
                    <li>• Playing style and position-specific risks</li>
                    <li>• Recovery time between matches</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relegation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Relegation Survival Predictions
                </CardTitle>
                <CardDescription>
                  Manager success probability in relegation battles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full bg-muted" />
                    ))}
                  </div>
                ) : relegationPredictions.length > 0 ? (
                  <div className="space-y-3">
                    {relegationPredictions.map((pred) => (
                      <div
                        key={pred.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">Manager ID: {pred.entity_id}</h3>
                              <Badge variant="default">
                                {((pred.prediction_value || 0) * 100).toFixed(0)}% Success Rate
                              </Badge>
                              <Badge variant={getConfidenceColor(pred.confidence_score)}>
                                {((pred.confidence_score || 0) * 100).toFixed(0)}% Confidence
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Prediction Date</span>
                                <p className="font-medium">{pred.prediction_date}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Model</span>
                                <p className="font-medium">{pred.model_version || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Survival Chance</span>
                                <p className="font-medium">
                                  {(pred.prediction_value || 0) >= 0.75 ? 'High' : 'Moderate'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Features</span>
                                <p className="font-medium">
                                  {pred.features ? Object.keys(pred.features).length : 0} factors
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No predictions available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="epl" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  EPL Success Predictions
                </CardTitle>
                <CardDescription>
                  Manager performance forecasts in Premier League
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full bg-muted" />
                    ))}
                  </div>
                ) : eplPredictions.length > 0 ? (
                  <div className="space-y-3">
                    {eplPredictions.map((pred) => (
                      <div
                        key={pred.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">Manager ID: {pred.entity_id}</h3>
                              <Badge variant="default">
                                {((pred.prediction_value || 0) * 100).toFixed(0)}% Success Rate
                              </Badge>
                              <Badge variant={getConfidenceColor(pred.confidence_score)}>
                                {((pred.confidence_score || 0) * 100).toFixed(0)}% Confidence
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Prediction Date</span>
                                <p className="font-medium">{pred.prediction_date}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Model</span>
                                <p className="font-medium">{pred.model_version || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">EPL Mastery</span>
                                <p className="font-medium">
                                  {(pred.prediction_value || 0) >= 0.9
                                    ? 'Elite'
                                    : (pred.prediction_value || 0) >= 0.75
                                      ? 'High'
                                      : 'Moderate'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Features</span>
                                <p className="font-medium">
                                  {pred.features ? Object.keys(pred.features).length : 0} factors
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No predictions available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
