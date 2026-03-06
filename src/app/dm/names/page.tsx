"use client";

import { useState, useEffect, useCallback } from "react";

interface PendingName {
  team_id: string;
  team_name: string;
  submitted_name: string;
  submission_id: string;
}

interface GameOption {
  id: string;
  name: string;
}

export default function NameApprovalPage() {
  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [pendingNames, setPendingNames] = useState<PendingName[]>([]);
  const [loading, setLoading] = useState(true);

  // Load games
  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        const list = data.games ?? [];
        setGames(list);
        if (list.length > 0) setSelectedGameId(list[0].id);
      })
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, []);

  // Load pending names for selected game
  const loadPendingNames = useCallback(async () => {
    if (!selectedGameId) return;
    try {
      const res = await fetch(`/api/games/${selectedGameId}/names`);
      const data = await res.json();
      setPendingNames(data.pending ?? []);
    } catch {
      setPendingNames([]);
    }
  }, [selectedGameId]);

  useEffect(() => {
    loadPendingNames();
  }, [loadPendingNames]);

  const handleApproval = async (
    teamId: string,
    approved: boolean
  ) => {
    if (!selectedGameId) return;
    await fetch(
      `/api/games/${selectedGameId}/teams/${teamId}/name/approve`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      }
    );
    loadPendingNames();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-stone-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-red-400">
            Civ Name Approvals
          </h1>
          <p className="text-sm text-stone-400">
            Review and approve civilization names submitted by teams
          </p>
        </div>

        {games.length > 0 && (
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
        )}
      </div>

      {pendingNames.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-700 p-12 text-center">
          <p className="text-stone-500">
            No pending name submissions for this game.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingNames.map((pn) => (
            <div
              key={pn.team_id}
              className="flex items-center justify-between rounded-xl border border-amber-800/50 bg-amber-950/20 p-4"
            >
              <div>
                <p className="text-sm font-medium text-stone-300">
                  {pn.team_name}
                </p>
                <p className="text-lg font-semibold text-amber-400">
                  &ldquo;{pn.submitted_name}&rdquo;
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproval(pn.team_id, true)}
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleApproval(pn.team_id, false)}
                  className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
