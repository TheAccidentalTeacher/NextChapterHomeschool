// ============================================
// DMControlBar — Epoch/Round control toolbar for the DM
// Decision 79: Step-by-step epoch state machine
//
// Provides buttons for the teacher to:
//   - Pause / Resume the game
//   - Advance to the next step in the epoch
//   - Advance to the next epoch (triggers resolution)
//   - Reset to login step
// Displays the current epoch number and step label.
// ============================================

"use client";

import { useState } from "react";
import { STEP_LABELS, type EpochStep } from "@/lib/game/epoch-machine";

interface DMControlBarProps {
  gameId: string;
  currentStep: EpochStep;
  currentEpoch: number;
  isPaused: boolean;
  onRefresh: () => void;
}

export default function DMControlBar({
  gameId,
  currentStep,
  currentEpoch,
  isPaused,
  onRefresh,
}: DMControlBarProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function doAction(action: string) {
    setLoading(action);
    try {
      const res = await fetch(`/api/games/${gameId}/epoch/advance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Action failed");
      }
      onRefresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-900/80 px-4 py-3">
      {/* Epoch + Step badge */}
      <div className="mr-2 flex items-center gap-2 text-sm">
        <span className="rounded bg-amber-600/20 px-2 py-0.5 text-amber-400">
          Epoch {currentEpoch}
        </span>
        <span className="rounded bg-stone-700 px-2 py-0.5 text-stone-300">
          {STEP_LABELS[currentStep] ?? currentStep}
        </span>
      </div>

      <div className="mx-2 h-6 w-px bg-stone-700" />

      {/* Pause / Resume */}
      <button
        onClick={() => doAction(isPaused ? "unpause" : "pause")}
        disabled={loading === "pause" || loading === "unpause"}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          isPaused
            ? "bg-green-600 text-white hover:bg-green-500"
            : "bg-yellow-600 text-white hover:bg-yellow-500"
        }`}
      >
        {isPaused ? "▶ Resume" : "⏸ Pause"}
      </button>

      {/* Advance */}
      <button
        onClick={() => doAction("next_step")}
        disabled={loading === "next_step"}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
      >
        Next Step →
      </button>

      {/* Resolve */}
      {currentStep === "resolve" && (
        <button
          onClick={() => doAction("resolve")}
          disabled={loading === "resolve"}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          ⚡ RESOLVE
        </button>
      )}

      {/* Next Epoch */}
      {currentStep === "exit" && (
        <button
          onClick={() => doAction("next_epoch")}
          disabled={loading === "next_epoch"}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
        >
          🔄 Next Epoch
        </button>
      )}

      <div className="mx-2 h-6 w-px bg-stone-700" />

      {/* Paused indicator */}
      {isPaused && (
        <span className="animate-pulse text-sm font-bold text-yellow-400">
          ⏸ PAUSED
        </span>
      )}
    </div>
  );
}
