"use client";

// ============================================
// TechTree — Interactive visual tech tree
// Decision 62: 37 techs, 5 tiers, left-to-right
// Node-graph layout with prerequisite lines.
// ============================================

import { useMemo, useRef, useEffect, useState } from "react";
import {
  TECH_TREE,
  getTechsByTier,
  getTechStates,
  CATEGORY_COLORS,
  type TechState,
} from "@/lib/game/tech-tree";
import { canSelectResearch } from "@/lib/game/research-engine";
import TechNode from "./TechNode";

interface TechTreeProps {
  completedTechIds: string[];
  activeResearchId: string | null;
  legacyInvested: Record<string, number>; // techId → Legacy invested
  onSelectResearch: (techId: string) => void;
}

// Node positions — computed at layout time
interface NodePosition {
  techId: string;
  tier: number;
  x: number;
  y: number;
}

const TIER_LABELS = [
  "",
  "I — Dawn",
  "II — Growth",
  "III — Expansion",
  "IV — Mastery",
  "V — Apex",
];

const NODE_W = 144; // matches w-36
const NODE_H = 80;
const TIER_GAP = 200;
const NODE_GAP = 16;
const PAD_X = 40;
const PAD_Y = 60;

export default function TechTree({
  completedTechIds,
  activeResearchId,
  legacyInvested,
  onSelectResearch,
}: TechTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  // Compute tech states
  const techStates = useMemo(
    () => getTechStates(completedTechIds, activeResearchId, legacyInvested),
    [completedTechIds, activeResearchId, legacyInvested]
  );

  // Layout: tiers as columns, techs stacked vertically
  const { positions, totalWidth, totalHeight } = useMemo(() => {
    const pos: NodePosition[] = [];
    let maxH = 0;

    for (let tier = 1; tier <= 5; tier++) {
      const techs = getTechsByTier(tier);
      const colX = PAD_X + (tier - 1) * (NODE_W + TIER_GAP);
      const colHeight = techs.length * NODE_H + (techs.length - 1) * NODE_GAP;
      if (colHeight > maxH) maxH = colHeight;

      techs.forEach((tech, idx) => {
        pos.push({
          techId: tech.id,
          tier,
          x: colX,
          y: PAD_Y + idx * (NODE_H + NODE_GAP),
        });
      });
    }

    return {
      positions: pos,
      totalWidth: PAD_X * 2 + 5 * NODE_W + 4 * TIER_GAP,
      totalHeight: PAD_Y * 2 + maxH,
    };
  }, []);

  // Prerequisite lines (SVG paths)
  const lines = useMemo(() => {
    const result: {
      from: NodePosition;
      to: NodePosition;
      state: "locked" | "available" | "completed";
    }[] = [];

    for (const tech of TECH_TREE) {
      const toPos = positions.find((p) => p.techId === tech.id);
      if (!toPos) continue;

      for (const prereqId of tech.prerequisites) {
        const fromPos = positions.find((p) => p.techId === prereqId);
        if (!fromPos) continue;

        const fromCompleted = completedTechIds.includes(prereqId);
        const toState = techStates[tech.id] ?? "locked";

        result.push({
          from: fromPos,
          to: toPos,
          state: toState === "completed"
            ? "completed"
            : fromCompleted && (toState === "available" || toState === "in_progress")
            ? "available"
            : "locked",
        });
      }
    }

    return result;
  }, [positions, completedTechIds, techStates]);

  const handleNodeClick = (techId: string) => {
    const state = techStates[techId];
    if (state === "available") {
      setSelectedTech(techId);
    } else if (state === "in_progress" || state === "completed") {
      setSelectedTech(techId === selectedTech ? null : techId);
    }
  };

  const handleConfirmResearch = () => {
    if (!selectedTech) return;
    const check = canSelectResearch(selectedTech, completedTechIds, activeResearchId);
    if (check.allowed) {
      onSelectResearch(selectedTech);
      setSelectedTech(null);
    }
  };

  const selectedTechDef = selectedTech
    ? TECH_TREE.find((t) => t.id === selectedTech)
    : null;
  const selectedState = selectedTech ? techStates[selectedTech] : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          🔬 Tech Tree
        </h2>
        <div className="flex items-center gap-3 text-xs">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-gray-400 capitalize">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Research Banner */}
      {activeResearchId && (
        <div className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-2 text-sm flex items-center justify-between">
          <div className="text-amber-300">
            🔬 Researching:{" "}
            <span className="font-bold">
              {TECH_TREE.find((t) => t.id === activeResearchId)?.emoji}{" "}
              {TECH_TREE.find((t) => t.id === activeResearchId)?.name}
            </span>
          </div>
          <div className="text-xs text-amber-400">
            {legacyInvested[activeResearchId] ?? 0} /{" "}
            {TECH_TREE.find((t) => t.id === activeResearchId)?.legacyCost ?? "?"} Legacy
          </div>
        </div>
      )}

      {/* Scrollable Tree */}
      <div
        ref={containerRef}
        className="overflow-auto rounded-xl border border-gray-700 bg-gray-900/50"
        style={{ maxHeight: "65vh" }}
      >
        <div
          className="relative"
          style={{ width: totalWidth, height: totalHeight, minWidth: totalWidth }}
        >
          {/* SVG prerequisite lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={totalWidth}
            height={totalHeight}
          >
            {lines.map((line, i) => {
              const x1 = line.from.x + NODE_W;
              const y1 = line.from.y + NODE_H / 2;
              const x2 = line.to.x;
              const y2 = line.to.y + NODE_H / 2;
              const cx = (x1 + x2) / 2;

              const strokeColor =
                line.state === "completed"
                  ? "#22c55e"
                  : line.state === "available"
                  ? "#3b82f6"
                  : "#374151";

              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={line.state === "locked" ? 1 : 2}
                  strokeDasharray={line.state === "locked" ? "4 4" : undefined}
                  opacity={line.state === "locked" ? 0.3 : 0.8}
                />
              );
            })}
          </svg>

          {/* Tier labels */}
          {[1, 2, 3, 4, 5].map((tier) => {
            const x = PAD_X + (tier - 1) * (NODE_W + TIER_GAP) + NODE_W / 2;
            return (
              <div
                key={tier}
                className="absolute text-xs font-bold text-gray-600 text-center"
                style={{
                  left: x - 60,
                  top: 10,
                  width: 120,
                }}
              >
                Tier {TIER_LABELS[tier]}
              </div>
            );
          })}

          {/* Tech nodes */}
          {positions.map((pos) => {
            const tech = TECH_TREE.find((t) => t.id === pos.techId);
            if (!tech) return null;
            return (
              <div
                key={pos.techId}
                className="absolute"
                style={{ left: pos.x, top: pos.y }}
              >
                <TechNode
                  tech={tech}
                  state={techStates[pos.techId] ?? "locked"}
                  legacyInvested={legacyInvested[pos.techId] ?? 0}
                  onClick={handleNodeClick}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Selection Panel */}
      {selectedTechDef && (
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedTechDef.emoji}</span>
            <div>
              <div className="font-bold text-white">{selectedTechDef.name}</div>
              <div className="text-xs text-gray-400">
                Tier {selectedTechDef.tier} — 📜 {selectedTechDef.legacyCost} Legacy
              </div>
            </div>
            <div
              className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: CATEGORY_COLORS[selectedTechDef.category] + "20",
                color: CATEGORY_COLORS[selectedTechDef.category],
                border: `1px solid ${CATEGORY_COLORS[selectedTechDef.category]}40`,
              }}
            >
              {selectedTechDef.category}
            </div>
          </div>

          <div className="text-sm text-gray-300 italic">
            &quot;{selectedTechDef.curriculumHook}&quot;
          </div>

          {selectedTechDef.unlocks.length > 0 && (
            <div className="text-xs text-gray-400">
              <span className="text-gray-500 font-medium">Unlocks: </span>
              {selectedTechDef.unlocks.join(" • ")}
            </div>
          )}

          {selectedTechDef.prerequisites.length > 0 && (
            <div className="text-xs text-gray-400">
              <span className="text-gray-500 font-medium">Requires: </span>
              {selectedTechDef.prerequisites
                .map((id) => TECH_TREE.find((t) => t.id === id)?.name ?? id)
                .join(", ")}
            </div>
          )}

          {/* Progress bar for in-progress */}
          {selectedState === "in_progress" && (
            <div>
              <div className="h-2 w-full rounded-full bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round(((legacyInvested[selectedTechDef.id] ?? 0) / selectedTechDef.legacyCost) * 100))}%`,
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {legacyInvested[selectedTechDef.id] ?? 0} / {selectedTechDef.legacyCost} Legacy invested
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {selectedState === "available" && !activeResearchId && (
              <button
                type="button"
                onClick={handleConfirmResearch}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
              >
                🔬 Begin Research
              </button>
            )}
            {selectedState === "available" && activeResearchId && (
              <div className="text-xs text-amber-400">
                ⚠️ Already researching another tech this epoch
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectedTech(null)}
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
