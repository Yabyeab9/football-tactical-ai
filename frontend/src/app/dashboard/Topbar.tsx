export default function Topbar() {
  return (
    <div className="flex items-center justify-between px-6 h-16 bg-[#111827] border-b border-gray-700">

      <input
        placeholder="Search players or teams..."
        className="bg-[#1f2937] px-4 py-2 rounded-lg w-80"
      />

      <div className="flex items-center gap-6">

        <button>⭐ Favorites</button>

        <button>🔔 Notifications</button>

        <button>👤 Profile</button>

      </div>

    </div>
  )
}