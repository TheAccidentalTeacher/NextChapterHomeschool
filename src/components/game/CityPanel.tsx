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

import { useState } from "react";
import { TERRAIN, FOUNDING, MATH_GATE } from "@/lib/constants";
import { BUILDINGS, UNITS, getAdjustedCost } from "@/lib/game/purchase-catalog";
import type { SubZoneData } from "@/components/map/GameMap";
import type { TerrainType, RoleName } from "@/types/database";
import MathGateModal from "@/components/modals/MathGateModal";
import type { MathGateResult, MathDifficulty } from "@/lib/game/math-gate";

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
  resources: Record<string, number>;  // current team resources for affordability
  hasBuilder?: boolean;               // builder unit discount
  unlockedTechs?: string[];
  mathGateEnabled?: boolean;
  mathGateDifficulty?: string;
  onClose: () => void;
  onBuildSuccess?: () => void;        // callback to re-fetch sub-zones after build
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
  gameId,
  resources,
  hasBuilder = false,
  unlockedTechs = [],
  mathGateEnabled = false,
  mathGateDifficulty = "multiply",
  onClose,
  onBuildSuccess,
}: CityPanelProps) {
  const [buildingKey, setBuildingKey] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [buildSuccess, setBuildSuccess] = useState<string | null>(null);
  const [deployingKey, setDeployingKey] = useState<string | null>(null);
  // Founding flow — intercepts the first build in an unfounded sub-zone
  const [pendingBuildKey, setPendingBuildKey] = useState<string | null>(null);
  const [foundingName, setFoundingName] = useState("");
  const [foundingClaim, setFoundingClaim] = useState("");
  // Math gate — holds context while the modal is open
  const [mathGateContext, setMathGateContext] = useState<{
    itemKey: string;
    isFounding: boolean;
    cost: number;
    resourceType: string;
  } | null>(null);

  const soilFertility = subZone.soil_fertility ?? 100;
  const wildlifeStock = subZone.wildlife_stock ?? 100;
  const buildings = subZone.buildings ?? [];
  const terrain = TERRAIN[subZone.terrain_type as TerrainType];
  const ownerTeam = allTeams.find((t) => t.id === subZone.controlled_by_team_id);
  const isOwnTeam = (subZone.controlled_by_team_id ?? null) === teamId;
  const isInOwnRegion = subZone.region_id === regionId;
  const isUnclaimed = !subZone.controlled_by_team_id;
  const hint = ROLE_HINTS[role];
  // True when this is the first buildable action in a zone — triggers founding
  const isFirstBuild = buildings.length === 0 && !subZone.settlement_name && isOwnTeam;

  const yieldPct = Math.round((subZone.yield_modifier - 1) * 100);
  const yieldLabel =
    yieldPct > 0
      ? `+${yieldPct}% yield`
      : yieldPct < 0
      ? `${yieldPct}% yield`
      : "Standard yield";

  async function handleBuild(itemKey: string) {
    if (!subZone.db_id) {
      setBuildError("Sub-zone not ready — please refresh the map.");
      return;
    }
    // Decision 90: First building in an unfounded sub-zone triggers founding modal
    if (isFirstBuild) {
      setPendingBuildKey(itemKey);
      setBuildError(null);
      setBuildSuccess(null);
      return;
    }

    // Decision 88: Math gate intercept for building purchases
    if (mathGateEnabled) {
      const item = BUILDINGS.find((b) => b.key === itemKey);
      if (item) {
        setMathGateContext({
          itemKey,
          isFounding: false,
          cost: getAdjustedCost(item, hasBuilder),
          resourceType: item.costResource,
        });
        return;
      }
    }

    await executeBuildRequest(itemKey, false);
  }

  /** Executes the actual build POST — called directly or after math gate */
  async function executeBuildRequest(itemKey: string, mathPenalty: boolean) {
    setBuildingKey(itemKey);
    setBuildError(null);
    setBuildSuccess(null);

    try {
      const res = await fetch(`/api/games/${gameId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          item_key: itemKey,
          sub_zone_id: subZone.db_id,
          has_builder: hasBuilder,
          ...(mathPenalty ? { math_penalty: true } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBuildError(data.error ?? "Build failed");
      } else {
        const built = BUILDINGS.find((b) => b.key === itemKey);
        setBuildSuccess(`${built?.emoji ?? "🏗️"} ${built?.name ?? itemKey} built!`);
        onBuildSuccess?.();
      }
    } catch {
      setBuildError("Network error — please try again.");
    } finally {
      setBuildingKey(null);
    }
  }

  /** Submits the founding + first build in a single request (Decision 90) */
  async function handleFoundAndBuild() {
    if (!pendingBuildKey || !subZone.db_id || !foundingName.trim() || !foundingClaim) return;

    // Decision 88: Math gate fires before the founding transaction confirms
    if (mathGateEnabled) {
      const item = BUILDINGS.find((b) => b.key === pendingBuildKey);
      if (item) {
        setMathGateContext({
          itemKey: pendingBuildKey,
          isFounding: true,
          cost: getAdjustedCost(item, hasBuilder),
          resourceType: item.costResource,
        });
        return;
      }
    }

    await executeFoundingRequest(false);
  }

  /** Executes the actual founding POST — called directly or after math gate */
  async function executeFoundingRequest(mathPenalty: boolean) {
    if (!pendingBuildKey || !subZone.db_id) return;
    setBuildingKey(pendingBuildKey);
    setBuildError(null);
    setBuildSuccess(null);

    try {
      const res = await fetch(`/api/games/${gameId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          item_key: pendingBuildKey,
          sub_zone_id: subZone.db_id,
          has_builder: hasBuilder,
          settlement_name: foundingName.trim(),
          founding_claim: foundingClaim,
          ...(mathPenalty ? { math_penalty: true } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBuildError(data.error ?? "Founding failed");
      } else {
        const built = BUILDINGS.find((b) => b.key === pendingBuildKey);
        setBuildSuccess(
          `🏛️ ${foundingName.trim()} founded! ${built?.emoji ?? "🏗️"} ${built?.name ?? pendingBuildKey} built.`
        );
        setPendingBuildKey(null);
        setFoundingName("");
        setFoundingClaim("");
        onBuildSuccess?.();
      }
    } catch {
      setBuildError("Network error — please try again.");
    } finally {
      setBuildingKey(null);
    }
  }

  /** Handles the math gate modal result and dispatches the pending build/found action */
  async function handleMathGateResult(result: MathGateResult) {
    const ctx = mathGateContext;
    setMathGateContext(null);
    if (!ctx) return;
    const penalty = !result.isCorrect;
    if (ctx.isFounding) {
      await executeFoundingRequest(penalty);
    } else {
      await executeBuildRequest(ctx.itemKey, penalty);
    }
  }

  async function handleDeploy(itemKey: string) {    if (!subZone.db_id) {
      setBuildError("Sub-zone not ready — please refresh the map.");
      return;
    }
    setDeployingKey(itemKey);
    setBuildError(null);
    setBuildSuccess(null);

    try {
      const res = await fetch(`/api/games/${gameId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          item_key: itemKey,
          sub_zone_id: subZone.db_id,
          has_builder: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBuildError(data.error ?? "Deploy failed");
      } else {
        const unit = UNITS.find((u) => u.key === itemKey);
        setBuildSuccess(`${unit?.emoji ?? "⚔️"} ${unit?.name ?? itemKey} deployed!`);
        onBuildSuccess?.();
      }
    } catch {
      setBuildError("Network error — please try again.");
    } finally {
      setDeployingKey(null);
    }
  }

  return (
    <>
      {/* Math Gate Modal — fires before building transactions when enabled */}
      {mathGateContext && (
        <MathGateModal
          difficulty={mathGateDifficulty as MathDifficulty}
          resourceName={mathGateContext.resourceType}
          transactionAmount={mathGateContext.cost}
          bankAmount={resources[mathGateContext.resourceType] ?? 0}
          timerSeconds={0}
          onComplete={handleMathGateResult}
        />
      )}
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

      {/* Architect build menu — only show when viewing own territory */}
      {role === "architect" && isOwnTeam && (
        <div className="border-t border-stone-800 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            🏗️ Build Here — ⚙️ {resources.production ?? 0} Production available
          </p>

          {/* Success/error feedback */}
          {buildSuccess && (
            <p className="rounded-md bg-green-900/40 px-3 py-1.5 text-xs text-green-400">
              ✓ {buildSuccess}
            </p>
          )}
          {buildError && (
            <p className="rounded-md bg-red-900/40 px-3 py-1.5 text-xs text-red-400">
              ✗ {buildError}
            </p>
          )}

          {/* Founding form — shown when first-build is intercepted (Decision 90) */}
          {pendingBuildKey && (
            <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 p-3 space-y-3">
              <p className="text-xs font-bold text-amber-400">🏛️ Found a Settlement</p>
              <p className="text-xs text-stone-400">
                You are placing the first building in this zone. Name your settlement and choose a founding claim.
              </p>

              {/* Name input */}
              <div>
                <label className="block mb-1 text-xs text-stone-500">Settlement Name (max 32 chars)</label>
                <input
                  type="text"
                  maxLength={32}
                  value={foundingName}
                  onChange={(e) => setFoundingName(e.target.value)}
                  placeholder="e.g. Stonehaven"
                  className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-sm text-white placeholder-stone-600 focus:border-amber-600 focus:outline-none"
                />
              </div>

              {/* Founding claim selector */}
              <div className="space-y-1.5">
                <label className="block text-xs text-stone-500">Founding Claim</label>
                {([
                  {
                    key: "first_settler",
                    emoji: "🌱",
                    label: "First Settler",
                    desc: "+10% yield. Bonus decays after a few epochs — you won't know how long.",
                  },
                  {
                    key: "resource_hub",
                    emoji: "⚙️",
                    label: "Resource Hub",
                    desc: `Permanent +${FOUNDING.RESOURCE_HUB_BONUS * 100}% yield bonus.`,
                  },
                  {
                    key: "natural_landmark",
                    emoji: "🗿",
                    label: "Natural Landmark",
                    desc: `Permanent +${FOUNDING.NATURAL_LANDMARK_CI} Legacy granted immediately. Appears on the projector map.`,
                  },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFoundingClaim(opt.key)}
                    className={`w-full flex items-start gap-2 rounded-md border px-3 py-2 text-left text-xs transition ${
                      foundingClaim === opt.key
                        ? "border-amber-600 bg-amber-900/40 text-amber-300"
                        : "border-stone-700 bg-stone-900/40 text-stone-300 hover:border-stone-600"
                    }`}
                  >
                    <span className="mt-0.5 text-base shrink-0">{opt.emoji}</span>
                    <span>
                      <span className="font-semibold">{opt.label}</span>
                      <br />
                      <span className="text-stone-400">{opt.desc}</span>
                    </span>
                  </button>
                ))}
              </div>

              {/* Confirm / cancel */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleFoundAndBuild}
                  disabled={!foundingName.trim() || !foundingClaim || !!buildingKey}
                  className="flex-1 rounded-md bg-amber-700 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-40"
                >
                  {buildingKey
                    ? "⏳ Founding…"
                    : `🏛️ Found & Build ${BUILDINGS.find((b) => b.key === pendingBuildKey)?.name ?? ""}`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingBuildKey(null);
                    setFoundingName("");
                    setFoundingClaim("");
                  }}
                  className="rounded-md border border-stone-700 px-3 py-2 text-xs text-stone-400 hover:border-stone-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Building grid — hidden while founding form is open */}
          {!pendingBuildKey && (
            <>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {BUILDINGS.map((b) => {
                const cost = getAdjustedCost(b, hasBuilder);
                const alreadyOwned = !b.isStackable && buildings.includes(b.key);
                const lockedByTech = b.techGate !== null && !unlockedTechs.includes(b.techGate);
                const canAfford = (resources.production ?? 0) >= cost;
                const isLoading = buildingKey === b.key;
                const disabled = alreadyOwned || lockedByTech || !canAfford || !!buildingKey;

                return (
                  <button
                    key={b.key}
                    onClick={() => handleBuild(b.key)}
                    disabled={disabled}
                    title={
                      alreadyOwned
                        ? "Already built"
                        : lockedByTech
                        ? `Requires ${b.techGate} tech`
                        : !canAfford
                        ? `Need ${cost} production (have ${resources.production ?? 0})`
                        : b.benefit
                    }
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-center transition ${
                      alreadyOwned
                        ? "border-green-800/40 bg-green-900/20 text-green-600"
                        : lockedByTech
                        ? "border-stone-800 bg-stone-900/40 text-stone-600 opacity-50"
                        : !canAfford
                        ? "border-stone-800 bg-stone-900/40 text-stone-600"
                        : "border-stone-700 bg-stone-800/60 text-stone-300 hover:border-amber-600/60 hover:bg-amber-900/20 hover:text-white"
                    }`}
                  >
                    <span className="text-base leading-none">{isLoading ? "⏳" : b.emoji}</span>
                    <span className="text-xs font-medium leading-tight">{b.name}</span>
                    {alreadyOwned ? (
                      <span className="text-xs text-green-500">✓ Built</span>
                    ) : (
                      <span className="text-xs text-stone-500">
                        ⚙️ {cost}
                        {hasBuilder && b.category === "building" && (
                          <span className="ml-0.5 text-amber-500">🔨</span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {hasBuilder && (
              <p className="text-xs text-amber-500/70">
                🔨 Builder deployed — building costs reduced by 3
              </p>
            )}
            </>
          )}
        </div>
      )}

      {/* Deploy units — shown for own territory, any role */}
      {isOwnTeam && (
        <div className="border-t border-stone-800 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            ⚔️ Deploy Units Here
          </p>
          <div className="flex flex-wrap gap-2">
            {UNITS.map((u) => {
              const resourceKey = u.costResource;
              const canAfford = (resources[resourceKey] ?? 0) >= u.costAmount;
              const isLoading = deployingKey === u.key;
              const disabled = !canAfford || !!deployingKey || !!buildingKey;

              return (
                <button
                  key={u.key}
                  onClick={() => handleDeploy(u.key)}
                  disabled={disabled}
                  title={
                    !canAfford
                      ? `Need ${u.costAmount} ${resourceKey} (have ${resources[resourceKey] ?? 0})`
                      : u.benefit
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
                    !canAfford
                      ? "border-stone-800 bg-stone-900/40 text-stone-600"
                      : "border-stone-700 bg-stone-800/60 text-stone-300 hover:border-blue-600/60 hover:bg-blue-900/20 hover:text-white"
                  }`}
                >
                  <span>{isLoading ? "⏳" : u.emoji}</span>
                  <span>{u.name}</span>
                  <span className="text-stone-500">
                    {resourceKey === "reach" ? "🧭" : resourceKey === "resilience" ? "🛡️" : "⚙️"}
                    {u.costAmount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Role hint strip — shown for non-architect roles */}
      {role !== "architect" && (
        <div className="flex items-start gap-2 rounded-b-xl border-t border-stone-800 bg-stone-900/50 px-4 py-2.5">
          <span className="mt-0.5 text-sm">{hint.icon}</span>
          <p className="text-xs text-stone-400">{hint.text}</p>
        </div>
      )}
      {role === "architect" && (
        <div className="flex items-start gap-2 rounded-b-xl border-t border-stone-800 bg-stone-900/50 px-4 py-2">
          <p className="text-xs text-stone-500">Hover any building for its benefit</p>
        </div>
      )}
    </div>
    </>
  );
}
