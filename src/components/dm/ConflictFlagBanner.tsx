// ============================================
// ConflictFlagBanner — DM conflict resolution UI
// Displays active conflict flags (aggressor vs.
// defender) for the DM to review, resolve, or dismiss.
// Decision 65: War exhaustion + conflict system.
// ============================================

"use client";

import { useState, useEffect } from "react";

interface ConflictFlag {
  id: string;
  aggressor_team_id: string;
  aggressor_name: string;
  defender_team_id: string;
  defender_name: string;
  conflict_type: string;
  justification: string | null;
  outcome: string | null;
  resolved_at: string | null;
}

interface ConflictFlagBannerProps {
  gameId: string;
  epoch: number;
}

export default function ConflictFlagBanner({ gameId, epoch }: ConflictFlagBannerProps) {
  const [conflicts, setConflicts] = useState<ConflictFlag[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/games/${gameId}/conflicts/resolve?epoch=${epoch}`
        );
        if (res.ok) {
          const data = await res.json();
          setConflicts(data.conflicts ?? []);
        }
      } catch {
        // ignore
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [gameId, epoch]);

  const unresolved = conflicts.filter((c) => !c.resolved_at);

  if (unresolved.length === 0) return null;

  async function handleResolve(conflictId: string) {
    if (!outcome.trim()) return;
    try {
      await fetch(`/api/games/${gameId}/conflicts/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conflict_id: conflictId,
          outcome: outcome.trim(),
        }),
      });
      setConflicts((prev) =>
        prev.map((c) =>
          c.id === conflictId
            ? { ...c, outcome: outcome.trim(), resolved_at: new Date().toISOString() }
            : c
        )
      );
      setResolvingId(null);
      setOutcome("");
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-2">
      {unresolved.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-400">⚔️</span>
              <span className="font-medium text-stone-200">
                {c.aggressor_name} → {c.defender_name}
              </span>
              <span className="rounded bg-red-800/40 px-1.5 py-0.5 text-xs text-red-400">
                {c.conflict_type}
              </span>
            </div>

            {resolvingId !== c.id ? (
              <button
                onClick={() => setResolvingId(c.id)}
                className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-500"
              >
                Resolve
              </button>
            ) : null}
          </div>

          {c.justification && (
            <p className="mt-1 text-xs text-stone-400">
              Justification: &quot;{c.justification}&quot;
            </p>
          )}

          {resolvingId === c.id && (
            <div className="mt-3 space-y-2">
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-red-800 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-red-500 focus:outline-none"
                placeholder="Describe the outcome…"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleResolve(c.id)}
                  className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
                >
                  Confirm Resolution
                </button>
                <button
                  onClick={() => {
                    setResolvingId(null);
                    setOutcome("");
                  }}
                  className="text-xs text-stone-500 hover:text-stone-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
