export default function ProjectorPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-stone-800 px-6 py-3">
        <h1 className="text-xl font-bold text-amber-400">
          ClassCiv — Projector
        </h1>
        <div className="flex items-center gap-4 text-sm text-stone-400">
          <span>Epoch 1</span>
          <span className="rounded bg-stone-800 px-2 py-0.5 text-xs">
            EXPAND
          </span>
        </div>
      </header>

      {/* Main projector area — full screen map + overlays */}
      <main className="relative flex-1">
        {/* Map placeholder */}
        <div className="flex h-full items-center justify-center text-stone-600">
          <div className="text-center">
            <p className="text-4xl">🗺️</p>
            <p className="mt-2 text-lg">World Map</p>
            <p className="text-sm text-stone-700">
              Leaflet map with sub-zone territories renders here
            </p>
          </div>
        </div>

        {/* Leaderboard overlay (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-4 border-t border-stone-800 bg-black/80 px-6 py-3 backdrop-blur">
          <span className="text-xs text-stone-500">LEADERBOARD</span>
          {/* Team cards will render here */}
          <div className="flex gap-3">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded border border-stone-800 bg-stone-900 px-3 py-1.5 text-xs"
              >
                <span className="font-bold text-amber-400">Team {i + 1}</span>
                <span className="text-stone-500">— pts</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
