import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Target, TrendingUp, Users } from 'lucide-react';

export default function Analytics() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analytics and advanced metrics
          </p>
        </div>

        <Tabs defaultValue="influence" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="influence">Influence Maps</TabsTrigger>
            <TabsTrigger value="xg">xG Shot Maps</TabsTrigger>
            <TabsTrigger value="carry">Carry Distance</TabsTrigger>
            <TabsTrigger value="comparison">Player Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="influence" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Player Influence Maps
                </CardTitle>
                <CardDescription>
                  Visualize player activity and impact across the pitch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center pitch-gradient">
                  <div className="text-center space-y-2">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Player influence heat map
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Select a player to view their influence zones
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Touch Zones</h4>
                    <p className="text-sm text-muted-foreground">
                      Areas where player receives and controls the ball
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Action Density</h4>
                    <p className="text-sm text-muted-foreground">
                      Frequency of actions in different pitch areas
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Impact Score</h4>
                    <p className="text-sm text-muted-foreground">
                      Weighted contribution in each zone
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="xg" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  xG Shot Maps
                </CardTitle>
                <CardDescription>
                  Expected goals visualization with shot locations and quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center pitch-gradient">
                  <div className="text-center space-y-2">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      xG shot map visualization
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Shot locations sized by xG value
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-accent rounded-lg">
                    <div className="text-2xl font-bold text-primary">0.00</div>
                    <div className="text-xs text-muted-foreground mt-1">Total xG</div>
                  </div>
                  <div className="text-center p-4 bg-accent rounded-lg">
                    <div className="text-2xl font-bold text-chart-2">0</div>
                    <div className="text-xs text-muted-foreground mt-1">Shots</div>
                  </div>
                  <div className="text-center p-4 bg-accent rounded-lg">
                    <div className="text-2xl font-bold text-chart-3">0</div>
                    <div className="text-xs text-muted-foreground mt-1">On Target</div>
                  </div>
                  <div className="text-center p-4 bg-accent rounded-lg">
                    <div className="text-2xl font-bold text-chart-4">0</div>
                    <div className="text-xs text-muted-foreground mt-1">Goals</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carry" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Carry Distance Metrics
                </CardTitle>
                <CardDescription>
                  Analyze ball-carrying actions and progressive movement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Carry distance visualization
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Track ball progression through dribbling
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Total Distance</h4>
                    <p className="text-sm text-muted-foreground">
                      Cumulative distance covered while carrying the ball
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Progressive Carries</h4>
                    <p className="text-sm text-muted-foreground">
                      Carries that move the ball significantly forward
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Final Third Entries</h4>
                    <p className="text-sm text-muted-foreground">
                      Successful carries into attacking areas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Player Comparison
                </CardTitle>
                <CardDescription>
                  Compare player statistics and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-6 bg-accent rounded-lg text-center">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Player 1</p>
                      <p className="text-xs text-muted-foreground mt-1">Select a player</p>
                    </div>
                    <div className="p-6 bg-accent rounded-lg text-center">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Player 2</p>
                      <p className="text-xs text-muted-foreground mt-1">Select a player</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Comparison Metrics</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Pass Completion %</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Progressive Passes</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">xG per 90</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Carry Distance</span>
                        <span className="font-medium">-</span>
                      </div>
                    </div>
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
