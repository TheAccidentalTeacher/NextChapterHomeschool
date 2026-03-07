"use client";

// ============================================
// KaijuFireButton — DM panel kaiju trigger
// Decision 34: Select kaiju → select target(s) → fire
// Broadcasts via Supabase Realtime
// ============================================

import { useState } from "react";
import { KAIJU, type KaijuDefinition } from "@/lib/game/kaiju";

interface Team {
  id: string;
  name: string;
}

interface KaijuFireButtonProps {
  teams: Team[];
  gameId: string;
  onFire: (kaijuId: string, targetTeamIds: string[]) => void;
}

export default function KaijuFireButton({
  teams,
  gameId,
  onFire,
}: KaijuFireButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKaiju, setSelectedKaiju] = useState<KaijuDefinition | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [firing, setFiring] = useState(false);

  function toggleTeam(teamId: string) {
    setSelectedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedTeams(new Set(teams.map((t) => t.id)));
  }

  function clearAll() {
    setSelectedTeams(new Set());
  }

  async function handleFire() {
    if (!selectedKaiju || selectedTeams.size === 0) return;
    setFiring(true);

    try {
      // Fire via API broadcast
      await fetch(`/api/games/${gameId}/kaiju`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kaijuId: selectedKaiju.id,
          targetTeamIds: Array.from(selectedTeams),
        }),
      });

      onFire(selectedKaiju.id, Array.from(selectedTeams));

      // Reset
      setSelectedKaiju(null);
      setSelectedTeams(new Set());
      setIsOpen(false);
    } catch (err) {
      console.error("Kaiju fire failed:", err);
    } finally {
      setFiring(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-red-900 px-4 py-2 text-sm font-bold text-red-100 hover:bg-red-800 transition-all border border-red-700 shadow-lg"
      >
        🦖 KAIJU
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-800 bg-gray-900 p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-red-400">🦖 Kaiju Attack</h3>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setSelectedKaiju(null);
            setSelectedTeams(new Set());
          }}
          className="text-gray-400 hover:text-white text-sm"
        >
          ✕ Close
        </button>
      </div>

      {/* Step 1: Select Kaiju */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
          Step 1 — Choose your monster
        </p>
        <div className="grid grid-cols-2 gap-2">
          {KAIJU.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setSelectedKaiju(k)}
              className={`rounded-lg border p-2 text-left text-sm transition-all ${
                selectedKaiju?.id === k.id
                  ? "border-red-500 bg-red-900/50 text-white"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500"
              }`}
            >
              <span className="text-lg mr-1">{k.emoji}</span>
              <span className="font-medium">{k.name}</span>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {k.animationStyle}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Targets */}
      {selectedKaiju && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Step 2 — Choose target(s)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                All
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                None
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => toggleTeam(team.id)}
                className={`rounded-md border px-3 py-1 text-sm transition-all ${
                  selectedTeams.has(team.id)
                    ? "border-red-500 bg-red-900/40 text-white"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"
                }`}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Fire */}
      {selectedKaiju && selectedTeams.size > 0 && (
        <button
          type="button"
          onClick={handleFire}
          disabled={firing}
          className="w-full rounded-lg bg-red-700 py-3 text-center font-black text-white uppercase tracking-widest hover:bg-red-600 disabled:opacity-50 transition-all shadow-lg animate-pulse"
        >
          {firing
            ? "UNLEASHING..."
            : `🔥 UNLEASH ${selectedKaiju.name.toUpperCase()} ON ${selectedTeams.size} TEAM${selectedTeams.size > 1 ? "S" : ""}`}
        </button>
      )}

      <p className="mt-2 text-center text-xs text-gray-600">
        100% cosmetic — zero game impact
      </p>
    </div>
  );
}
