import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-amber-400">
          Welcome, {user.firstName ?? "Explorer"}
        </h1>
        <p className="text-sm text-stone-400">
          Epoch 1 &middot; Round: EXPAND &middot; Your Role: —
        </p>
      </div>

      {/* Resource Bar (placeholder) */}
      <div className="flex gap-4 rounded-lg border border-stone-800 bg-stone-900 p-4">
        <div className="text-center">
          <p className="text-xl font-bold text-amber-400">0</p>
          <p className="text-xs text-stone-500">⚙️ Production</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-400">0</p>
          <p className="text-xs text-stone-500">🧭 Reach</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-purple-400">0</p>
          <p className="text-xs text-stone-500">📜 Legacy</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-400">0</p>
          <p className="text-xs text-stone-500">🛡️ Resilience</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-lime-400">0</p>
          <p className="text-xs text-stone-500">🌾 Food</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-stone-300">0</p>
          <p className="text-xs text-stone-500">👥 Population</p>
        </div>
      </div>

      {/* Placeholder panels */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h3 className="text-sm font-semibold text-stone-400">
            🗺️ Your Territory
          </h3>
          <p className="mt-2 text-xs text-stone-500">
            Map will render here — Leaflet sub-zone view
          </p>
        </div>
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h3 className="text-sm font-semibold text-stone-400">
            📝 Current Round
          </h3>
          <p className="mt-2 text-xs text-stone-500">
            Submission panel loads based on active round type
          </p>
        </div>
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h3 className="text-sm font-semibold text-stone-400">
            🔬 Tech Progress
          </h3>
          <p className="mt-2 text-xs text-stone-500">
            Tech tree visualization — current tier + available research
          </p>
        </div>
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-6">
          <h3 className="text-sm font-semibold text-stone-400">
            📖 Team Codex
          </h3>
          <p className="mt-2 text-xs text-stone-500">
            Civilization identity, mythology creatures, cultural artifacts
          </p>
        </div>
      </div>
    </div>
  );
}
