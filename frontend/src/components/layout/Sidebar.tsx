import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col p-4">

      <h1 className="text-xl font-bold mb-8">
        ⚽ Football AI
      </h1>

      <nav className="flex flex-col gap-4">

        <Link to="/dashboard">Dashboard</Link>

        <Link to="/matches">Matches</Link>

        <Link to="/teams">Teams</Link>

        <Link to="/players">Players</Link>

        <Link to="/tactics">Tactical Lab</Link>

        <Link to="/scouting">Scouting</Link>

        <Link to="/ai-assistant">AI Assistant</Link>

      </nav>

    </div>
  );
}