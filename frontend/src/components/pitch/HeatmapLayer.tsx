type Cell = {
  x: number
  y: number
  value: number
}

export default function HeatmapLayer({ cells }: { cells: Cell[] }) {

  const getColor = (v: number) => {

    if (v > 0.8) return "#ff0000"
    if (v > 0.6) return "#ff6600"
    if (v > 0.4) return "#ffaa00"
    if (v > 0.2) return "#ffff00"

    return "#00ff00"
  }

  return (

    <g opacity="0.6">

      {cells.map((cell, i) => (

        <rect
          key={i}
          x={cell.x}
          y={cell.y}
          width="10"
          height="10"
          fill={getColor(cell.value)}
        />

      ))}

    </g>

  )

}