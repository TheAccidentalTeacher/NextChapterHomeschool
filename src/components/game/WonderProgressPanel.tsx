"use client";

// ============================================
// WonderProgressPanel — 4-track wonder progress bar
// Decision 37, 40: four resource tracks, visual balance
// ============================================

import {
  WONDERS,
  getWonder,
  getOverallProgress,
  canCompleteWonder,
  type WonderProgress,
  type WonderDefinition,
} from "@/lib/game/wonders";

interface WonderProgressPanelProps {
  /** Current wonder being built (null = no active wonder) */
  activeWonder: WonderProgress | null;
  /** All completed wonders for this team */
  completedWonders: string[];
  /** Callback to select a new wonder to build */
  onSelectWonder: (wonderId: string) => void;
  /** Callback to contribute resources to current wonder */
  onContribute: (resourceType: string, amount: number) => void;
  /** Available resources for contributions */
  resources: Record<string, number>;
  /** Whether the Great Pyramid bonus is active */
  hasGreatPyramid: boolean;
}

interface TrackBarProps {
  label: string;
  emoji: string;
  value: number;
  color: string;
}

function TrackBar({ label, emoji, value, color }: TrackBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const isLow = clamped < 50 && clamped > 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">
          {emoji} {label}
        </span>
        <span className={`font-mono ${isLow ? "text-amber-400" : "text-gray-500"}`}>
          {clamped}%
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            backgroundColor: color,
            opacity: clamped >= 50 ? 1 : 0.6,
          }}
        />
      </div>
      {isLow && (
        <div className="text-[9px] text-amber-500">
          ⚠️ Below 50% — must reach 50% in all tracks to complete
        </div>
      )}
    </div>
  );
}

export default function WonderProgressPanel({
  activeWonder,
  completedWonders,
  onSelectWonder,
  onContribute,
  resources,
  hasGreatPyramid,
}: WonderProgressPanelProps) {
  const availableWonders = WONDERS.filter(
    (w) => !completedWonders.includes(w.id)
  );

  // No active wonder — show wonder selection
  if (!activeWonder) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          🏛️ Wonder Selection
        </h2>
        <p className="text-sm text-gray-400">
          Choose a wonder to build. Each wonder requires contributions across
          all four resource tracks.
        </p>

        {/* Completed wonders */}
        {completedWonders.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-medium text-gray-500">
              Completed Wonders
            </h3>
            <div className="flex flex-wrap gap-2">
              {completedWonders.map((wId) => {
                const w = getWonder(wId);
                if (!w) return null;
                return (
                  <div
                    key={wId}
                    className="rounded-lg border border-green-700/30 bg-green-900/10 px-3 py-1.5 text-xs text-green-300"
                  >
                    {w.emoji} {w.name} ✅
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available wonders grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {availableWonders.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onSelectWonder(w.id)}
              className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-left hover:border-amber-600 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{w.emoji}</span>
                <span className="text-sm font-bold text-white">
                  {w.name}
                </span>
              </div>
              <div className="text-xs text-gray-400 mb-2">{w.description}</div>
              <div className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                ⭐ {w.completionBonus}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Active wonder — show 4-track progress
  const wonder = getWonder(activeWonder.wonderId);
  if (!wonder) return null;

  const overall = getOverallProgress(activeWonder);
  const canComplete = canCompleteWonder(activeWonder);

  const TRACKS: { key: string; label: string; emoji: string; color: string; value: number; resource: string }[] = [
    { key: "construction", label: "Construction", emoji: "⚙️", color: "#f59e0b", value: activeWonder.constructionTrack, resource: "production" },
    { key: "foundation", label: "Foundation", emoji: "🧭", color: "#3b82f6", value: activeWonder.foundationTrack, resource: "reach" },
    { key: "culture", label: "Culture", emoji: "📜", color: "#a855f7", value: activeWonder.cultureTrack, resource: "legacy" },
    { key: "fortification", label: "Fortification", emoji: "🛡️", color: "#22c55e", value: activeWonder.fortificationTrack, resource: "resilience" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        🏛️ Wonder — {wonder.emoji} {wonder.name}
      </h2>

      {/* Overall progress */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Overall Progress</span>
          <span className="text-lg font-bold text-amber-400">{overall}%</span>
        </div>
        <div className="h-4 w-full rounded-full bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700"
            style={{ width: `${overall}%` }}
          />
        </div>
      </div>

      {/* Bonus preview */}
      <div className="rounded-lg border border-amber-700/20 bg-amber-900/10 p-2 text-xs text-amber-300">
        ⭐ Completion bonus: {wonder.completionBonus}
      </div>

      {hasGreatPyramid && (
        <div className="rounded-lg border border-green-700/20 bg-green-900/10 p-2 text-xs text-green-300">
          🔺 Great Pyramid active — contributions count double!
        </div>
      )}

      {/* 4 Track Bars */}
      <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800/30 p-3">
        {TRACKS.map((track) => (
          <div key={track.key} className="space-y-1">
            <TrackBar
              label={track.label}
              emoji={track.emoji}
              value={track.value}
              color={track.color}
            />
            <div className="flex items-center justify-end gap-2">
              <span className="text-[10px] text-gray-600">
                {track.emoji} Available: {resources[track.resource] ?? 0}
              </span>
              {[5, 10, 25].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={(resources[track.resource] ?? 0) < amt}
                  onClick={() => onContribute(track.resource, amt)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                    (resources[track.resource] ?? 0) >= amt
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-800 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div
          className={`rounded-lg border p-2 text-xs ${
            activeWonder.milestones25
              ? "border-green-700 bg-green-900/20 text-green-300"
              : overall >= 25
              ? "border-amber-700 bg-amber-900/20 text-amber-300"
              : "border-gray-700 bg-gray-800/50 text-gray-500"
          }`}
        >
          25% {activeWonder.milestones25 ? "✅" : ""}
          <div className="text-[9px] mt-0.5">+1 yield bonus</div>
        </div>
        <div
          className={`rounded-lg border p-2 text-xs ${
            activeWonder.milestones50
              ? "border-green-700 bg-green-900/20 text-green-300"
              : overall >= 50
              ? "border-amber-700 bg-amber-900/20 text-amber-300"
              : "border-gray-700 bg-gray-800/50 text-gray-500"
          }`}
        >
          50% {activeWonder.milestones50 ? "✅" : ""}
          <div className="text-[9px] mt-0.5">d20 immunity (1×)</div>
        </div>
        <div
          className={`rounded-lg border p-2 text-xs ${
            activeWonder.milestones75
              ? "border-green-700 bg-green-900/20 text-green-300"
              : overall >= 75
              ? "border-amber-700 bg-amber-900/20 text-amber-300"
              : "border-gray-700 bg-gray-800/50 text-gray-500"
          }`}
        >
          75% {activeWonder.milestones75 ? "✅" : ""}
          <div className="text-[9px] mt-0.5">Half-cost round</div>
        </div>
      </div>

      {/* Completion */}
      {canComplete && (
        <div className="rounded-lg border border-green-600 bg-green-900/20 p-3 text-center">
          <div className="text-green-300 font-bold mb-1">
            ✨ Wonder Ready to Complete!
          </div>
          <div className="text-xs text-green-400">
            All 4 tracks at 100% — completion triggers at next RESOLVE
          </div>
        </div>
      )}

      {/* Historical note */}
      <div className="text-[10px] text-gray-600 italic mt-2">
        📖 {wonder.historicalNote}
      </div>
    </div>
  );
}
