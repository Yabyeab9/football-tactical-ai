import DashboardLayout from "@/components/dashboard/DashboardLayout"
import MatchTimeline from "@/components/timeline/MatchTimeline"

export default function Dashboard() {

  return (

    <DashboardLayout>

      <div className="grid grid-cols-2 gap-6">

        <div className="bg-slate-900 p-6 rounded-xl">
          Match Analytics
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          Player Radar
        </div>

        <div className="col-span-2">
          <MatchTimeline events={[]} />
        </div>

      </div>

    </DashboardLayout>

  )

}