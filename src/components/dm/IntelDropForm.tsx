"use client";

import { useState } from "react";

interface IntelDropFormProps {
  gameId: string;
  teams: { id: string; name: string; civilization_name: string | null }[];
}

export default function IntelDropForm({ gameId, teams }: IntelDropFormProps) {
  const [targetTeamId, setTargetTeamId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!targetTeamId || !message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/games/${gameId}/messages/private`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_team_id: targetTeamId,
          message: message.trim(),
        }),
      });
      if (res.ok) {
        setSent(true);
        setMessage("");
        setTimeout(() => setSent(false), 3000);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-800 bg-stone-900/50 p-4">
      <h3 className="text-sm font-semibold text-stone-300">📨 Intel Drop</h3>
      <p className="text-xs text-stone-500">
        Send a private message to a team. Only that team will see it.
      </p>

      <select
        value={targetTeamId}
        onChange={(e) => setTargetTeamId(e.target.value)}
        className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 focus:border-red-500 focus:outline-none"
      >
        <option value="">Choose a team…</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.civilization_name ?? team.name}
          </option>
        ))}
      </select>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-red-500 focus:outline-none"
        placeholder="Whispers of a gold deposit have reached your spies..."
      />

      <div className="flex items-center justify-between">
        {sent && <span className="text-xs text-green-400">✓ Sent!</span>}
        <button
          onClick={handleSend}
          disabled={sending || !targetTeamId || !message.trim()}
          className="ml-auto rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send Intel"}
        </button>
      </div>
    </div>
  );
}
