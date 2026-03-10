import Link from "next/link"

export default function Sidebar() {

  return (

    <div className="w-64 bg-slate-900 border-r border-slate-800 p-4">

      <h1 className="text-xl font-bold mb-8">
        Football Intelligence
      </h1>

      <nav className="space-y-4">

        <Link href="/dashboard">Dashboard</Link>

        <Link href="/tactics">Tactical Lab</Link>

        <Link href="/players">Player Analysis</Link>

        <Link href="/teams">Team Analysis</Link>

        <Link href="/scouting">Scouting AI</Link>

      </nav>

    </div>

  )

}