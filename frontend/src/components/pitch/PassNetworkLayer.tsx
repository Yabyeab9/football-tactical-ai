type Player = {
  id: number
  name: string
  x: number
  y: number
}

type Pass = {
  from: number
  to: number
  count: number
}

export default function PassNetworkLayer({
  players,
  passes
}: {
  players: Player[]
  passes: Pass[]
}) {

  return (

    <g>

      {/* PASS LINES */}
      {passes.map((pass, i) => {

        const fromPlayer = players.find(p => p.id === pass.from)
        const toPlayer = players.find(p => p.id === pass.to)

        if (!fromPlayer || !toPlayer) return null

        return (

          <line
            key={i}
            x1={fromPlayer.x}
            y1={fromPlayer.y}
            x2={toPlayer.x}
            y2={toPlayer.y}
            stroke="cyan"
            strokeWidth={pass.count * 0.2}
            opacity="0.6"
          />

        )

      })}

      {/* PLAYER NODES */}
      {players.map((player) => (

        <g key={player.id}>

          <circle
            cx={player.x}
            cy={player.y}
            r="2"
            fill="orange"
          />

          <text
            x={player.x}
            y={player.y - 3}
            fontSize="2.5"
            textAnchor="middle"
            fill="white"
          >
            {player.name}
          </text>

        </g>

      ))}

    </g>

  )

}