// ============================================
// EventCardOverlay — Global event projector card
// Displays a global event as a stylized card
// with emoji icon based on event type, then
// auto-dismisses after the configured duration.
// ============================================

"use client";

import { useState, useEffect } from "react";

interface EventCardOverlayProps {
  event: {
    description: string;
    event_type: string;
  };
  onDismiss: () => void;
}

const EVENT_ICONS: Record<string, string> = {
  dm_global: "🌍",
  plague: "🦠",
  flood: "🌊",
  gold_rush: "💰",
  famine: "🍂",
  piracy: "🏴‍☠️",
  harvest: "🌾",
  meteor: "☄️",
  default: "⚡",
};

export default function EventCardOverlay({
  event,
  onDismiss,
}: EventCardOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 10000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  const icon = EVENT_ICONS[event.event_type] ?? EVENT_ICONS.default;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-8 max-w-xl rounded-2xl border border-amber-700 bg-stone-900 p-8 text-center shadow-2xl">
        <div className="mb-3 text-6xl">{icon}</div>
        <h2 className="mb-3 text-2xl font-bold text-amber-400">
          World Event
        </h2>
        <p className="text-lg leading-relaxed text-stone-300">
          {event.description}
        </p>
        <button
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="mt-6 rounded-lg bg-stone-800 px-6 py-2 text-sm text-stone-400 transition hover:bg-stone-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
