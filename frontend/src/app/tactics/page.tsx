import FootballPitch from "../../components/pitch/FootballPitch"
import PitchPlayer from "../../components/pitch/PitchPlayer"
import ShotLayer from "../../components/pitch/ShotLayer"
import PassNetworkLayer from "../../components/pitch/PassNetworkLayer"
import HeatmapLayer from "../../components/pitch/HeatmapLayer"
import SequenceLayer from "../../components/pitch/SequenceLayer"
import MatchTimeline from "../../components/timeline/MatchTimeline"

const shots = [
  { x: 90, y: 40, xg: 0.2 },
  { x: 100, y: 35, xg: 0.5 }
]

const players = [
  { x: 40, y: 30, name: "CM" },
  { x: 70, y: 50, name: "RW" }
]

const passes = [
  { from: 0, to: 1, weight: 5 }
]

const cells = [
  { x: 80, y: 40, value: 0.3 },
  { x: 90, y: 35, value: 0.6 }
]

const sequence = [
  { x: 25, y: 40, player: "CB" },
  { x: 45, y: 42, player: "CM" },
  { x: 65, y: 30, player: "RW" },
  { x: 85, y: 38, player: "ST" },
  { x: 105, y: 40, player: "SHOT" }
]

const events = [
  { minute: 12, type: "shot", player: "LW" },
  { minute: 24, type: "goal", player: "ST" },
  { minute: 55, type: "shot", player: "RW" },
  { minute: 70, type: "sub", player: "CM" }
]

export default function TacticalLab() {
  return (
    <div className="space-y-12 p-6">

      {/* Tactical board */}
      <div>
        <h1 className="text-2xl font-bold mb-6">Tactical Lab</h1>
        <FootballPitch>
          <PitchPlayer x={40} y={30} color="red" />
          <PitchPlayer x={70} y={50} color="blue" />
        </FootballPitch>
      </div>

      {/* Shot Map */}
      <div>
        <h1 className="text-2xl font-bold mb-6">Shot Map Analysis</h1>
        <FootballPitch>
          <ShotLayer shots={shots} />
        </FootballPitch>
      </div>

      {/* Pass Network */}
      <div>
        <h1 className="text-2xl font-bold mb-6">Pass Network Analysis</h1>
        <FootballPitch>
          <PassNetworkLayer players={players} passes={passes} />
        </FootballPitch>
      </div>

      {/* xT Heatmap */}
      <div>
        <h1 className="text-2xl font-bold mb-6">Expected Threat Map</h1>
        <FootballPitch>
          <HeatmapLayer cells={cells} />
        </FootballPitch>
      </div>

      {/* Possession Sequence */}
      <div>
        <h1 className="text-2xl font-bold mb-6">Possession Sequence Animation</h1>
        <FootballPitch>
          <SequenceLayer events={sequence} />
        </FootballPitch>
      </div>

      {/* Match Timeline */}
      <MatchTimeline events={events} />

    </div>
  )
}