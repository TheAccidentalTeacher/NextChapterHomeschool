"use client";

import { useState, useEffect, useCallback } from "react";
import RosterManager from "@/components/dm/RosterManager";
import type { CoverAssignment } from "@/components/dm/RosterManager";
import type { RoleName } from "@/types/database";

const ROLE_ORDER = ["architect", "merchant", "diplomat", "lorekeeper", "warlord"];

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
    secondary_role?: RoleName | null;
    is_absent: boolean;
  }[];
}

export default function RosterPage() {
  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [rotateMsg, setRotateMsg] = useState<string | null>(null);
  const [autoingCovers, setAutoingCovers] = useState(false);
  const [covers, setCovers] = useState<CoverAssignment[]>([]);

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
      const [teamsRes, coversRes] = await Promise.all([
        fetch(`/api/games/${selectedGameId}/teams`),
        fetch(`/api/games/${selectedGameId}/covers`),
      ]);
      const teamsData = await teamsRes.json();
      const coversData = await coversRes.json();
      setTeams(teamsData.teams ?? []);
      setCovers(coversData.covers ?? []);
    } catch {
      setTeams([]);
      setCovers([]);
    }
  }, [selectedGameId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleRotateRoles = async () => {
    if (!selectedGameId) return;
    setRotating(true);
    setRotateMsg(null);
    try {
      const res = await fetch(`/api/games/${selectedGameId}/rotate-roles`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRotateMsg(`✓ ${data.rotated} roles rotated — ${ROLE_ORDER.join(" → ")} → …`);
      await loadTeams();
    } catch (err) {
      setRotateMsg(`✗ ${err instanceof Error ? err.message : "Error rotating roles"}`);
    } finally {
      setRotating(false);
      setTimeout(() => setRotateMsg(null), 5000);
    }
  };

  const handleAutoCovers = async () => {
    if (!selectedGameId) return;
    setAutoingCovers(true);
    try {
      const res = await fetch(`/api/games/${selectedGameId}/auto-covers`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRotateMsg(`✓ ${data.message}`);
      await loadTeams();
    } catch (err) {
      setRotateMsg(`✗ ${err instanceof Error ? err.message : "Error auto-covering"}`);
    } finally {
      setAutoingCovers(false);
      setTimeout(() => setRotateMsg(null), 5000);
    }
  };

  /** 🌅 New Epoch: rotate all roles, then auto-cover any absences */
  const handleNewEpoch = async () => {
    if (!selectedGameId) return;
    setRotating(true);
    setRotateMsg(null);
    try {
      const rotRes = await fetch(`/api/games/${selectedGameId}/rotate-roles`, { method: "POST" });
      const rotData = await rotRes.json();
      if (!rotRes.ok) throw new Error(rotData.error ?? "Rotate failed");

      const covRes = await fetch(`/api/games/${selectedGameId}/auto-covers`, { method: "POST" });
      const covData = await covRes.json();

      const coverNote = covData.assigned > 0 ? ` • ${covData.message}` : "";
      setRotateMsg(`✓ ${rotData.rotated} roles rotated${coverNote}`);
      await loadTeams();
    } catch (err) {
      setRotateMsg(`✗ ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setRotating(false);
      setTimeout(() => setRotateMsg(null), 6000);
    }
  };

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

        <div className="flex items-center gap-3">
          {selectedGameId && (
            <>
              {/* 🌅 New Epoch — rotate + auto-cover in one click */}
              <button
                onClick={handleNewEpoch}
                disabled={rotating || autoingCovers}
                className="rounded-lg border border-emerald-700 bg-emerald-950 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Rotate all roles forward one step, then auto-cover any absent students"
              >
                {rotating ? "Working…" : "🌅 New Epoch"}
              </button>

              {/* ⚡ Auto-Cover only — re-distribute absences without rotating */}
              <button
                onClick={handleAutoCovers}
                disabled={autoingCovers || rotating}
                className="rounded-lg border border-sky-700 bg-sky-950 px-3 py-2 text-sm font-medium text-sky-300 hover:bg-sky-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Re-distribute absent students' roles to present teammates (no rotation)"
              >
                {autoingCovers ? "Covering…" : "⚡ Auto-Cover Absences"}
              </button>

              {/* 🔄 Rotate only */}
              <button
                onClick={handleRotateRoles}
                disabled={rotating || autoingCovers}
                className="rounded-lg border border-amber-700 bg-amber-950 px-3 py-2 text-sm font-medium text-amber-300 hover:bg-amber-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Advance every student to their next role only (no auto-cover)"
              >
                {rotating ? "Rotating…" : "🔄 Rotate Roles"}
              </button>
            </>
          )}

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
      </div>

      {/* Rotation confirmation banner */}
      {rotateMsg && (
        <div className={`rounded-lg px-4 py-2 text-sm font-medium ${
          rotateMsg.startsWith("✓")
            ? "bg-green-950 border border-green-700 text-green-300"
            : "bg-red-950 border border-red-700 text-red-300"
        }`}>
          {rotateMsg}
        </div>
      )}

      {selectedGameId && (
        <RosterManager
          gameId={selectedGameId}
          teams={teams}
          covers={covers}
          onRefresh={loadTeams}
        />
      )}
    </div>
  );
}
