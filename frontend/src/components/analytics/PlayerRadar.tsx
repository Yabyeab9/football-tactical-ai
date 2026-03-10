"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip
} from "recharts"

export default function PlayerRadar({ data }: any) {

  return (

    <RadarChart width={400} height={300} data={data}>

      <PolarGrid />

      <PolarAngleAxis dataKey="metric" />

      <Radar
        name="Player"
        dataKey="value"
        stroke="#22c55e"
        fill="#22c55e"
        fillOpacity={0.6}
      />

      <Tooltip />

    </RadarChart>

  )

}