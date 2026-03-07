// ============================================
// ClassCiv Degradation Engine
// Decision 39: Building/unit destruction on events
// Determines which assets are destroyed/consumed
// when specific d20 events fire.
// Floor rule: no single event removes more than one category.
// ============================================

import type { TeamAsset } from "@/types/database";
import { getPurchaseItem } from "./purchase-catalog";

export type DegradationEventType =
  | "fire"          // BUILD d20 19-20 → destroy Farm
  | "siege"         // DEFEND d20 19-20 → destroy Walls
  | "raid"          // Raid event → destroy Barracks, steal Merchant, remove Soldiers
  | "drought"       // Drought → remove Aqueduct, deplete Food Stores
  | "plague"        // Disease/plague → consume Medicine
  | "expand_crit"   // EXPAND d20 19-20 → lose Scout
  | "tools_break";  // Builder tools break (1 epoch loss)

interface DegradationResult {
  /** Assets marked for deactivation */
  assetsDestroyed: { assetId: string; assetKey: string; reason: string }[];
  /** Supplies consumed (reduce quantity) */
  suppliesConsumed: { assetId: string; assetKey: string; quantity: number; reason: string }[];
  /** Whether any mitigation was in effect */
  mitigated: boolean;
  /** Human-readable summary */
  summary: string;
}

/**
 * Map of event types to which asset keys they can destroy.
 * Floor rule: each event targets at most one category.
 */
const DESTRUCTION_MAP: Record<DegradationEventType, string[]> = {
  fire:         ["farm", "repair_tools"],
  siege:        ["walls"],
  raid:         ["barracks", "soldier", "merchant_unit"],
  drought:      ["aqueduct", "food_stores"],
  plague:       ["medicine"],
  expand_crit:  ["scout"],
  tools_break:  ["builder"],
};

/**
 * Map of assets that mitigate specific events.
 * If the team has the mitigating asset, damage is reduced or blocked.
 */
const MITIGATION_MAP: Record<string, string[]> = {
  drought:  ["aqueduct"],      // Aqueduct blocks drought
  plague:   ["aqueduct"],      // Aqueduct also blocks disease
  raid:     ["walls", "barracks"], // Walls absorb first attack, Barracks help
  fire:     [],
  siege:    [],
  expand_crit: [],
  tools_break: [],
};

/**
 * Evaluate degradation effects for a given event against a team's assets.
 *
 * @param eventType - The type of destructive event
 * @param teamAssets - All active assets for the affected team
 * @param wallsAbsorbedThisEpoch - Whether walls have already absorbed an attack this epoch
 * @returns DegradationResult describing what gets destroyed
 */
export function evaluateDegradation(
  eventType: DegradationEventType,
  teamAssets: TeamAsset[],
  wallsAbsorbedThisEpoch: boolean = false
): DegradationResult {
  const activeAssets = teamAssets.filter((a) => a.is_active);
  const targetKeys = DESTRUCTION_MAP[eventType] ?? [];
  const mitigators = MITIGATION_MAP[eventType] ?? [];

  const assetsDestroyed: DegradationResult["assetsDestroyed"] = [];
  const suppliesConsumed: DegradationResult["suppliesConsumed"] = [];
  let mitigated = false;

  // Check if walls absorb this attack (raid/siege)
  if (
    (eventType === "raid") &&
    !wallsAbsorbedThisEpoch &&
    activeAssets.some((a) => a.asset_key === "walls")
  ) {
    mitigated = true;
    return {
      assetsDestroyed: [],
      suppliesConsumed: [],
      mitigated: true,
      summary: "🧱 Walls absorbed the attack — no damage this epoch!",
    };
  }

  // Check tech/building mitigations
  if (mitigators.length > 0) {
    const hasMitigation = mitigators.some((mk) =>
      activeAssets.some((a) => a.asset_key === mk)
    );
    if (hasMitigation && (eventType === "drought" || eventType === "plague")) {
      mitigated = true;
      return {
        assetsDestroyed: [],
        suppliesConsumed: [],
        mitigated: true,
        summary: `💧 Aqueduct protected your civilization from ${eventType}!`,
      };
    }
  }

  // Apply destruction — floor rule: destroy at most ONE asset per target key
  for (const key of targetKeys) {
    const item = getPurchaseItem(key);
    if (!item) continue;

    const matchingAssets = activeAssets.filter((a) => a.asset_key === key);
    if (matchingAssets.length === 0) continue;

    if (item.category === "supply") {
      // Consume one supply
      suppliesConsumed.push({
        assetId: matchingAssets[0].id,
        assetKey: key,
        quantity: 1,
        reason: `${eventType} consumed ${item.name}`,
      });
    } else {
      // Destroy first matching building/unit
      assetsDestroyed.push({
        assetId: matchingAssets[0].id,
        assetKey: key,
        reason: `${eventType} destroyed ${item.name}`,
      });
    }

    // Floor rule: only one category hit per event, so break after first hit
    break;
  }

  const parts: string[] = [];
  for (const d of assetsDestroyed) {
    const item = getPurchaseItem(d.assetKey);
    parts.push(`${item?.emoji ?? "💥"} ${item?.name ?? d.assetKey} destroyed`);
  }
  for (const s of suppliesConsumed) {
    const item = getPurchaseItem(s.assetKey);
    parts.push(`${item?.emoji ?? "📦"} ${item?.name ?? s.assetKey} consumed`);
  }

  return {
    assetsDestroyed,
    suppliesConsumed,
    mitigated,
    summary:
      parts.length > 0
        ? parts.join(". ") + "."
        : `No assets affected by ${eventType}.`,
  };
}

/**
 * Check if repair is possible for a destroyed asset.
 * Requires Repair Tools supply.
 */
export function canRepair(
  destroyedAssetKey: string,
  teamAssets: TeamAsset[]
): boolean {
  const hasRepairTools = teamAssets.some(
    (a) => a.asset_key === "repair_tools" && a.is_active
  );
  const item = getPurchaseItem(destroyedAssetKey);
  // Can only repair buildings (not units or supplies)
  return hasRepairTools && item?.category === "building";
}

/**
 * Get a list of buildings that provide yield bonuses.
 * Used by yield-calculator to apply building effects.
 */
export function getBuildingEffects(teamAssets: TeamAsset[]): {
  hasFarm: boolean;
  farmCount: number;
  hasGranary: boolean;
  hasBarracks: boolean;
  hasMarket: boolean;
  hasAqueduct: boolean;
  hasLibrary: boolean;
  hasWalls: boolean;
  builderCount: number;
  merchantUnitCount: number;
  soldierCount: number;
  scoutCount: number;
} {
  const active = teamAssets.filter((a) => a.is_active);

  return {
    hasFarm: active.some((a) => a.asset_key === "farm"),
    farmCount: active.filter((a) => a.asset_key === "farm").length,
    hasGranary: active.some((a) => a.asset_key === "granary"),
    hasBarracks: active.some((a) => a.asset_key === "barracks"),
    hasMarket: active.some((a) => a.asset_key === "market"),
    hasAqueduct: active.some((a) => a.asset_key === "aqueduct"),
    hasLibrary: active.some((a) => a.asset_key === "library"),
    hasWalls: active.some((a) => a.asset_key === "walls"),
    builderCount: active.filter((a) => a.asset_key === "builder").length,
    merchantUnitCount: active.filter((a) => a.asset_key === "merchant_unit").length,
    soldierCount: active.filter((a) => a.asset_key === "soldier").length,
    scoutCount: active.filter((a) => a.asset_key === "scout").length,
  };
}
