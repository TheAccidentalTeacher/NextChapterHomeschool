"use client";

import { useState, useEffect, useCallback } from "react";
import RosterManager from "@/components/dm/RosterManager";
import type { RoleName } from "@/types/database";

interface GameOption {
  id: string;
  name: string;
}

interface TeamData {
  id: string;
  name: string;
  civilization_name: string | null;
  region_id: number;
  population: number;
  team_members?: {
    id: string;
    display_name: string;
    assigned_role: RoleName;
    is_absent: boolean;
  }[];
}

export default function RosterPage() {
  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load games list
  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        const gameList = data.games ?? [];
        setGames(gameList);
        if (gameList.length > 0 && !selectedGameId) {
          setSelectedGameId(gameList[0].id);
        }
      })
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load teams when game selection changes
  const loadTeams = useCallback(async () => {
    if (!selectedGameId) return;
    try {
      const res = await fetch(`/api/games/${selectedGameId}/teams`);
      const data = await res.json();
      setTeams(data.teams ?? []);
    } catch {
      setTeams([]);
    }
  }, [selectedGameId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-stone-500">Loading…</div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-red-400">Team Roster</h1>
        <div className="rounded-xl border border-dashed border-stone-700 p-12 text-center">
          <p className="text-stone-400">
            Create a game first before managing rosters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-red-400">Team Roster</h1>
          <p className="text-sm text-stone-400">
            Manage teams and assign students
          </p>
        </div>

        {/* Game Selector */}
        <select
          value={selectedGameId ?? ""}
          onChange={(e) => setSelectedGameId(e.target.value)}
          className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-300 focus:border-red-500 focus:outline-none"
        >
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {selectedGameId && (
        <RosterManager
          gameId={selectedGameId}
          teams={teams}
          onRefresh={loadTeams}
        />
      )}
    </div>
  );
}
