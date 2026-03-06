export default function DmPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-red-400">
          DM Panel — Mr. Somers
        </h1>
        <p className="text-sm text-stone-400">
          Game Master controls for ClassCiv
        </p>
      </div>

      {/* Control Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Epoch Control */}
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h3 className="text-sm font-semibold text-stone-400">
            🎮 Epoch Control
          </h3>
          <p className="mt-2 text-xs text-stone-500">
            Advance epoch, change round, pause/resume game
          </p>
          <div className="mt-4 flex gap-2">
            <button className="rounded bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-700">
              Next Round →
            </button>
            <button className="rounded bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
              Next Epoch →→
            </button>
          </div>
        </div>

        {/* Submission Queue */}
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h3 className="text-sm font-semibold text-stone-400">
            📋 Submission Queue
          </h3>
          <p className="mt-2 text-xs text-stone-500">
            Review, score, and provide feedback on team submissions
          </p>
          <p className="mt-4 text-2xl font-bold text-stone-600">0 pending</p>
        </div>

        {/* d20 Event */}
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h3 className="text-sm font-semibold text-stone-400">
            🎲 d20 Event Roll
          </h3>
          <p className="mt-2 text-xs text-stone-500">
            Roll a random event for the current epoch
          </p>
          <button className="mt-4 rounded bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600">
            🎲 Roll d20
          </button>
        </div>

        {/* Team Overview */}
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h3 className="text-sm font-semibold text-stone-400">
            👥 Team Overview
          </h3>
          <p className="mt-2 text-xs text-stone-500">
            All teams, roles, resources, attendance
          </p>
        </div>

        {/* Math Gate */}
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h3 className="text-sm font-semibold text-stone-400">
            🧮 Math Gate
          </h3>
          <p className="mt-2 text-xs text-stone-500">
            Toggle math challenges on purchases/trades
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-4 w-8 rounded-full bg-stone-700" />
            <span className="text-xs text-stone-500">Disabled</span>
          </div>
        </div>

        {/* AI Narration */}
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h3 className="text-sm font-semibold text-stone-400">
            🤖 AI Narration
          </h3>
          <p className="mt-2 text-xs text-stone-500">
            Generate epoch recap, trigger RESOLVE narration
          </p>
        </div>
      </div>
    </div>
  );
}
