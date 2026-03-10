"use client"

import Link from "next/link"

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col p-4">

      <h1 className="text-xl font-bold mb-8">
        ⚽ Football AI
      </h1>

      <nav className="flex flex-col gap-4">

        <Link href="/dashboard">Dashboard</Link>

        <Link href="/matches">Matches</Link>

        <Link href="/teams">Teams</Link>

        <Link href="/players">Players</Link>

        <Link href="/tactics">Tactical Lab</Link>

        <Link href="/scouting">Scouting</Link>

        <Link href="/ai-assistant">AI Assistant</Link>

      </nav>

    </div>
  )
}