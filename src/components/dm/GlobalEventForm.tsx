"use client";

import { useState } from "react";

interface GlobalEventFormProps {
  gameId: string;
  epoch: number;
}

const PRESET_EVENTS = [
  { label: "🌊 Flood", description: "River flooding damages farms along the coast" },
  { label: "🦠 Plague", description: "Disease spreads through densely populated zones" },
  { label: "💰 Gold Rush", description: "Gold discovered! +3 production to the first team to expand" },
  { label: "🌾 Bountiful Harvest", description: "Rains bless the fields. All farms produce double this epoch" },
  { label: "☄️ Meteor Sighting", description: "A comet appears. Cultural significance — +5 Legacy to all" },
  { label: "🏴‍☠️ Pirate Raid", description: "Coastal zones lose 2 Reach each" },
];

export default function GlobalEventForm({ gameId, epoch }: GlobalEventFormProps) {
  const [eventText, setEventText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!eventText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/games/${gameId}/events/global`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: eventText.trim(),
          event_type: "dm_global",
          epoch,
        }),
      });
      if (res.ok) {
        setSent(true);
        setEventText("");
        setTimeout(() => setSent(false), 3000);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-800 bg-stone-900/50 p-4">
      <h3 className="text-sm font-semibold text-stone-300">🌍 Global Event</h3>
      <p className="text-xs text-stone-500">
        Broadcast an event to all teams and the projector.
      </p>

      {/* Preset quick buttons */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_EVENTS.map((evt) => (
          <button
            key={evt.label}
            onClick={() => setEventText(evt.description)}
            className="rounded border border-stone-700 bg-stone-800 px-2 py-0.5 text-xs text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
          >
            {evt.label}
          </button>
        ))}
      </div>

      <textarea
        value={eventText}
        onChange={(e) => setEventText(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-red-500 focus:outline-none"
        placeholder="Describe the world event..."
      />

      <div className="flex items-center justify-between">
        {sent && <span className="text-xs text-green-400">✓ Broadcasted!</span>}
        <button
          onClick={handleSend}
          disabled={sending || !eventText.trim()}
          className="ml-auto rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
        >
          {sending ? "Sending…" : "🔊 Broadcast Event"}
        </button>
      </div>
    </div>
  );
}
