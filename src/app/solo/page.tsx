"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FEATURES = [
  { emoji: "🏛️", title: "All 5 roles", desc: "Play Architect, Merchant, Diplomat, Lorekeeper, and Warlord — one per round" },
  { emoji: "🌍", title: "5 CPU rivals", desc: "Five civilizations compete against you, auto-resolving their decisions each epoch" },
  { emoji: "📝", title: "Real scoring", desc: "Your justifications are auto-scored 1–5 — longer, stronger reasoning earns more resources" },
  { emoji: "⚖️", title: "Full routing", desc: "After each round, choose how to allocate earned resources between Treasury, Growth, and Defense" },
  { emoji: "📊", title: "Live standings", desc: "See where your civilization ranks against AI rivals after every epoch" },
  { emoji: "🔄", title: "Epoch loop", desc: "Play as many epochs as you want — decisions compound over time just like a real game" },
];

export default function SoloLandingPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleStartGame() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/solo/create", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create game");
      router.push(`/solo/${data.gameId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm">
          ← Home
        </Link>
        <span className="text-gray-700">|</span>
        <span className="text-amber-400 font-bold">ClassCiv Solo Mode</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="text-6xl">🏛️</div>
          <h1 className="text-4xl font-bold text-amber-400">Solo Adventure Mode</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Lead <strong className="text-gray-200">The Ember Dominion</strong> through history — answer civilization questions,
            manage resources, and compete against 5 AI rivals across multiple epochs.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3">
              <span className="text-2xl shrink-0">{f.emoji}</span>
              <div>
                <div className="font-semibold text-gray-200 text-sm">{f.title}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Game flow summary */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">How Each Epoch Works</h2>
          <div className="space-y-2 text-sm">
            {[
              ["⚙️ BUILD Round", "Your Architect answers a construction/infrastructure question"],
              ["🧭 EXPAND Round", "Your Merchant answers a trade/territory question"],
              ["📜 DEFINE Round", "Your Diplomat answers a governance/culture question"],
              ["🛡️ DEFEND Round", "Your Warlord answers a military/security question"],
              ["⚖️  Routing", "After each round, allocate earned resources: Treasury • Growth • Defense"],
              ["🌐 Resolve", "CPU civilizations auto-resolve, bank decay applies, population updates, epoch advances"],
            ].map(([label, desc]) => (
              <div key={label as string} className="flex gap-3">
                <span className="w-40 shrink-0 font-medium text-gray-300">{label}</span>
                <span className="text-gray-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleStartGame}
            disabled={creating}
            className="px-10 py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-xl text-xl transition-all"
          >
            {creating ? "Creating your civilization…" : "Start New Solo Adventure →"}
          </button>
          <p className="text-gray-600 text-sm">
            No login required. New game creates instantly.
          </p>
        </div>
      </main>
    </div>
  );
}
