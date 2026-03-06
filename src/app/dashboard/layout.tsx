export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — will hold role nav, resources, team info */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-stone-800 bg-stone-900 p-4 lg:block">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-amber-400">ClassCiv</h2>
          <p className="text-xs text-stone-500">Student Dashboard</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm text-stone-400">
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            🗺️ Map
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            📊 Resources
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            📝 Submit
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            🔬 Tech Tree
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            💰 Trade
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            📖 Codex
          </span>
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
