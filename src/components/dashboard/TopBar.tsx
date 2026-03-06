// ============================================
// TopBar — Student team HUD header
// Displays team/civ name, epoch, timer, pause state,
// assigned role badge, resources, and population.
// ============================================

"use client";

import { RESOURCES, ROLES } from "@/lib/constants";
import {
  STEP_LABELS,
  getEpochProgress,
  type EpochStep,
} from "@/lib/game/epoch-machine";
import type { RoleName, ResourceType } from "@/types/database";

interface TopBarProps {
  teamName: string;
  civName: string | null;
  epoch: number;
  step: EpochStep;
  timerRemaining: number;
  isPaused: boolean;
  role: RoleName;
  resources: { type: ResourceType; amount: number }[];
  population: number;
  ciScore?: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TopBar({
  teamName,
  civName,
  epoch,
  step,
  timerRemaining,
  isPaused,
  role,
  resources,
  population,
  ciScore = 0,
}: TopBarProps) {
  const progress = getEpochProgress(step);
  const roleInfo = ROLES[role];

  return (
    <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900/90 backdrop-blur-sm px-4 py-2">
      {/* Left: Team + Civ name */}
      <div className="flex items-center gap-3">
        <div>
          <div className="text-sm font-bold text-white">
            {civName ?? teamName}
          </div>
          {civName && (
            <div className="text-xs text-gray-500">{teamName}</div>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-full bg-gray-800 px-2 py-0.5 text-xs">
          <span>{roleInfo.emoji}</span>
          <span className="text-gray-300">{roleInfo.label}</span>
        </div>
      </div>

      {/* Center: Epoch + Round + Timer */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-xs text-gray-500">Epoch</div>
          <div className="text-sm font-bold text-white">{epoch}</div>
        </div>

        <div className="text-center">
          <div className="text-xs text-gray-500">Phase</div>
          <div className="text-sm font-medium text-blue-400">
            {STEP_LABELS[step]}
          </div>
        </div>

        {timerRemaining > 0 && !isPaused && (
          <div
            className={`text-center rounded-lg px-3 py-1 ${
              timerRemaining < 60
                ? "bg-red-900/30 text-red-400"
                : "bg-gray-800 text-white"
            }`}
          >
            <div className="text-xs text-gray-500">Time</div>
            <div className="text-sm font-mono font-bold">
              {formatTime(timerRemaining)}
            </div>
          </div>
        )}

        {isPaused && (
          <div className="rounded-lg bg-yellow-900/30 px-3 py-1 text-center">
            <div className="text-xs text-yellow-400 font-bold animate-pulse">
              ⏸ PAUSED
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-24 h-1.5 rounded-full bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Right: Resources */}
      <div className="flex items-center gap-3">
        {resources.map((r) => {
          const info = RESOURCES[r.type];
          return (
            <div
              key={r.type}
              className="flex items-center gap-1 text-xs"
              title={info.label}
            >
              <span>{info.emoji}</span>
              <span style={{ color: info.color }} className="font-bold">
                {r.amount}
              </span>
            </div>
          );
        })}

        <div className="flex items-center gap-1 text-xs" title="Population">
          <span>👥</span>
          <span className="text-white font-bold">{population}</span>
        </div>

        {ciScore > 0 && (
          <div
            className="flex items-center gap-1 text-xs"
            title="Cultural Influence"
          >
            <span>🎭</span>
            <span className="text-purple-400 font-bold">{ciScore}</span>
          </div>
        )}
      </div>
    </div>
  );
}
