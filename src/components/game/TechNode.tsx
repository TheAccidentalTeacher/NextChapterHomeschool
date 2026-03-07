"use client";

// ============================================
// TechNode — Individual tech card in the tree
// Shows name, icon, cost, state, and progress.
// ============================================

import { type TechDefinition, CATEGORY_COLORS, type TechState } from "@/lib/game/tech-tree";

interface TechNodeProps {
  tech: TechDefinition;
  state: TechState;
  legacyInvested: number;
  onClick: (techId: string) => void;
}

const STATE_STYLES: Record<TechState, { border: string; bg: string; opacity: string }> = {
  locked: {
    border: "border-gray-800",
    bg: "bg-gray-900/50",
    opacity: "opacity-40",
  },
  available: {
    border: "border-blue-600",
    bg: "bg-gray-800/80",
    opacity: "opacity-100",
  },
  in_progress: {
    border: "border-amber-500",
    bg: "bg-amber-900/20",
    opacity: "opacity-100",
  },
  completed: {
    border: "border-green-600",
    bg: "bg-green-900/20",
    opacity: "opacity-100",
  },
};

export default function TechNode({
  tech,
  state,
  legacyInvested,
  onClick,
}: TechNodeProps) {
  const styles = STATE_STYLES[state];
  const categoryColor = CATEGORY_COLORS[tech.category] ?? "#666";
  const progress = state === "in_progress"
    ? Math.min(100, Math.round((legacyInvested / tech.legacyCost) * 100))
    : state === "completed"
    ? 100
    : 0;

  return (
    <button
      type="button"
      onClick={() => onClick(tech.id)}
      disabled={state === "locked"}
      className={`
        group relative rounded-lg border-2 p-2.5 text-left transition-all w-36
        ${styles.border} ${styles.bg} ${styles.opacity}
        ${state === "available" ? "hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer" : ""}
        ${state === "in_progress" ? "ring-1 ring-amber-500/30" : ""}
        ${state === "locked" ? "cursor-not-allowed" : ""}
      `}
    >
      {/* Category indicator */}
      <div
        className="absolute top-0 left-0 w-1.5 h-full rounded-l-lg"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Content */}
      <div className="pl-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-base">{tech.emoji}</span>
          <span className="text-xs font-bold text-white leading-tight line-clamp-1">
            {tech.name}
          </span>
        </div>

        {/* Cost */}
        <div className="text-[10px] text-gray-400">
          📜 {tech.legacyCost} Legacy
          <span className="text-gray-600 ml-1">T{tech.tier}</span>
        </div>

        {/* Progress bar (in progress or completed) */}
        {(state === "in_progress" || state === "completed") && (
          <div className="mt-1.5">
            <div className="h-1 w-full rounded-full bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  state === "completed" ? "bg-green-500" : "bg-amber-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">
              {state === "completed"
                ? "✅ Complete"
                : `${legacyInvested}/${tech.legacyCost}`}
            </div>
          </div>
        )}

        {/* State badge */}
        {state === "available" && (
          <div className="mt-1 text-[10px] text-blue-400 font-medium">
            ▶ Available
          </div>
        )}
        {state === "locked" && (
          <div className="mt-1 text-[10px] text-gray-600">
            🔒 Locked
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      <div
        className="
          invisible group-hover:visible absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
          w-56 rounded-lg border border-gray-600 bg-gray-900 p-3 shadow-xl text-xs
        "
      >
        <div className="font-bold text-white mb-1">
          {tech.emoji} {tech.name}
        </div>
        <div className="text-gray-400 mb-2 italic">
          {tech.curriculumHook}
        </div>
        {tech.unlocks.length > 0 && (
          <div className="text-gray-300">
            <span className="text-gray-500">Unlocks: </span>
            {tech.unlocks.join(", ")}
          </div>
        )}
        {tech.prerequisites.length > 0 && (
          <div className="text-gray-400 mt-1">
            <span className="text-gray-500">Requires: </span>
            {tech.prerequisites.join(", ")}
          </div>
        )}
      </div>
    </button>
  );
}
