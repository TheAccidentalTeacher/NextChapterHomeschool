// ============================================
// PausedOverlay — Projector pause screen
// Full-screen dark overlay with a pulsing
// "⏸ PAUSED" message when the DM pauses.
// ============================================

"use client";

interface PausedOverlayProps {
  message?: string;
}

export default function PausedOverlay({ message }: PausedOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center">
        <div className="mb-4 text-6xl animate-pulse">⏸</div>
        <h1 className="text-4xl font-bold text-yellow-400">PAUSED</h1>
        {message && (
          <p className="mt-3 text-lg text-stone-400">{message}</p>
        )}
        <p className="mt-6 text-sm text-stone-600">
          Waiting for the Dungeon Master…
        </p>
      </div>
    </div>
  );
}
