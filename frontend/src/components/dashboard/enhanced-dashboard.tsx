import React from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout, DashboardGrid, DashboardCard } from '@/components/dashboard/layout'
import { InteractivePitch } from '@/components/pitch/interactive-pitch'
import { AIInsightsBar, PlayerComparisonRadar, MatchTimeline } from '@/components/insights/match-insights'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BrainCircuit, Target, Activity, TrendingUp } from 'lucide-react'

// Mock data for demonstration
const mockPassNetwork = {
  nodes: [
    { id: '1', x: 20, y: 30, degreeCentrality: 0.8, betweennessCentrality: 0.6, playerName: 'Player 1' },
    { id: '2', x: 40, y: 50, degreeCentrality: 0.9, betweennessCentrality: 0.7, playerName: 'Player 2' },
    { id: '3', x: 60, y: 40, degreeCentrality: 0.7, betweennessCentrality: 0.5, playerName: 'Player 3' },
  ],
  edges: [
    { source: '1', target: '2', weight: 15, successRate: 0.85 },
    { source: '2', target: '3', weight: 12, successRate: 0.78 },
    { source: '1', target: '3', weight: 8, successRate: 0.92 },
  ]
}

const mockAISummary = {
  summary: "Manchester City dominates possession with 68% ball control, creating high-quality chances through precise passing combinations.",
  keyInsights: [
    "City's left flank is particularly dangerous with overlapping runs",
    "Away team's defensive shape is vulnerable to counter-attacks",
    "Key player fatigue showing in the final third"
  ],
  tacticalAnalysis: "The home team is employing a high-pressing strategy that disrupts the away team's build-up play, forcing turnovers in dangerous areas.",
  recommendations: [
    "Increase width on the right side to stretch the play",
    "Focus on quick transitions after winning the ball",
    "Target the space behind the left back"
  ]
}

const mockPlayers = [
  {
    playerId: '1',
    name: 'Kevin De Bruyne',
    position: 'Midfielder',
    metrics: [
      { name: 'Passing Accuracy', value: 89.2, unit: '%', description: 'Pass completion rate' },
      { name: 'Key Passes', value: 2.3, unit: 'per game', description: 'Passes leading to shots' },
      { name: 'xG Assisted', value: 0.45, unit: 'per game', description: 'Expected goals from assists' }
    ]
  },
  {
    playerId: '2',
    name: 'Erling Haaland',
    position: 'Forward',
    metrics: [
      { name: 'Goals', value: 1.8, unit: 'per game', description: 'Goals scored' },
      { name: 'xG', value: 2.1, unit: 'per game', description: 'Expected goals' },
      { name: 'Shots on Target', value: 4.2, unit: 'per game', description: 'Accurate shots' }
    ]
  }
]

const mockEvents = [
  { id: '1', timestamp: 120, type: 'goal', playerId: '1', coordinate: { x: 85, y: 45 }, description: 'Kevin De Bruyne scores from outside the box!' },
  { id: '2', timestamp: 245, type: 'shot', playerId: '2', coordinate: { x: 88, y: 42 }, description: 'Erling Haaland hits the post' },
  { id: '3', timestamp: 312, type: 'foul', playerId: '3', coordinate: { x: 35, y: 55 }, description: 'Yellow card for dangerous tackle' }
]

export const EnhancedDashboard: React.FC = () => {
  const sidebarContent = (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-electric-lime mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <Button className="w-full justify-start" variant="ghost">
            <BrainCircuit className="mr-2 h-4 w-4" />
            AI Assistant
          </Button>
          <Button className="w-full justify-start" variant="ghost">
            <Target className="mr-2 h-4 w-4" />
            Live Predictions
          </Button>
          <Button className="w-full justify-start" variant="ghost">
            <Activity className="mr-2 h-4 w-4" />
            Match Analysis
          </Button>
        </div>
      </div>

      <Card glassmorphic>
        <CardHeader>
          <CardTitle className="text-cyber-blue">Live Match</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold">Man City</div>
            <div className="text-4xl font-black my-2">2 - 1</div>
            <div className="text-2xl font-bold">Arsenal</div>
            <Badge className="mt-2">67'</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const headerContent = (
    <div className="flex items-center justify-between p-6">
      <div>
        <h1 className="text-3xl font-bold text-electric-lime">Football Tactical AI</h1>
        <p className="text-muted-foreground">Elite analytics platform for professional football intelligence</p>
      </div>
      <div className="flex items-center space-x-4">
        <Badge variant="secondary" className="bg-cyber-blue/20 text-cyber-blue">
          <TrendingUp className="mr-1 h-3 w-3" />
          Live Data
        </Badge>
        <Badge variant="secondary" className="bg-neon-pink/20 text-neon-pink">
          AI Powered
        </Badge>
      </div>
    </div>
  )

  return (
    <DashboardLayout sidebar={sidebarContent} header={headerContent}>
      <DashboardGrid columns={3}>
        <DashboardCard title="Interactive Pitch Analysis">
          <InteractivePitch
            passNetwork={mockPassNetwork}
            onPlayerClick={(playerId) => console.log('Player clicked:', playerId)}
          />
        </DashboardCard>

        <DashboardCard title="AI Tactical Insights">
          <AIInsightsBar summary={mockAISummary} />
        </DashboardCard>

        <DashboardCard title="Player Performance Radar">
          <PlayerComparisonRadar players={mockPlayers} />
        </DashboardCard>

        <DashboardCard title="Live Match Timeline">
          <MatchTimeline events={mockEvents} currentTime={312} />
        </DashboardCard>

        <DashboardCard title="Real-time Metrics">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-electric-lime">68%</div>
              <div className="text-sm text-muted-foreground">Possession</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyber-blue">12</div>
              <div className="text-sm text-muted-foreground">Shots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-pink">487</div>
              <div className="text-sm text-muted-foreground">Passes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-electric-lime">89%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Predictive Analytics">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Home Win</span>
              <span className="font-bold text-electric-lime">65%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-electric-lime h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>

            <div className="flex justify-between items-center">
              <span>Draw</span>
              <span className="font-bold text-cyber-blue">20%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-cyber-blue h-2 rounded-full" style={{ width: '20%' }}></div>
            </div>

            <div className="flex justify-between items-center">
              <span>Away Win</span>
              <span className="font-bold text-neon-pink">15%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-neon-pink h-2 rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>
        </DashboardCard>
      </DashboardGrid>
    </DashboardLayout>
  )
}