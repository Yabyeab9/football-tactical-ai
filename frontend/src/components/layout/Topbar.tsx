export default function Topbar() {
  return (
    <div className="h-16 bg-slate-800 flex items-center justify-between px-6 text-white">

      <input
        className="bg-slate-700 p-2 rounded"
        placeholder="Search player or team..."
      />

      <div className="flex gap-4 items-center">

        🔔 Notifications

        👤 Profile

      </div>

    </div>
  )
}