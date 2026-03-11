import DashboardLayout from "./DashboardLayout"

export default function Dashboard() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold mb-6">
        Football AI Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-6">

        <div className="bg-[#111827] p-6 rounded-xl">
          Match Timeline
        </div>

        <div className="bg-[#111827] p-6 rounded-xl">
          Tactical Pitch
        </div>

        <div className="bg-[#111827] p-6 rounded-xl">
          Player Radar
        </div>

        <div className="bg-[#111827] p-6 rounded-xl">
          Pass Network
        </div>

      </div>

    </DashboardLayout>
  )
}