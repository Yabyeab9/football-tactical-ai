"use client"

import PitchLines from "./PitchLines"

export default function FootballPitch({ children }) {

  return (

    <div className="bg-slate-900 rounded-xl p-4 shadow-2xl border border-slate-700">

      <svg
        viewBox="0 0 120 80"
        className="w-full h-[500px]"
      >

        <PitchLines />

        {children}
<defs>

  <marker
    id="arrow"
    viewBox="0 0 10 10"
    refX="10"
    refY="5"
    markerWidth="4"
    markerHeight="4"
    orient="auto-start-reverse"
  >

    <path d="M 0 0 L 10 5 L 0 10 z" fill="cyan" />

  </marker>

</defs>

      </svg>

    </div>

  )

}