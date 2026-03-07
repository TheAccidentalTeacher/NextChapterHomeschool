// ============================================
// ResolveSequence — Epoch resolution animation
// Animated projector sequence that reveals each
// team's end-of-epoch results (resources gained,
// population changes, events) with dramatic timing.
// Fetches real snapshot data from game_events when
// available (cinematic/replay mode), falls back to
// mock data for live manual play.
// ============================================

"use client";

import { useState, useEffect, useRef } from "react";

interface ResolveSequenceProps {
  gameId: string;
  epoch: number;
  teams: { id: string; name: string; civilization_name: string | null }[];
  onComplete: () => void;
}

interface ResolveResult {
  team_name: string;
  production: number;
  reach: number;
  legacy: number;
  resilience: number;
  food: number;
  population: number;
  population_change: number;
  is_dark_age: boolean;
  events: string[];
}

interface SnapshotTeam {
  teamId: string;
  teamName: string;
  resources: Record<string, number>;
  resourcesBefore: Record<string, number>;
  population: number;
  populationChange: number;
  isDarkAge: boolean;
  events: string[];
}

export default function ResolveSequence({
  gameId,
  epoch,
  teams,
  onComplete,
}: ResolveSequenceProps) {
  const [phase, setPhase] = useState<"intro" | "processing" | "results" | "done">("intro");
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const [results, setResults] = useState<ResolveResult[]>([]);
  const dataLoadedRef = useRef(false);

  // Intro phase — show dramatic text for 3 seconds
  useEffect(() => {
    if (phase === "intro") {
      const timer = setTimeout(() => setPhase("processing"), 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Processing phase — fetch real data, then cycle through teams
  useEffect(() => {
    if (phase !== "processing") return;

    let cancelled = false;
    dataLoadedRef.current = false;

    async function loadSnapshot() {
      try {
        const res = await fetch(`/api/games/${gameId}/epoch/${epoch}/resolve-snapshot`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.teams && data.teams.length > 0) {
            const realResults: ResolveResult[] = (data.teams as SnapshotTeam[]).map((t) => ({
              team_name: t.teamName,
              production: t.resources.production ?? 0,
              reach: t.resources.reach ?? 0,
              legacy: t.resources.legacy ?? 0,
              resilience: t.resources.resilience ?? 0,
              food: t.resources.food ?? 0,
              population: t.population,
              population_change: t.populationChange,
              is_dark_age: t.isDarkAge,
              events: t.events,
            }));
            setResults(realResults);
            dataLoadedRef.current = true;
          }
        }
      } catch {
        // fall through to mock
      }

      if (!dataLoadedRef.current && !cancelled) {
        // Fall back to mock data
        const mockResults: ResolveResult[] = teams.map((t) => ({
          team_name: t.civilization_name ?? t.name,
          production: Math.floor(Math.random() * 15) + 5,
          reach: Math.floor(Math.random() * 12) + 3,
          legacy: Math.floor(Math.random() * 10) + 2,
          resilience: Math.floor(Math.random() * 8) + 2,
          food: Math.floor(Math.random() * 10) + 3,
          population: 5,
          population_change: Math.floor(Math.random() * 3) - 1,
          is_dark_age: false,
          events: [],
        }));
        setResults(mockResults);
      }
    }

    loadSnapshot();

    // Cycle through teams visually
    let idx = 0;
    const interval = setInterval(() => {
      if (cancelled) return;
      idx++;
      if (idx >= teams.length) {
        clearInterval(interval);
        setTimeout(() => { if (!cancelled) setPhase("results"); }, 1500);
      } else {
        setCurrentTeamIdx(idx);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [phase, gameId, epoch, teams]);

  // Results phase — show for 10 seconds then done
  useEffect(() => {
    if (phase === "results") {
      const timer = setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  if (phase === "intro") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950">
        <div className="text-center">
          <div className="mb-6 text-6xl animate-pulse">⚡</div>
          <h1 className="text-5xl font-bold text-amber-400">
            RESOLVE
          </h1>
          <p className="mt-4 text-xl text-stone-400">
            The world turns. Decisions take shape.
          </p>
          <p className="mt-2 text-sm text-stone-600">Epoch {epoch}</p>
        </div>
      </div>
    );
  }

  if (phase === "processing") {
    const team = teams[currentTeamIdx];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950">
        <div className="text-center">
          <div className="mb-4 text-4xl">🎲</div>
          <h2 className="text-3xl font-bold text-stone-200">
            {team?.civilization_name ?? team?.name ?? "..."}
          </h2>
          <p className="mt-2 text-lg text-stone-500">Calculating yields…</p>
          <div className="mt-6 flex justify-center gap-2">
            {teams.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-8 rounded-full transition-all ${
                  idx <= currentTeamIdx ? "bg-amber-500" : "bg-stone-800"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-stone-950 p-8">
        <h2 className="mb-2 text-center text-3xl font-bold text-amber-400">
          ⚡ Epoch {epoch} Results
        </h2>
        <p className="mb-6 text-center text-sm text-stone-600">End-of-epoch state</p>
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((r, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 ${
                r.is_dark_age
                  ? "border-red-900 bg-red-950/30"
                  : "border-stone-800 bg-stone-900/50"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-stone-200">{r.team_name}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-stone-400">👥 {r.population}</span>
                  {r.population_change !== 0 && (
                    <span className={r.population_change > 0 ? "text-green-400" : "text-red-400"}>
                      {r.population_change > 0 ? "▲" : "▼"}
                    </span>
                  )}
                  {r.is_dark_age && (
                    <span className="rounded bg-red-900/50 px-1.5 py-0.5 text-xs text-red-400">
                      DARK AGE
                    </span>
                  )}
                </div>
              </div>
              <div className="mb-3 grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="text-stone-500">⚙️</p>
                  <p className="text-base font-bold text-amber-400">{r.production}</p>
                </div>
                <div>
                  <p className="text-stone-500">🧭</p>
                  <p className="text-base font-bold text-blue-400">{r.reach}</p>
                </div>
                <div>
                  <p className="text-stone-500">📜</p>
                  <p className="text-base font-bold text-purple-400">{r.legacy}</p>
                </div>
                <div>
                  <p className="text-stone-500">🛡️</p>
                  <p className="text-base font-bold text-green-400">{r.resilience}</p>
                </div>
              </div>
              {r.events.length > 0 && (
                <ul className="space-y-0.5">
                  {r.events.slice(0, 3).map((e, i) => (
                    <li key={i} className="truncate text-xs text-stone-500">{e}</li>
                  ))}
                  {r.events.length > 3 && (
                    <li className="text-xs text-stone-600">+{r.events.length - 3} more…</li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
