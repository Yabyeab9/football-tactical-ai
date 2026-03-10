"use client"

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Tooltip
} from "recharts"

export default function PlayerRadarComparison({ data }: any) {

  return (

    <RadarChart width={500} height={400} data={data}>

      <PolarGrid />

      <PolarAngleAxis dataKey="metric" />

      <Radar
        name="Player A"
        dataKey="A"
        stroke="#22c55e"
        fill="#22c55e"
        fillOpacity={0.5}
      />

      <Radar
        name="Player B"
        dataKey="B"
        stroke="#3b82f6"
        fill="#3b82f6"
        fillOpacity={0.5}
      />

      <Tooltip />

    </RadarChart>

  )

}