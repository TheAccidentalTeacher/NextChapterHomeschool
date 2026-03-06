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
