"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { debug } from "@/lib/debug";

interface GameSummary {
  id: string;
  name: string;
  teacher_id: string;
  current_epoch: number;
  current_round: string;
  epoch_phase: string;
  created_at: string;
}

export default function DmPage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSolo, setCreatingSolo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    debug.render("DM Overview page mounted");
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        debug.auth("DM games loaded", { count: (data.games ?? []).length });
        setGames(data.games ?? []);
      })
      .catch((err) => {
        debug.error("Failed to load DM games", err);
        setGames([]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleNewSolo() {
    setCreatingSolo(true);
    try {
      const res = await fetch("/api/solo/create", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create solo game");
      router.push(`/solo/${data.gameId}`);
    } catch {
      setCreatingSolo(false);
    }
  }

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
          {games.map((game) => {
            const isSolo = game.teacher_id === "solo_mode";
            return (
            <div
              key={game.id}
              className="rounded-xl border border-stone-800 bg-stone-900/50 p-5 transition hover:border-stone-600 hover:bg-stone-900"
            >
              <Link href={isSolo ? `/solo/${game.id}` : `/dm/game/${game.id}`} className="group block">
                <div className="flex items-center gap-2">
                  {isSolo && <span className="text-xs rounded-full bg-amber-900/50 text-amber-400 px-2 py-0.5 font-medium">Solo</span>}
                  <h2 className="text-lg font-semibold text-stone-200 group-hover:text-red-400">
                    {game.name}
                  </h2>
                </div>
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
              <div className="mt-3 flex gap-2">
                {isSolo ? (
                  <Link
                    href={`/solo/${game.id}`}
                    className="rounded-md bg-amber-700 px-3 py-1 text-xs font-medium text-white transition hover:bg-amber-600"
                  >
                    ▶ Play
                  </Link>
                ) : (
                  <Link
                    href={`/dm/game/${game.id}`}
                    className="rounded-md bg-stone-800 px-3 py-1 text-xs font-medium text-stone-300 transition hover:bg-stone-700"
                  >
                    Manage
                  </Link>
                )}
                <Link
                  href={`/replay?game_id=${game.id}`}
                  className="rounded-md bg-amber-900/50 px-3 py-1 text-xs font-medium text-amber-400 transition hover:bg-amber-900"
                  target="_blank"
                >
                  🎬 Replay
                </Link>
                {!isSolo && (
                  <Link
                    href={`/projector?game_id=${game.id}`}
                    className="rounded-md bg-blue-900/50 px-3 py-1 text-xs font-medium text-blue-400 transition hover:bg-blue-900"
                    target="_blank"
                  >
                    📺 Projector
                  </Link>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link
          href="/dm/setup"
          className="rounded-xl border border-stone-800 bg-stone-900/30 p-4 text-center transition hover:border-stone-600"
        >
          <span className="text-2xl">🎮</span>
          <p className="mt-1 text-sm font-medium text-stone-300">New Game</p>
        </Link>
        <button
          onClick={handleNewSolo}
          disabled={creatingSolo}
          className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-4 text-center transition hover:border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">🏛️</span>
          <p className="mt-1 text-sm font-medium text-amber-400">
            {creatingSolo ? "Creating…" : "New Solo Game"}
          </p>
        </button>
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
