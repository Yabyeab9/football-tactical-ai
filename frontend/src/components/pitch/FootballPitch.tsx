import PitchLines from "./PitchLines"
import PitchPlayer from "./PitchPlayer"
import PassNetworkLayer from "./PassNetworkLayer"
import HeatmapLayer from "./HeatmapLayer"
import ShotLayer from "./ShotLayer"
import SequenceLayer from "./SequenceLayer"

export default function FootballPitch() {

  const players = [
    { id: 1, x: 30, y: 40 },
    { id: 2, x: 50, y: 30 },
    { id: 3, x: 70, y: 60 },
  ]

  return (

    <div className="relative w-full h-[500px] bg-green-700 rounded-xl overflow-hidden">

      <PitchLines />

      <HeatmapLayer />

      <PassNetworkLayer />

      <ShotLayer />

      <SequenceLayer />

      {players.map((p) => (
        <PitchPlayer key={p.id} x={p.x} y={p.y} />
      ))}

    </div>

  )
}