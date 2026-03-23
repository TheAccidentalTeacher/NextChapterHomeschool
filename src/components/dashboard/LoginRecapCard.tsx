// ============================================
// LoginRecapCard — Per-team recap on student login
// Fetches previous epoch summary from the API and
// displays what happened while the student was away.
// ============================================

"use client";

import { useState, useEffect } from "react";

interface LoginRecapCardProps {
  gameId: string;
  teamId: string;
  epoch: number;
}

export default function LoginRecapCard({ gameId, teamId, epoch }: LoginRecapCardProps) {
  const [recap, setRecap] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/games/${gameId}/recap/${teamId}`);
        if (res.ok) {
          const data = await res.json();
          setRecap(data.recap_text ?? "The world is new. Your story begins.");
        }
      } catch {
        setRecap("The world is new. Your story begins.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [gameId, teamId, epoch]);

  if (loading) {
    return (
      <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-6">
        <p className="text-center text-sm text-stone-500">Loading recap…</p>
      </div>
    );
  }

  if (epoch <= 1 && (!recap || recap === "The world is new. Your story begins.")) {
    return (
      <div className="rounded-xl border border-amber-800/30 bg-amber-900/10 p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <h3 className="text-sm font-semibold text-amber-400">
            The world is new. Your story begins.
          </h3>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-stone-300">
          <p>
            Your people have settled a new homeland. Around you, other civilizations are rising.
            The land is rich with possibility, but every choice matters: what to build, where to expand,
            who to trust, and what kind of legacy your people will leave behind.
          </p>
          <p>
            In this game, your team will answer historical-style questions, defend your choices,
            and guide your civilization through four kinds of decisions: build, expand, define, and defend.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-stone-400">
            <li>Read the question carefully.</li>
            <li>Discuss it with your team.</li>
            <li>Choose the best answer you can defend.</li>
            <li>Write a short reason why.</li>
          </ul>
          <p className="text-amber-200">
            Today is a practice run. Your goal is not perfection — your goal is to learn how your civilization works.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-800/30 bg-amber-900/10 p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">📜</span>
        <h3 className="text-sm font-semibold text-amber-400">
          Previously on your civilization…
        </h3>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-300">
        {recap}
      </p>
    </div>
  );
}
