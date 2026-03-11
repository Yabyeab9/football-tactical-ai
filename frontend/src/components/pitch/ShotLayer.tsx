export default function ShotLayer() {

  const shots = [
    { x: 90, y: 40 },
    { x: 85, y: 50 }
  ]

  return (

    <>

      {shots.map((s, i) => (

        <div
          key={i}
          className="absolute w-3 h-3 bg-red-500 rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            transform: "translate(-50%, -50%)"
          }}
        />

      ))}

    </>

  )

}