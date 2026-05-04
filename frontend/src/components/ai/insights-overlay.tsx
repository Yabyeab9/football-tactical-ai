import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BrainCircuit,
  AlertTriangle,
  TrendingUp,
  Target,
  Zap,
  Shield,
  Activity
} from 'lucide-react'

// Import types from the backend services
interface TacticalBrief {
  type: string
  timestamp: string
  title: string
  analysis: string
  confidence: number
  recommendations: string[]
}

interface PredictionResult {
  home_win_prob: number
  draw_prob: number
  away_win_prob: number
  confidence: number
  key_factors: string[]
  momentum_shift?: string
}

interface PlayerForecast {
  player_id: string
  scoring_probability: number
  assisting_probability: number
  threat_level: 'high' | 'medium' | 'low'
  key_factors: string[]
}

interface SmartAnnotation {
  id: string
  x: number
  y: number
  type: 'critical_pass' | 'threat_zone' | 'pressing_trap' | 'anomaly'
  title: string
  description: string
  confidence: number
  icon: string
}

interface TacticalAnomaly {
  type: string
  alert: string
  description: string
  confidence: number
  recommendation: string
}

interface AIInsightsOverlayProps {
  matchId: string
  currentMinute: number
  isVisible: boolean
  onAnnotationClick?: (annotation: SmartAnnotation) => void
  className?: string
}

export const AIInsightsOverlay: React.FC<AIInsightsOverlayProps> = ({
  matchId,
  currentMinute,
  isVisible,
  onAnnotationClick,
  className
}) => {
  const [tacticalBrief, setTacticalBrief] = useState<TacticalBrief | null>(null)
  const [predictions, setPredictions] = useState<PredictionResult | null>(null)
  const [playerForecasts, setPlayerForecasts] = useState<PlayerForecast[]>([])
  const [annotations, setAnnotations] = useState<SmartAnnotation[]>([])
  const [anomalies, setAnomalies] = useState<TacticalAnomaly[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Mock data - in real implementation, this would fetch from backend APIs
  useEffect(() => {
    if (!isVisible) return

    const fetchInsights = async () => {
      setIsLoading(true)

      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock tactical brief
      setTacticalBrief({
        type: 'live_analysis',
        timestamp: new Date().toISOString(),
        title: 'High Press Causing Turnovers in Final Third',
        analysis: 'Manchester City\'s aggressive pressing has forced Liverpool into 3 turnovers in the last 10 minutes, all occurring within 25 yards of the Liverpool goal. This is creating high-quality scoring opportunities.',
        confidence: 0.87,
        recommendations: [
          'Maintain pressing intensity in the half-spaces',
          'Position central midfielders to cover counter-attack lanes',
          'Consider dropping deeper if Liverpool breaks the press'
        ]
      })

      // Mock predictions
      setPredictions({
        home_win_prob: 0.68,
        draw_prob: 0.19,
        away_win_prob: 0.13,
        confidence: 0.82,
        key_factors: [
          'Home team dominance in possession (62%)',
          'Recent goal shifted momentum',
          'Away team showing fatigue signs'
        ],
        momentum_shift: 'Home team gained momentum after 67th minute goal'
      })

      // Mock player forecasts
      setPlayerForecasts([
        {
          player_id: 'kevin_de_bruyne',
          scoring_probability: 0.23,
          assisting_probability: 0.34,
          threat_level: 'high',
          key_factors: [
            'Central positioning with space',
            'Recent passing accuracy at 89%',
            'Fresh legs after substitution'
          ]
        },
        {
          player_id: 'mohamed_salah',
          scoring_probability: 0.18,
          assisting_probability: 0.28,
          threat_level: 'medium',
          key_factors: [
            'Limited space on the wing',
            'Under close defensive attention',
            'Showing signs of fatigue'
          ]
        }
      ])

      // Mock smart annotations
      setAnnotations([
        {
          id: 'critical_pass_1',
          x: 75,
          y: 45,
          type: 'critical_pass',
          title: 'Critical Breaking Pass',
          description: 'De Bruyne\'s through ball split the defense perfectly, creating a 3v2 situation',
          confidence: 0.92,
          icon: '🎯'
        },
        {
          id: 'threat_zone_1',
          x: 85,
          y: 40,
          type: 'threat_zone',
          title: 'High-Threat Zone',
          description: 'Opposition has conceded 4 goals from this area this season',
          confidence: 0.78,
          icon: '⚠️'
        },
        {
          id: 'pressing_trap_1',
          x: 35,
          y: 50,
          type: 'pressing_trap',
          title: 'Pressing Trap Active',
          description: 'Home team pressing trigger: opposition right-back with ball',
          confidence: 0.85,
          icon: '🪤'
        }
      ])

      // Mock anomalies
      setAnomalies([
        {
          type: 'pressing_anomaly',
          alert: '⚠️ Pressing effectiveness dropping',
          description: 'Multiple failed recoveries in last 5 minutes',
          confidence: 0.8,
          recommendation: 'Consider dropping defensive line or adjusting pressing triggers'
        }
      ])

      setIsLoading(false)
    }

    fetchInsights()
  }, [matchId, currentMinute, isVisible])

  const getAnnotationColor = (type: string) => {
    switch (type) {
      case 'critical_pass': return 'text-electric-lime'
      case 'threat_zone': return 'text-neon-pink'
      case 'pressing_trap': return 'text-cyber-blue'
      case 'anomaly': return 'text-destructive'
      default: return 'text-muted-foreground'
    }
  }

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/50'
      default: return 'bg-muted/20 text-muted-foreground border-muted/50'
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm ${className}`}
      >
        <div className="container mx-auto p-6 h-full overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

            {/* Left Panel - Tactical Analysis */}
            <div className="space-y-4">
              <Card glassmorphic className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-electric-lime">
                    <BrainCircuit className="h-5 w-5" />
                    Live Tactical Brief
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted/20 rounded w-3/4"></div>
                      <div className="h-4 bg-muted/20 rounded w-full"></div>
                      <div className="h-4 bg-muted/20 rounded w-2/3"></div>
                    </div>
                  ) : tacticalBrief ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-cyber-blue mb-2">{tacticalBrief.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{tacticalBrief.analysis}</p>
                        <Badge variant="secondary" className="text-xs">
                          Confidence: {(tacticalBrief.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2 text-neon-pink">Recommendations:</h5>
                        <ul className="space-y-1">
                          {tacticalBrief.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm flex items-start">
                              <span className="text-electric-lime mr-2">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No tactical analysis available</p>
                  )}
                </CardContent>
              </Card>

              {/* Smart Annotations */}
              <Card glassmorphic className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyber-blue">
                    <Target className="h-5 w-5" />
                    Smart Annotations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {annotations.map((annotation) => (
                      <motion.div
                        key={annotation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 rounded-lg border border-border/50 hover:border-border cursor-pointer"
                        onClick={() => onAnnotationClick?.(annotation)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{annotation.icon}</span>
                          <div className="flex-1">
                            <h5 className={`font-medium ${getAnnotationColor(annotation.type)}`}>
                              {annotation.title}
                            </h5>
                            <p className="text-sm text-muted-foreground mt-1">
                              {annotation.description}
                            </p>
                            <Badge variant="outline" className="text-xs mt-2">
                              {(annotation.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center Panel - Predictions & Anomalies */}
            <div className="space-y-4">
              <Card glassmorphic>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-neon-pink">
                    <TrendingUp className="h-5 w-5" />
                    Live Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {predictions ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-electric-lime">
                            {(predictions.home_win_prob * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Home Win</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-cyber-blue">
                            {(predictions.draw_prob * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Draw</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-neon-pink">
                            {(predictions.away_win_prob * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Away Win</div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Key Factors:</h5>
                        <ul className="space-y-1">
                          {predictions.key_factors.map((factor, index) => (
                            <li key={index} className="text-sm flex items-start">
                              <span className="text-electric-lime mr-2">•</span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {predictions.momentum_shift && (
                        <div className="p-3 bg-cyber-blue/10 border border-cyber-blue/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-cyber-blue" />
                            <span className="text-sm font-medium text-cyber-blue">
                              {predictions.momentum_shift}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Predictions loading...</p>
                  )}
                </CardContent>
              </Card>

              {/* Tactical Anomalies */}
              <Card glassmorphic>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Tactical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {anomalies.map((anomaly, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                      >
                        <h5 className="font-medium text-destructive mb-1">{anomaly.alert}</h5>
                        <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
                        <p className="text-sm font-medium text-cyber-blue">{anomaly.recommendation}</p>
                      </motion.div>
                    ))}
                    {anomalies.length === 0 && (
                      <p className="text-muted-foreground text-sm">No tactical anomalies detected</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Player Forecasts */}
            <div className="space-y-4">
              <Card glassmorphic>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-electric-lime">
                    <Activity className="h-5 w-5" />
                    Player Threat Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {playerForecasts.map((forecast) => (
                      <motion.div
                        key={forecast.player_id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 border border-border/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold capitalize">
                            {forecast.player_id.replace('_', ' ')}
                          </h5>
                          <Badge className={getThreatLevelColor(forecast.threat_level)}>
                            {forecast.threat_level.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-electric-lime">
                              {(forecast.scoring_probability * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Scoring</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-cyber-blue">
                              {(forecast.assisting_probability * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Assisting</div>
                          </div>
                        </div>

                        <div>
                          <h6 className="text-sm font-medium mb-2">Key Factors:</h6>
                          <ul className="space-y-1">
                            {forecast.key_factors.slice(0, 2).map((factor, index) => (
                              <li key={index} className="text-xs text-muted-foreground flex items-start">
                                <span className="text-electric-lime mr-1">•</span>
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Close Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed top-4 right-4"
          >
            <Button
              variant="ghost"
              size="sm"
              className="bg-background/80 backdrop-blur-sm"
              onClick={() => {/* Close overlay */}}
            >
              ✕ Close AI Insights
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}