import { useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserCircle, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Scouting() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Scouting</h1>
          <p className="text-muted-foreground mt-2">
            Player discovery and comparison tools for talent identification
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Player Search
            </CardTitle>
            <CardDescription>
              Search for players by name, position, or attributes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => {
                // Search functionality would be implemented here
                console.log('Searching for:', searchTerm);
              }}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Forwards</Badge>
              <Badge variant="outline">Midfielders</Badge>
              <Badge variant="outline">Defenders</Badge>
              <Badge variant="outline">Goalkeepers</Badge>
              <Badge variant="outline">Under 23</Badge>
              <Badge variant="outline">High xG</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                Featured Players
              </CardTitle>
              <CardDescription>
                Top performers based on recent statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Bukayo Saka</p>
                      <p className="text-xs text-muted-foreground">Right Winger • Arsenal</p>
                    </div>
                    <Badge>⭐ 8.5</Badge>
                  </div>
                </div>
                <div className="p-3 bg-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Martin Ødegaard</p>
                      <p className="text-xs text-muted-foreground">Attacking Midfield • Arsenal</p>
                    </div>
                    <Badge>⭐ 8.3</Badge>
                  </div>
                </div>
                <div className="p-3 bg-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Kevin De Bruyne</p>
                      <p className="text-xs text-muted-foreground">Attacking Midfield • Man City</p>
                    </div>
                    <Badge>⭐ 8.8</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Rising Stars
              </CardTitle>
              <CardDescription>
                Young players showing exceptional potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Jamal Musiala</p>
                      <p className="text-xs text-muted-foreground">Attacking Midfield • Bayern</p>
                    </div>
                    <Badge variant="secondary">Age 21</Badge>
                  </div>
                </div>
                <div className="p-3 bg-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Pedri</p>
                      <p className="text-xs text-muted-foreground">Central Midfield • Barcelona</p>
                    </div>
                    <Badge variant="secondary">Age 21</Badge>
                  </div>
                </div>
                <div className="p-3 bg-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Vinícius Júnior</p>
                      <p className="text-xs text-muted-foreground">Left Winger • Real Madrid</p>
                    </div>
                    <Badge variant="secondary">Age 23</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Comparison Example: Saka vs Musiala (Prime Seasons)</CardTitle>
            <CardDescription>
              Statistical comparison of two elite young wingers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-semibold">Bukayo Saka</p>
                    <p className="text-xs text-muted-foreground">Arsenal • Right Winger</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pass Completion</span>
                    <span className="font-medium">87.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Progressive Passes</span>
                    <span className="font-medium">8 per 90</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">xG per 90</span>
                    <span className="font-medium">0.45</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carry Distance</span>
                    <span className="font-medium">245.5m</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-10 w-10 text-chart-2" />
                  <div>
                    <p className="font-semibold">Jamal Musiala</p>
                    <p className="text-xs text-muted-foreground">Bayern Munich • Attacking Mid</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pass Completion</span>
                    <span className="font-medium">89.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Progressive Passes</span>
                    <span className="font-medium">9 per 90</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">xG per 90</span>
                    <span className="font-medium">0.52</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carry Distance</span>
                    <span className="font-medium">268.3m</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
