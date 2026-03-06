"use client";

import { useState, useEffect } from "react";

interface GlobalEvent {
  id: string;
  description: string;
  event_type: string;
  created_at: string;
}

interface GlobalEventModalProps {
  gameId: string;
  epoch: number;
}

export default function GlobalEventModal({ gameId, epoch }: GlobalEventModalProps) {
  const [event, setEvent] = useState<GlobalEvent | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/games/${gameId}/events/global?epoch=${epoch}`
        );
        if (res.ok) {
          const data = await res.json();
          const events: GlobalEvent[] = data.events ?? [];
          const newEvt = events.find((e) => !dismissed.has(e.id));
          if (newEvt) setEvent(newEvt);
        }
      } catch {
        // ignore
      }
    }
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, epoch]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-amber-700 bg-stone-900 p-6 shadow-2xl">
        <div className="mb-3 text-center">
          <span className="text-4xl">🌍</span>
          <h2 className="mt-2 text-lg font-bold text-amber-400">
            World Event
          </h2>
        </div>

        <div className="rounded-lg border border-amber-900 bg-stone-950 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-300">
            {event.description}
          </p>
        </div>

        <button
          onClick={() => {
            setDismissed((prev) => new Set(prev).add(event.id));
            setEvent(null);
          }}
          className="mt-4 w-full rounded-lg bg-amber-600 py-2 text-sm font-medium text-white transition hover:bg-amber-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
