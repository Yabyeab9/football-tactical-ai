import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function Layout({ children }) {

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex flex-col flex-1">

        <Topbar />

        <main className="p-6 bg-slate-950 min-h-screen text-white">
          {children}
        </main>

      </div>

    </div>
  )
}