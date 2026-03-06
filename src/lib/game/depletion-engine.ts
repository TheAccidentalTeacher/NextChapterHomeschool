// ============================================
// Sub-Zone Depletion Engine (Decision 87)
// Overfarming/overhunting reduce yields. Tech enables recovery.
// ============================================

export interface DepletionState {
  soilFertility: number;    // 0–100 (or up to fertilityCap)
  wildlifeStock: number;    // 0–100
  fertilityCap: number;     // default 100, can be raised by tech
  isBeingWorked: boolean;
  // Tech flags
  hasIrrigation: boolean;        // Tier 2: faster recovery, coastal/river +10% Food
  hasTerraceFarming: boolean;    // Tier 3: cap → 120 (mountain/hill only)
  hasCropRotation: boolean;      // Tier 3: decay capped at -2/epoch if Farm exists
  hasScientificAgriculture: boolean; // Tier 5: cap → 135 all sub-zones
  hasFarm: boolean;
  terrainType: string;
}

export interface DepletionTickResult {
  newSoilFertility: number;
  newWildlifeStock: number;
  soilChange: number;
  wildlifeChange: number;
  yieldPenalty: number;        // 0.0 or 0.25
  events: string[];
}

// Constants from constants.ts but duplicated for game engine purity
const BASE_DECAY_RATE = 5;       // -3 to -5 per worked epoch (we use 5)
const CROP_ROTATION_DECAY = 2;   // capped at -2 with Crop Rotation + Farm
const RECOVERY_RATE = 5;         // +5 per unworked epoch
const IRRIGATION_RECOVERY_BONUS = 5; // extra +5 with Irrigation tech
const WARNING_THRESHOLD = 30;    // yield -25% at ≤30%
const CRITICAL_THRESHOLD = 10;   // triggers depletion event at ≤10%

/**
 * Compute the fertility cap based on tech upgrades
 */
export function computeFertilityCap(state: DepletionState): number {
  if (state.hasScientificAgriculture) return 135;
  if (state.hasTerraceFarming &&
    (state.terrainType === "mountain" || state.terrainType === "hills")) {
    return 120;
  }
  return 100;
}

/**
 * Process one epoch of depletion for a sub-zone
 */
export function tickDepletion(state: DepletionState): DepletionTickResult {
  const events: string[] = [];
  let { soilFertility, wildlifeStock } = state;
  const fertilityCap = computeFertilityCap(state);

  let soilChange = 0;
  let wildlifeChange = 0;

  if (state.isBeingWorked) {
    // Decay when worked
    let soilDecay = BASE_DECAY_RATE;
    const wildlifeDecay = BASE_DECAY_RATE;

    // Crop Rotation tech: cap soil decay at -2 if Farm exists
    if (state.hasCropRotation && state.hasFarm) {
      soilDecay = Math.min(soilDecay, CROP_ROTATION_DECAY);
    }

    soilChange = -soilDecay;
    wildlifeChange = -wildlifeDecay;
  } else {
    // Recovery when unworked
    let recoveryRate = RECOVERY_RATE;
    if (state.hasIrrigation) {
      recoveryRate += IRRIGATION_RECOVERY_BONUS;
    }

    soilChange = recoveryRate;
    wildlifeChange = recoveryRate;
  }

  soilFertility = Math.max(0, Math.min(fertilityCap, soilFertility + soilChange));
  wildlifeStock = Math.max(0, Math.min(100, wildlifeStock + wildlifeChange));

  // Determine yield penalty from depletion
  let yieldPenalty = 0;
  const avgHealth = (soilFertility + wildlifeStock) / 2;

  if (avgHealth <= CRITICAL_THRESHOLD) {
    yieldPenalty = 0.25;
    events.push("🔴 CRITICAL depletion! Yields heavily reduced.");
  } else if (avgHealth <= WARNING_THRESHOLD) {
    yieldPenalty = 0.25;
    events.push("🟡 Depletion warning: yields reduced by 25%.");
  }

  // Map color shift events
  if (soilFertility <= CRITICAL_THRESHOLD) {
    events.push("🏜️ Soil critically depleted — map color: brown");
  } else if (soilFertility <= WARNING_THRESHOLD) {
    events.push("⚠️ Soil degrading — map color: yellow");
  }

  return {
    newSoilFertility: soilFertility,
    newWildlifeStock: wildlifeStock,
    soilChange,
    wildlifeChange,
    yieldPenalty,
    events,
  };
}

/**
 * Get the visual tier for map color rendering
 */
export function getDepletionTier(
  fertility: number,
  wildlife: number
): "healthy" | "warning" | "critical" {
  const avg = (fertility + wildlife) / 2;
  if (avg <= CRITICAL_THRESHOLD) return "critical";
  if (avg <= WARNING_THRESHOLD) return "warning";
  return "healthy";
}

/**
 * Color map for depletion visual overlay
 */
export const DEPLETION_COLORS = {
  healthy: "rgba(34, 197, 94, 0.15)",   // green tint
  warning: "rgba(234, 179, 8, 0.25)",    // yellow tint
  critical: "rgba(239, 68, 68, 0.3)",    // red/brown tint
} as const;
