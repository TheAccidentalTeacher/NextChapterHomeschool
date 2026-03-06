// ============================================
// ResolveSequence — Epoch resolution animation
// Animated projector sequence that reveals each
// team's end-of-epoch results (resources gained,
// population changes, events) with dramatic timing.
// ============================================

"use client";

import { useState, useEffect } from "react";

interface ResolveSequenceProps {
  gameId: string;
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
  population_change: number;
  events: string[];
}

export default function ResolveSequence({
  gameId,
  teams,
  onComplete,
}: ResolveSequenceProps) {
  const [phase, setPhase] = useState<"intro" | "processing" | "results" | "done">("intro");
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const [results, setResults] = useState<ResolveResult[]>([]);

  // Intro phase — show dramatic text for 3 seconds
  useEffect(() => {
    if (phase === "intro") {
      const timer = setTimeout(() => setPhase("processing"), 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Processing phase — cycle through teams
  useEffect(() => {
    if (phase === "processing") {
      // Generate mock results for display (real resolution happens server-side)
      const mockResults: ResolveResult[] = teams.map((t) => ({
        team_name: t.civilization_name ?? t.name,
        production: Math.floor(Math.random() * 15) + 5,
        reach: Math.floor(Math.random() * 12) + 3,
        legacy: Math.floor(Math.random() * 10) + 2,
        resilience: Math.floor(Math.random() * 8) + 2,
        food: Math.floor(Math.random() * 10) + 3,
        population_change: Math.floor(Math.random() * 5) - 1,
        events: [],
      }));
      setResults(mockResults);

      let idx = 0;
      const interval = setInterval(() => {
        idx++;
        if (idx >= teams.length) {
          clearInterval(interval);
          setTimeout(() => setPhase("results"), 1500);
        } else {
          setCurrentTeamIdx(idx);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [phase, teams]);

  // Results phase — show for 8 seconds then done
  useEffect(() => {
    if (phase === "results") {
      const timer = setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  if (phase === "intro") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950">
        <div className="text-center">
          <div className="mb-6 text-6xl animate-pulse">⚡</div>
          <h1 className="text-5xl font-bold text-amber-400 animate-fade-in">
            RESOLVE
          </h1>
          <p className="mt-4 text-xl text-stone-400">
            The world turns. Decisions take shape.
          </p>
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
        <h2 className="mb-6 text-center text-3xl font-bold text-amber-400">
          ⚡ Epoch Results
        </h2>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((r, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-stone-800 bg-stone-900/50 p-4"
            >
              <h3 className="mb-3 text-lg font-bold text-stone-200">
                {r.team_name}
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-stone-500">⚙️ Prod</p>
                  <p className="text-lg font-bold text-amber-400">+{r.production}</p>
                </div>
                <div>
                  <p className="text-stone-500">🧭 Reach</p>
                  <p className="text-lg font-bold text-blue-400">+{r.reach}</p>
                </div>
                <div>
                  <p className="text-stone-500">📜 Legacy</p>
                  <p className="text-lg font-bold text-purple-400">+{r.legacy}</p>
                </div>
                <div>
                  <p className="text-stone-500">🛡️ Resil</p>
                  <p className="text-lg font-bold text-green-400">+{r.resilience}</p>
                </div>
                <div>
                  <p className="text-stone-500">🌾 Food</p>
                  <p className="text-lg font-bold text-lime-400">+{r.food}</p>
                </div>
                <div>
                  <p className="text-stone-500">👥 Pop</p>
                  <p
                    className={`text-lg font-bold ${
                      r.population_change >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {r.population_change >= 0 ? "+" : ""}
                    {r.population_change}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
