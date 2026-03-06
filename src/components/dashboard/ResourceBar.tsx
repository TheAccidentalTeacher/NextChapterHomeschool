"use client";

import { RESOURCES } from "@/lib/constants";
import type { ResourceType } from "@/types/database";

interface ResourceBarProps {
  resources: Record<ResourceType, number>;
  population: number;
  ciScore?: number;
  compact?: boolean;
}

export default function ResourceBar({
  resources,
  population,
  ciScore = 0,
  compact = false,
}: ResourceBarProps) {
  const resourceTypes: ResourceType[] = [
    "production",
    "reach",
    "legacy",
    "resilience",
    "food",
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        {resourceTypes.map((type) => (
          <span
            key={type}
            className="flex items-center gap-0.5"
            title={RESOURCES[type].label}
          >
            <span>{RESOURCES[type].emoji}</span>
            <span style={{ color: RESOURCES[type].color }} className="font-medium">
              {resources[type] ?? 0}
            </span>
          </span>
        ))}
        <span className="flex items-center gap-0.5" title="Population">
          <span>👥</span>
          <span className="font-medium text-stone-300">{population}</span>
        </span>
        {ciScore > 0 && (
          <span className="flex items-center gap-0.5" title="Cultural Influence">
            <span>🏛️</span>
            <span className="font-medium text-purple-400">{ciScore}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {resourceTypes.map((type) => (
        <div
          key={type}
          className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/50 px-3 py-2"
        >
          <span className="text-lg">{RESOURCES[type].emoji}</span>
          <div>
            <p className="text-xs text-stone-500">{RESOURCES[type].label}</p>
            <p
              className="text-lg font-bold"
              style={{ color: RESOURCES[type].color }}
            >
              {resources[type] ?? 0}
            </p>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/50 px-3 py-2">
        <span className="text-lg">👥</span>
        <div>
          <p className="text-xs text-stone-500">Population</p>
          <p className="text-lg font-bold text-stone-200">{population}</p>
        </div>
      </div>

      {ciScore > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-purple-800/30 bg-purple-900/20 px-3 py-2">
          <span className="text-lg">🏛️</span>
          <div>
            <p className="text-xs text-stone-500">Cultural Influence</p>
            <p className="text-lg font-bold text-purple-400">{ciScore}</p>
          </div>
        </div>
      )}
    </div>
  );
}
