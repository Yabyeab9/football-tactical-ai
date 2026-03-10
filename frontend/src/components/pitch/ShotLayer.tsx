type Shot = {
  x: number
  y: number
  xg: number
  result: "goal" | "miss" | "save"
}

export default function ShotLayer({ shots }: { shots: Shot[] }) {

  return (

    <g>

      {shots.map((shot, index) => (

        <circle
  cx={shot.x}
  cy={shot.y}
  r={shot.xg * 4}
  fill={shot.result === "goal" ? "lime" : "red"}
  opacity="0.7"
>
  <title>
    xG: {shot.xg} | Result: {shot.result}
  </title>
</circle>

      ))}

    </g>

  )

}