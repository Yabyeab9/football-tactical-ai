import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Database, Info, Palette } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your Football Tactical AI experience
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the visual appearance of the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch
                  id="dark-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Data Source
              </CardTitle>
              <CardDescription>
                Information about the data powering this platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-medium">StatsBomb</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data Type</span>
                <span className="font-medium">Open Data</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Update Frequency</span>
                <span className="font-medium">Real-time</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Platform Features
              </CardTitle>
              <CardDescription>
                Available analytics and tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Pass Networks</span>
                <span className="text-primary">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Progressive Passes</span>
                <span className="text-primary">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pressing Analysis</span>
                <span className="text-primary">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span>xG Shot Maps</span>
                <span className="text-primary">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Player Comparison</span>
                <span className="text-primary">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span>AI Assistant</span>
                <span className="text-primary">✓</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                About
              </CardTitle>
              <CardDescription>
                Platform information and version
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Release Date</span>
                <span className="font-medium">2026-03-15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">License</span>
                <span className="font-medium">MIT</span>
              </div>
              <p className="text-muted-foreground pt-4">
                © 2026 Football Tactical AI. All rights reserved.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="pitch-gradient">
          <CardHeader>
            <CardTitle>Data Attribution</CardTitle>
            <CardDescription>
              This platform is powered by StatsBomb open data
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              StatsBomb provides high-quality football event data for analysis and research.
              The open data includes detailed event-level information from thousands of matches
              across major competitions worldwide.
            </p>
            <p className="mt-4">
              For more information about StatsBomb data, visit{' '}
              <a
                href="https://statsbomb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                statsbomb.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
