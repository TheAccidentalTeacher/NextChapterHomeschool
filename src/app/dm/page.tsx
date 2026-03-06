"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GameSummary {
  id: string;
  name: string;
  current_epoch: number;
  current_round: string;
  epoch_phase: string;
  created_at: string;
}

export default function DmPage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => setGames(data.games ?? []))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-stone-500">Loading games…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-red-400">DM Overview</h1>
          <p className="text-sm text-stone-400">
            Manage your ClassCiv games
          </p>
        </div>
        <Link
          href="/dm/setup"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
        >
          + New Game
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-700 bg-stone-900/30 p-12 text-center">
          <p className="text-lg text-stone-400">No games yet</p>
          <p className="mt-1 text-sm text-stone-500">
            Create your first game to get started.
          </p>
          <Link
            href="/dm/setup"
            className="mt-4 inline-block rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-500"
          >
            Create Game
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/dm/game/${game.id}`}
              className="group rounded-xl border border-stone-800 bg-stone-900/50 p-5 transition hover:border-stone-600 hover:bg-stone-900"
            >
              <h2 className="text-lg font-semibold text-stone-200 group-hover:text-red-400">
                {game.name}
              </h2>
              <div className="mt-2 flex items-center gap-3 text-xs text-stone-500">
                <span>Epoch {game.current_epoch}</span>
                <span>·</span>
                <span>{game.current_round}</span>
                <span>·</span>
                <span className="capitalize">{game.epoch_phase}</span>
              </div>
              <p className="mt-3 text-xs text-stone-600">
                Created {new Date(game.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dm/setup"
          className="rounded-xl border border-stone-800 bg-stone-900/30 p-4 text-center transition hover:border-stone-600"
        >
          <span className="text-2xl">🎮</span>
          <p className="mt-1 text-sm font-medium text-stone-300">New Game</p>
        </Link>
        <Link
          href="/dm/roster"
          className="rounded-xl border border-stone-800 bg-stone-900/30 p-4 text-center transition hover:border-stone-600"
        >
          <span className="text-2xl">👥</span>
          <p className="mt-1 text-sm font-medium text-stone-300">
            Manage Roster
          </p>
        </Link>
        <Link
          href="/dm/draft"
          className="rounded-xl border border-stone-800 bg-stone-900/30 p-4 text-center transition hover:border-stone-600"
        >
          <span className="text-2xl">🗺️</span>
          <p className="mt-1 text-sm font-medium text-stone-300">Draft Day</p>
        </Link>
      </div>
    </div>
  );
}
