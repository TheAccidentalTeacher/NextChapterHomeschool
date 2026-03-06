"use client";

import { TERRAIN } from "@/lib/constants";
import type { TerrainType } from "@/types/database";

interface RegionBonus {
  id: number;
  name: string;
  bonus_type: string;
  bonus_resource: string;
  color: string;
}

interface RegionBonusCardProps {
  region: RegionBonus;
  isSelected?: boolean;
  onClick?: () => void;
}

const BONUS_DISPLAY: Record<string, { emoji: string; label: string; description: string }> = {
  reach:      { emoji: "🧭", label: "Reach",      description: "Coastal/Frontier advantage — faster expansion and exploration" },
  production: { emoji: "⚙️", label: "Production", description: "Forest advantage — faster building and resource gathering" },
  food:       { emoji: "🌾", label: "Food",        description: "River valley advantage — natural food abundance" },
  legacy:     { emoji: "📜", label: "Legacy",      description: "Crossroads advantage — cultural exchange and knowledge" },
  resilience: { emoji: "🛡️", label: "Resilience",  description: "Mountain advantage — natural defense and hardiness" },
};

export default function RegionBonusCard({
  region,
  isSelected = false,
  onClick,
}: RegionBonusCardProps) {
  const bonus = BONUS_DISPLAY[region.bonus_resource] ?? {
    emoji: "🏳️",
    label: region.bonus_resource,
    description: "",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full rounded-xl border p-4 text-left transition-all
        ${
          isSelected
            ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
            : "border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800"
        }
      `}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: region.color }}
        />
        <h3 className="font-bold text-white text-sm">{region.name}</h3>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{bonus.emoji}</span>
        <span className="text-sm font-medium" style={{ color: region.color }}>
          +{bonus.label}
        </span>
      </div>

      <p className="text-xs text-gray-400">{bonus.description}</p>
    </button>
  );
}
