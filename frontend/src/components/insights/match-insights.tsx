import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AISummary, PlayerStats, MatchEvent } from '@/types'

interface AIInsightsBarProps {
  summary: AISummary
}

export const AIInsightsBar: React.FC<AIInsightsBarProps> = ({ summary }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card glassmorphic>
        <CardHeader>
          <CardTitle className="text-electric-lime">AI Tactical Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{summary.summary}</p>

          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-cyber-blue mb-2">Key Insights</h4>
              <ul className="space-y-1">
                {summary.keyInsights.map((insight, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="text-electric-lime mr-2">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-cyber-blue mb-2">Tactical Analysis</h4>
              <p className="text-sm">{summary.tacticalAnalysis}</p>
            </div>

            <div>
              <h4 className="font-semibold text-cyber-blue mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {summary.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="text-neon-pink mr-2">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface PlayerComparisonRadarProps {
  players: PlayerStats[]
}

export const PlayerComparisonRadar: React.FC<PlayerComparisonRadarProps> = ({ players }) => {
  // Simplified radar chart implementation
  const metrics = ['Passing', 'Shooting', 'Defending', 'Physical', 'Tactical']

  return (
    <Card glassmorphic>
      <CardHeader>
        <CardTitle className="text-electric-lime">Player Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-2">📊</div>
            <p>Advanced radar comparison chart</p>
            <p className="text-sm">Comparing {players.length} players across {metrics.length} metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {players.map((player) => (
            <div key={player.playerId} className="text-center">
              <h4 className="font-semibold text-cyber-blue">{player.name}</h4>
              <p className="text-sm text-muted-foreground">{player.position}</p>
              <div className="mt-2 space-y-1">
                {player.metrics.slice(0, 3).map((metric) => (
                  <div key={metric.name} className="flex justify-between text-xs">
                    <span>{metric.name}</span>
                    <span className="text-electric-lime">{metric.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface MatchTimelineProps {
  events: MatchEvent[]
  currentTime?: number
}

export const MatchTimeline: React.FC<MatchTimelineProps> = ({ events, currentTime }) => {
  const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp)

  return (
    <Card glassmorphic>
      <CardHeader>
        <CardTitle className="text-electric-lime">Match Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {/* Current time indicator */}
          {currentTime && (
            <motion.div
              className="absolute left-2 w-4 h-4 bg-electric-lime rounded-full border-2 border-background"
              style={{
                top: `${(currentTime / 5400) * 100}%` // Assuming 90 minutes = 5400 seconds
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}

          <div className="space-y-4 pl-8">
            {sortedEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start space-x-3"
              >
                <div className="flex-shrink-0 w-3 h-3 bg-cyber-blue rounded-full mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {Math.floor(event.timestamp / 60)}:{(event.timestamp % 60).toString().padStart(2, '0')}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      event.type === 'goal' ? 'bg-green-500/20 text-green-400' :
                      event.type === 'shot' ? 'bg-yellow-500/20 text-yellow-400' :
                      event.type === 'foul' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}