// ============================================
// PushToProjector — DM projector control
// Pushes a view (map, announcement, etc.) and
// optional message to the projector via Supabase
// Realtime broadcast.
// Decision 16: Shared classroom projector view.
// ============================================

"use client";

import { useState } from "react";

interface PushToProjectorProps {
  gameId: string;
}

export default function PushToProjector({ gameId }: PushToProjectorProps) {
  const [message, setMessage] = useState("");
  const [view, setView] = useState<string>("map");
  const [sending, setSending] = useState(false);

  async function handlePush() {
    setSending(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) return;

      // Direct Supabase upsert to projector_state
      const res = await fetch(`${supabaseUrl}/rest/v1/projector_state?game_id=eq.${gameId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          current_view: view,
          animation_queue: message.trim()
            ? [{ type: "announcement", text: message.trim(), ts: Date.now() }]
            : [],
          updated_at: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setMessage("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-800 bg-stone-900/50 p-4">
      <h3 className="text-sm font-semibold text-stone-300">📺 Projector</h3>

      <div className="flex gap-1.5">
        {(["map", "leaderboard", "event", "recap"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded px-2 py-0.5 text-xs transition ${
              view === v
                ? "bg-red-600 text-white"
                : "bg-stone-800 text-stone-400 hover:bg-stone-700"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-red-500 focus:outline-none"
        placeholder="Optional announcement text…"
      />

      <button
        onClick={handlePush}
        disabled={sending}
        className="w-full rounded-lg bg-red-600 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
      >
        {sending ? "Pushing…" : "Push to Projector"}
      </button>
    </div>
  );
}
