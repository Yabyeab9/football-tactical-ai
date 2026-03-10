"use client"

import { useState, useEffect } from "react"

type Event = {
  x: number
  y: number
  player: string
}

export default function SequenceLayer({ events }: { events: Event[] }) {

  const [step, setStep] = useState(0)

  useEffect(() => {

    const interval = setInterval(() => {

      setStep((s) => {
        if (s < events.length - 1) return s + 1
        return s
      })

    }, 1000)

    return () => clearInterval(interval)

  }, [])

  return (

    <g>

      {/* PASS LINES */}

      {events.slice(0, step).map((e, i) => {

        const next = events[i + 1]

        if (!next) return null

        return (

          <line
            key={i}
            x1={e.x}
            y1={e.y}
            x2={next.x}
            y2={next.y}
            stroke="cyan"
            strokeWidth="1"
            markerEnd="url(#arrow)"
          />

        )

      })}

      {/* PLAYER POSITIONS */}

      {events.slice(0, step + 1).map((e, i) => (

        <g key={i}>

          <circle
            cx={e.x}
            cy={e.y}
            r="2"
            fill="yellow"
          />

          <text
            x={e.x}
            y={e.y - 3}
            fontSize="2"
            textAnchor="middle"
            fill="white"
          >
            {e.player}
          </text>

        </g>

      ))}

    </g>

  )

}