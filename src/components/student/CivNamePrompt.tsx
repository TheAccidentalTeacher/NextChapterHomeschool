"use client";

import { useState, useEffect } from "react";

/**
 * Shows a "Name Your Civilization" prompt if the student's team
 * doesn't have an approved name yet. Disappears once approved.
 */
export default function CivNamePrompt() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    "loading" | "no-team" | "pending" | "needs-name" | "approved"
  >("loading");
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [approvedName, setApprovedName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    // Find the student's team and game
    fetch("/api/me/team")
      .then((res) => {
        if (!res.ok) throw new Error("no team");
        return res.json();
      })
      .then((data) => {
        if (!data.team?.id || !data.team?.game_id) {
          setStatus("no-team");
          return;
        }
        setTeamId(data.team.id);
        setGameId(data.team.game_id);

        // Check civ name status
        return fetch(
          `/api/games/${data.team.game_id}/teams/${data.team.id}/name`
        ).then((res) => res.json());
      })
      .then((data) => {
        if (!data) return;
        if (data.approved_name) {
          setApprovedName(data.approved_name);
          setStatus("approved");
        } else if (data.pending_submission?.name) {
          setPendingName(data.pending_submission.name);
          setStatus("pending");
        } else {
          setStatus("needs-name");
        }
      })
      .catch(() => setStatus("no-team"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !teamId || !gameId) return;
    setSaving(true);

    try {
      const res = await fetch(
        `/api/games/${gameId}/teams/${teamId}/name`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        }
      );

      if (res.ok) {
        setPendingName(name.trim());
        setStatus("pending");
        setName("");
      }
    } finally {
      setSaving(false);
    }
  };

  // Don't render anything if irrelevant
  if (status === "loading" || status === "no-team" || status === "approved") {
    if (status === "approved" && approvedName) {
      return (
        <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 px-4 py-3">
          <p className="text-sm text-amber-400">
            🏛️ Your civilization: <strong>{approvedName}</strong>
          </p>
        </div>
      );
    }
    return null;
  }

  if (status === "pending") {
    return (
      <div className="rounded-xl border border-blue-800/50 bg-blue-950/20 px-4 py-3">
        <p className="text-sm text-blue-400">
          ⏳ &quot;{pendingName}&quot; is awaiting DM approval
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-700 bg-amber-950/30 p-4">
      <h3 className="text-sm font-semibold text-amber-400">
        🏛️ Name Your Civilization
      </h3>
      <p className="mt-1 text-xs text-stone-400">
        Choose a name for your civilization. Your DM will approve it.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. The Ember Republic"
          maxLength={40}
          className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
        >
          {saving ? "…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
