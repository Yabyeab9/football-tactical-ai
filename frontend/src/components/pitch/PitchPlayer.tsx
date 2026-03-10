export default function PitchPlayer({ x, y, color="red" }) {

  return (

    <circle
      cx={x}
      cy={y}
      r="1.5"
      fill={color}
      stroke="white"
      strokeWidth="0.2"
    />

  )

}