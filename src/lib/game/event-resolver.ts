// ============================================
// ClassCiv Event Resolver
// Applies d20 event effects to team resources,
// assets, and population. Checks mitigations.
// ============================================

import type { EventDefinition } from "./event-deck";
import {
  evaluateDegradation,
  type DegradationEventType,
} from "./degradation-engine";
import type { TeamAsset } from "@/types/database";

export interface EventResolution {
  teamId: string;
  eventId: string;
  eventName: string;
  /** Resource changes to apply: { resource_type: delta } */
  resourceChanges: Record<string, number>;
  /** Population delta */
  populationDelta: number;
  /** Assets destroyed */
  assetsDestroyed: { assetId: string; assetKey: string; reason: string }[];
  /** Supplies consumed */
  suppliesConsumed: { assetId: string; assetKey: string; quantity: number; reason: string }[];
  /** Was mitigated by tech/building? */
  wasMitigated: boolean;
  /** Human-readable summary */
  summary: string;
}

/**
 * Map event IDs to degradation event types
 */
const EVENT_TO_DEGRADATION: Record<string, DegradationEventType> = {
  storm_destroys_farm: "fire",
  drought: "drought",
  plague: "plague",
  dysentery: "plague",
  raid: "raid",
  pirate_blockade: "siege",
};

/**
 * Resolve a d20 event for a given team.
 * Calculates all resource changes, asset destruction,
 * and population impacts with mitigation checks.
 */
export function resolveEvent(
  event: EventDefinition,
  teamId: string,
  teamAssets: TeamAsset[],
  currentResources: Record<string, number>,
  wallsAbsorbedThisEpoch: boolean = false
): EventResolution {
  const resourceChanges: Record<string, number> = {};
  let populationDelta = event.populationImpact;
  let wasMitigated = false;
  const summaryParts: string[] = [];

  // Check mitigations
  const activeAssets = teamAssets.filter((a) => a.is_active);
  const hasMitigation = event.mitigations.some((mk) =>
    activeAssets.some((a) => a.asset_key === mk)
  );

  if (hasMitigation && event.severity === "moderate_negative") {
    wasMitigated = true;
    summaryParts.push(`✅ Mitigated by ${event.mitigations.join("/")}`);
    // Mitigated = reduce negative effects by 75%
    for (const [res, amount] of Object.entries(event.resourceImpact)) {
      const val = amount ?? 0;
      if (val < 0) {
        resourceChanges[res] = Math.round(val * 0.25); // only 25% damage
      } else {
        resourceChanges[res] = val;
      }
    }
    populationDelta = Math.max(populationDelta, -1); // cap pop loss at 1 when mitigated
  } else if (hasMitigation && event.severity === "extreme_negative") {
    wasMitigated = true;
    summaryParts.push(`✅ Partially mitigated by ${event.mitigations.join("/")}`);
    // Extreme negative: mitigation reduces by 50%
    for (const [res, amount] of Object.entries(event.resourceImpact)) {
      const val = amount ?? 0;
      resourceChanges[res] = val < 0 ? Math.round(val * 0.5) : val;
    }
    populationDelta = Math.round(populationDelta * 0.5);
  } else {
    // No mitigation — full impact
    for (const [res, amount] of Object.entries(event.resourceImpact)) {
      resourceChanges[res] = amount ?? 0;
    }
  }

  // Special handling for piracy (percentage-based)
  if (event.id === "piracy" && !wasMitigated) {
    const currentReach = currentResources.reach ?? 0;
    resourceChanges.reach = -Math.round(currentReach * 0.15);
    summaryParts.push(`🏴‍☠️ Pirates stole ${Math.abs(resourceChanges.reach)} Reach`);
  }

  // Apply asset degradation for destructive events
  let assetsDestroyed: EventResolution["assetsDestroyed"] = [];
  let suppliesConsumed: EventResolution["suppliesConsumed"] = [];

  const degradationType = EVENT_TO_DEGRADATION[event.id];
  if (degradationType && !wasMitigated) {
    const degradation = evaluateDegradation(
      degradationType,
      teamAssets,
      wallsAbsorbedThisEpoch
    );
    assetsDestroyed = degradation.assetsDestroyed;
    suppliesConsumed = degradation.suppliesConsumed;
    if (degradation.mitigated) {
      wasMitigated = true;
    }
    if (degradation.summary) {
      summaryParts.push(degradation.summary);
    }
  }

  // Also check event's assetTargets directly for supply consumption
  if (event.assetTargets.length > 0 && !wasMitigated && !degradationType) {
    for (const targetKey of event.assetTargets) {
      const matching = activeAssets.find((a) => a.asset_key === targetKey);
      if (matching) {
        suppliesConsumed.push({
          assetId: matching.id,
          assetKey: targetKey,
          quantity: 1,
          reason: `${event.name} consumed ${targetKey}`,
        });
      }
    }
  }

  // Build resource summary
  for (const [res, amount] of Object.entries(resourceChanges)) {
    if (amount !== 0) {
      const sign = amount > 0 ? "+" : "";
      summaryParts.push(`${sign}${amount} ${res}`);
    }
  }
  if (populationDelta !== 0) {
    summaryParts.push(`${populationDelta > 0 ? "+" : ""}${populationDelta} Population`);
  }

  return {
    teamId,
    eventId: event.id,
    eventName: event.name,
    resourceChanges,
    populationDelta,
    assetsDestroyed,
    suppliesConsumed,
    wasMitigated,
    summary:
      summaryParts.length > 0
        ? `${event.emoji} ${event.name}: ${summaryParts.join(". ")}`
        : `${event.emoji} ${event.name}: No effect.`,
  };
}

/**
 * Ensure no resource drops below zero
 */
export function clampResources(
  current: Record<string, number>,
  changes: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = { ...current };
  for (const [res, delta] of Object.entries(changes)) {
    result[res] = Math.max(0, (result[res] ?? 0) + delta);
  }
  return result;
}
