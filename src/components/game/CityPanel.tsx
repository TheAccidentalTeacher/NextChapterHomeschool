// ============================================
// CityPanel — Sub-zone detail management overlay
// Decision 99: Half-screen panel, role-specific
// Decision 103: Buildings live in specific sub-zones
//
// Opens when a student clicks any sub-zone on the map.
// Shows geographic context (terrain, real name, location),
// game state (soil fertility, wildlife, buildings),
// and role-appropriate action options.
//
// The geographic name and terrain ARE the geography lesson —
// students interact with real place names and understand
// WHY terrain affects their civilization's resources.
// ============================================

"use client";

import { TERRAIN } from "@/lib/constants";
import type { SubZoneData } from "@/components/map/GameMap";
import type { TerrainType, RoleName } from "@/types/database";

interface TeamInfo {
  id: string;
  name: string;
  color: string;
}

interface CityPanelProps {
  subZone: SubZoneData;
  teamId: string;
  regionId: number;          // player's own region
  role: RoleName;
  allTeams: TeamInfo[];
  gameId: string;
  epoch: number;
  onClose: () => void;
  onFoundtle?: () => void;    // placeholder for future founding flow
}

/** Visual status bar used for soil fertility and wildlife stock */
function ResourceBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 60 ? "#4ade80" : pct >= 30 ? "#facc15" : "#f87171";

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-stone-400">
          {icon} {label}
        </span>
        <span style={{ color }} className="font-mono font-semibold">
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** Building icon mapping */
const BUILDING_ICONS: Record<string, string> = {
  farm: "🌾",
  granary: "🏛️",
  barracks: "⚔️",
  market: "🏪",
  library: "📚",
  walls: "🧱",
  aqueduct: "💧",
};

const BUILDING_LABELS: Record<string, string> = {
  farm: "Farm",
  granary: "Granary",
  barracks: "Barracks",
  market: "Market",
  library: "Library",
  walls: "Walls",
  aqueduct: "Aqueduct",
};

/** Role-specific quick-info blurb shown at bottom of panel */
const ROLE_HINTS: Record<RoleName, { icon: string; text: string }> = {
  architect: {
    icon: "🏛",
    text: "As Architect, you decide what to build here. Farms grow food, Barracks train soldiers, Libraries unlock research.",
  },
  merchant: {
    icon: "🪙",
    text: "As Merchant, coastal and river zones offer trade route bonuses. Markets here increase your trade reach.",
  },
  diplomat: {
    icon: "🕊",
    text: "As Diplomat, sub-zones you own generate cultural influence. Shared borders create diplomatic opportunities.",
  },
  lorekeeper: {
    icon: "📖",
    text: "As Lorekeeper, the terrain of this land shapes your civilization's myths and cultural identity.",
  },
  warlord: {
    icon: "⚔",
    text: "As Warlord, fortified sub-zones resist raids. Walls here protect against enemy incursions.",
  },
};

export default function CityPanel({
  subZone,
  teamId,
  regionId,
  role,
  allTeams,
  onClose,
}: CityPanelProps) {
  const soilFertility = subZone.soil_fertility ?? 100;
  const wildlifeStock = subZone.wildlife_stock ?? 100;
  const buildings = subZone.buildings ?? [];
  const terrain = TERRAIN[subZone.terrain_type as TerrainType];
  const ownerTeam = allTeams.find((t) => t.id === subZone.controlled_by_team_id);
  const isOwnTeam = (subZone.controlled_by_team_id ?? null) === teamId;
  const isInOwnRegion = subZone.region_id === regionId;
  const isUnclaimed = !subZone.controlled_by_team_id;
  const hint = ROLE_HINTS[role];

  // Yield modifier formatted as percentage bonus/penalty
  const yieldPct = Math.round((subZone.yield_modifier - 1) * 100);
  const yieldLabel =
    yieldPct > 0
      ? `+${yieldPct}% yield`
      : yieldPct < 0
      ? `${yieldPct}% yield`
      : "Standard yield";

  return (
    <div className="rounded-xl border border-stone-700 bg-stone-950/95 shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-stone-800 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{terrain?.emoji ?? "📍"}</span>
            <h3 className="truncate text-base font-bold text-white">
              {subZone.settlement_name ?? subZone.name}
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-stone-400">
            {terrain?.label ?? subZone.terrain_type} •{" "}
            <span className={yieldPct >= 0 ? "text-green-400" : "text-red-400"}>
              {yieldLabel}
            </span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-stone-400 transition hover:bg-stone-800 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {/* Left column: ownership + resources */}
        <div className="space-y-3">
          {/* Ownership badge */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">
              Territory
            </p>
            {isUnclaimed ? (
              <div className="flex items-center gap-2 rounded-md bg-stone-800/60 px-3 py-1.5 text-sm text-stone-400">
                <span>🌍</span>
                <span>Unclaimed territory</span>
              </div>
            ) : isOwnTeam ? (
              <div
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white"
                style={{
                  background: `${ownerTeam?.color ?? "#888"}22`,
                  borderLeft: `3px solid ${ownerTeam?.color ?? "#888"}`,
                }}
              >
                <span>🏳️</span>
                <span>Your territory</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-white"
                style={{
                  background: `${ownerTeam?.color ?? "#888"}22`,
                  borderLeft: `3px solid ${ownerTeam?.color ?? "#888"}`,
                }}
              >
                <span>⚠️</span>
                <span>{ownerTeam?.name ?? "Unknown civ"}</span>
              </div>
            )}
          </div>

          {/* Land health */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
              Land Health
            </p>
            <div className="space-y-2">
              <ResourceBar
                label="Soil Fertility"
                value={soilFertility}
                icon="🌱"
              />
              <ResourceBar
                label="Wildlife Stock"
                value={wildlifeStock}
                icon="🦌"
              />
            </div>
          </div>
        </div>

        {/* Right column: buildings + settlement */}
        <div className="space-y-3">
          {/* Settlement name if founded */}
          {subZone.settlement_name && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">
                Settlement
              </p>
              <div className="flex items-center gap-2 rounded-md bg-amber-900/30 px-3 py-1.5 text-sm text-amber-300">
                <span>🏙️</span>
                <span className="font-medium">{subZone.settlement_name}</span>
              </div>
            </div>
          )}

          {/* Buildings */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
              Buildings
            </p>
            {buildings.length === 0 ? (
              <p className="rounded-md bg-stone-900/50 px-3 py-2 text-xs text-stone-500 italic">
                No structures built here yet
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {buildings.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 rounded-md bg-stone-800 px-2 py-1 text-xs text-stone-300"
                    title={BUILDING_LABELS[b] ?? b}
                  >
                    {BUILDING_ICONS[b] ?? "🏗️"} {BUILDING_LABELS[b] ?? b}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Found settlement CTA — shown only for own region, unoccupied */}
          {isInOwnRegion && !subZone.settlement_name && (
            <div>
              <button
                disabled
                className="w-full rounded-md bg-amber-900/30 px-3 py-2 text-xs text-amber-400/60 ring-1 ring-amber-700/30"
                title="City founding coming soon — Phase 17"
              >
                🏛 Found Settlement Here
                <span className="ml-2 rounded bg-stone-800 px-1 text-xs text-stone-500">
                  Coming Soon
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role hint strip */}
      <div className="flex items-start gap-2 rounded-b-xl border-t border-stone-800 bg-stone-900/50 px-4 py-2.5">
        <span className="mt-0.5 text-sm">{hint.icon}</span>
        <p className="text-xs text-stone-400">{hint.text}</p>
      </div>
    </div>
  );
}
