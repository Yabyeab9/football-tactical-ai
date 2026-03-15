import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp, Zap, Activity } from 'lucide-react';

export default function TacticalLab() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tactical Lab</h1>
          <p className="text-muted-foreground mt-2">
            Advanced tactical analysis tools for in-depth match insights
          </p>
        </div>

        <Tabs defaultValue="pass-networks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="pass-networks">Pass Networks</TabsTrigger>
            <TabsTrigger value="progressive">Progressive Passes</TabsTrigger>
            <TabsTrigger value="pressing">Pressing Intensity</TabsTrigger>
            <TabsTrigger value="possession">Possession Chains</TabsTrigger>
          </TabsList>

          <TabsContent value="pass-networks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Pass Network Analysis
                </CardTitle>
                <CardDescription>
                  Visualize passing patterns and player connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Pass network visualization will appear here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Select a match to view pass networks
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Key Metrics</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Pass completion rate</li>
                      <li>• Average pass length</li>
                      <li>• Key passing lanes</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Player Connections</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Most frequent partnerships</li>
                      <li>• Pass exchange volume</li>
                      <li>• Connection strength</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Insights</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Build-up patterns</li>
                      <li>• Attacking structure</li>
                      <li>• Defensive shape</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progressive" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Progressive Passes
                </CardTitle>
                <CardDescription>
                  Track passes that move the ball significantly towards the opponent's goal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Progressive passes visualization
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Analyze forward ball progression
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Definition</h4>
                    <p className="text-sm text-muted-foreground">
                      A progressive pass moves the ball at least 10 yards closer to the opponent's goal
                      or into the penalty area from outside.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Identifies players who excel at breaking lines and advancing play through passing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pressing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Pressing Intensity
                </CardTitle>
                <CardDescription>
                  Analyze defensive pressure and PPDA (Passes Per Defensive Action)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Zap className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Pressing intensity heat map
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Visualize defensive pressure zones
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">PPDA</h4>
                    <p className="text-sm text-muted-foreground">
                      Lower values indicate more intense pressing
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Pressure Zones</h4>
                    <p className="text-sm text-muted-foreground">
                      High, medium, and low press areas
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Success Rate</h4>
                    <p className="text-sm text-muted-foreground">
                      Percentage of successful pressures
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="possession" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Possession Chains
                </CardTitle>
                <CardDescription>
                  Track sequences of possession and ball progression
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Possession chain visualization
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Analyze ball movement sequences
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Chain Analysis</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Average chain length</li>
                      <li>• Successful sequences</li>
                      <li>• Territory gained</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Outcomes</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Shots created</li>
                      <li>• Turnovers</li>
                      <li>• Final third entries</li>
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
