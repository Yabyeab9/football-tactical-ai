export default function PitchPlayer({ x, y }: any) {

  return (

    <div
      className="absolute w-4 h-4 bg-blue-500 rounded-full border border-white"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)"
      }}
    />

  )

}