import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AIInsightsOverlay } from '@/components/ai/insights-overlay'
import { PassNetworkNode, PassNetworkEdge, PitchMapDatum, ShotMapPoint } from '@/types'

interface InteractivePitchProps {
  width?: number
  height?: number
  passNetwork?: {
    nodes: PassNetworkNode[]
    edges: PassNetworkEdge[]
  }
  heatmap?: PitchMapDatum[]
  shotMap?: ShotMapPoint[]
  onPlayerClick?: (playerId: string) => void
  className?: string
}

export const InteractivePitch: React.FC<InteractivePitchProps> = ({
  width = 800,
  height = 600,
  passNetwork,
  heatmap,
  shotMap,
  onPlayerClick,
  className
}) => {
  const [showAIOverlay, setShowAIOverlay] = useState(false)
  const [selectedAnnotation, setSelectedAnnotation] = useState<any>(null)
  const pitchSvg = useMemo(() => {
    const pitchWidth = 100
    const pitchHeight = 100

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${pitchWidth} ${pitchHeight}`}
        className={`border border-border rounded-lg ${className}`}
      >
        {/* Pitch Background */}
        <rect
          x="0"
          y="0"
          width={pitchWidth}
          height={pitchHeight}
          fill="#1a5d1a"
          stroke="#ffffff"
          strokeWidth="0.5"
        />

        {/* Center Circle */}
        <circle
          cx={pitchWidth / 2}
          cy={pitchHeight / 2}
          r="9.15"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.3"
        />

        {/* Center Line */}
        <line
          x1={pitchWidth / 2}
          y1="0"
          x2={pitchWidth / 2}
          y2={pitchHeight}
          stroke="#ffffff"
          strokeWidth="0.3"
        />

        {/* Penalty Areas */}
        <rect
          x="0"
          y={(pitchHeight - 16.5) / 2}
          width="16.5"
          height="16.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.3"
        />
        <rect
          x={pitchWidth - 16.5}
          y={(pitchHeight - 16.5) / 2}
          width="16.5"
          height="16.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.3"
        />

        {/* Goal Areas */}
        <rect
          x="0"
          y={(pitchHeight - 5.5) / 2}
          width="5.5"
          height="5.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.3"
        />
        <rect
          x={pitchWidth - 5.5}
          y={(pitchHeight - 5.5) / 2}
          width="5.5"
          height="5.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.3"
        />

        {/* Goals */}
        <rect
          x="-1"
          y={(pitchHeight - 2) / 2}
          width="1"
          height="2"
          fill="#ffffff"
        />
        <rect
          x={pitchWidth}
          y={(pitchHeight - 2) / 2}
          width="1"
          height="2"
          fill="#ffffff"
        />
      </svg>
    )
  }, [width, height])

  const heatmapOverlay = useMemo(() => {
    if (!heatmap) return null

    const maxIntensity = Math.max(...heatmap.map(d => d.intensity))
    const points = heatmap.map(d => `${d.coordinate.x},${d.coordinate.y}`).join(' ')

    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        className="absolute inset-0 pointer-events-none"
      >
        <defs>
          <radialGradient id="heatmapGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff0000" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffff00" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00ff00" stopOpacity="0.2" />
          </radialGradient>
        </defs>
        <polygon
          points={points}
          fill="url(#heatmapGradient)"
          opacity="0.6"
        />
      </svg>
    )
  }, [heatmap, width, height])

  const passNetworkOverlay = useMemo(() => {
    if (!passNetwork) return null

    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        className="absolute inset-0 pointer-events-none"
      >
        {/* Edges */}
        {passNetwork.edges.map((edge, index) => {
          const sourceNode = passNetwork.nodes.find(n => n.id === edge.source)
          const targetNode = passNetwork.nodes.find(n => n.id === edge.target)
          if (!sourceNode || !targetNode) return null

          return (
            <motion.line
              key={index}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="#00D4FF"
              strokeWidth={Math.max(0.5, edge.weight / 10)}
              strokeOpacity={edge.successRate}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: index * 0.1 }}
            />
          )
        })}

        {/* Nodes */}
        {passNetwork.nodes.map((node) => (
          <motion.circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={Math.max(1, node.degreeCentrality * 3)}
            fill="#CCFF00"
            stroke="#00D4FF"
            strokeWidth="0.5"
            className="cursor-pointer"
            whileHover={{ scale: 1.2, fill: "#FF0080" }}
            onClick={() => onPlayerClick?.(node.id)}
          />
        ))}
      </svg>
    )
  }, [passNetwork, width, height, onPlayerClick])

  const shotMapOverlay = useMemo(() => {
    if (!shotMap) return null

    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        className="absolute inset-0 pointer-events-none"
      >
        {shotMap.map((shot, index) => (
          <motion.circle
            key={index}
            cx={shot.coordinate.x}
            cy={shot.coordinate.y}
            r={Math.max(0.5, shot.xg * 3)}
            fill={shot.outcome === 'goal' ? '#CCFF00' : '#FF0080'}
            stroke="#ffffff"
            strokeWidth="0.2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            transition={{ delay: index * 0.05 }}
          />
        ))}
      </svg>
    )
  }, [shotMap, width, height])

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {pitchSvg}
      {heatmapOverlay}
      {passNetworkOverlay}
      {shotMapOverlay}

      {/* AI Insights Toggle Button */}
      <motion.button
        className="absolute top-4 right-4 bg-electric-lime text-midnight-black px-4 py-2 rounded-lg font-semibold shadow-lg hover:bg-electric-lime/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAIOverlay(true)}
      >
        🧠 AI Insights
      </motion.button>

      {/* AI Insights Overlay */}
      <AIInsightsOverlay
        matchId="current_match" // Would be passed as prop
        currentMinute={67} // Would be passed as prop
        isVisible={showAIOverlay}
        onAnnotationClick={setSelectedAnnotation}
      />
    </motion.div>
  )
}