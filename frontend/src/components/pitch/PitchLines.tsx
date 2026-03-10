export default function PitchLines() {

  return (

    <g stroke="white" strokeWidth="0.5" fill="none">

      {/* Pitch Border */}
      <rect x="0" y="0" width="120" height="80" />

      {/* Halfway Line */}
      <line x1="60" y1="0" x2="60" y2="80" />

      {/* Center Circle */}
      <circle cx="60" cy="40" r="10" />

      {/* Left Penalty Box */}
      <rect x="0" y="18" width="18" height="44" />

      {/* Right Penalty Box */}
      <rect x="102" y="18" width="18" height="44" />

      {/* Left 6-yard */}
      <rect x="0" y="30" width="6" height="20" />

      {/* Right 6-yard */}
      <rect x="114" y="30" width="6" height="20" />

      {/* Penalty Spots */}
      <circle cx="12" cy="40" r="0.8" fill="white" />
      <circle cx="108" cy="40" r="0.8" fill="white" />

    </g>

  )

}