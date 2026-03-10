export default function Topbar() {

  return (

    <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">

      <div>

        <input
          placeholder="Search player or team..."
          className="bg-slate-800 px-4 py-2 rounded"
        />

      </div>

      <div className="flex items-center gap-4">

        <button>⭐ Favorites</button>

        <button>🔔 Notifications</button>

        <button>👤 Profile</button>

      </div>

    </div>

  )

}