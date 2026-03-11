import PlayerRadarComparison from "../../components/analytics/PlayerRadarComparison"

export default function Players() {

  return (

    <div className="bg-slate-900 p-8 rounded-xl">

      <h1 className="text-2xl mb-6">
        Player Comparison
      </h1>

      <PlayerRadarComparison data={radarData} />

    </div>

  )

}