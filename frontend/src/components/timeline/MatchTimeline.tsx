"use client"

type Event = {
  minute: number
  type: "goal" | "shot" | "sub"
  player: string
}

export default function MatchTimeline({ events }: { events: Event[] }) {

  const getIcon = (type: string) => {

    if (type === "goal") return "⚽"
    if (type === "shot") return "🎯"
    if (type === "sub") return "🔁"

  }

  return (

    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">

      <h2 className="text-lg font-semibold mb-3">
        Match Timeline
      </h2>

      <div className="relative h-10 bg-slate-700 rounded">

        {events.map((e, i) => {

          const position = (e.minute / 90) * 100

          return (

            <div
              key={i}
              className="absolute -top-3 cursor-pointer"
              style={{ left: `${position}%` }}
              title={`${e.minute}' ${e.player}`}
            >

              <span className="text-xl">
                {getIcon(e.type)}
              </span>

            </div>

          )

        })}

      </div>

    </div>

  )

}