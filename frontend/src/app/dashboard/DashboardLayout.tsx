import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function DashboardLayout({ children }: any) {
  return (
    <div className="flex h-screen bg-[#0b1120] text-white">

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1">

        <Topbar />

        <main className="p-6 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  )
}