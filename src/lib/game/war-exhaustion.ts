// ============================================
// War Exhaustion System (Decision 65)
// War has systemic multi-epoch consequences
// ============================================

export interface WarExhaustionState {
  exhaustionPoints: number;   // 0–100+
  populationCurrent: number;
  isWinner: boolean;
  hasBarracks: boolean;
  hasFarm: boolean;
  hasGranary: boolean;
}

export interface WarConsequences {
  populationLoss: number;
  productionPenalty: number;    // fraction (0.3 = -30%)
  bankLossPercent: number;      // fraction of bank to lose
  soldiersLost: number;
  suppressPopRecovery: boolean;
  events: string[];
}

// War Exhaustion thresholds
const WE_THRESHOLD_1 = 50;      // all yields -15%
const WE_THRESHOLD_2 = 75;      // all yields -30%, no trade, d20 skews
const WE_CIVIL_UNREST = 100;    // Resilience collapse, Warlord submission cancelled

// War declaration base cost
const WAR_DECLARATION_EXHAUSTION = 25;
const PASSIVE_DECAY_PER_EPOCH = 10;

/**
 * Add war exhaustion from declaration
 */
export function declareWar(currentExhaustion: number): number {
  return currentExhaustion + WAR_DECLARATION_EXHAUSTION;
}

/**
 * Passively decay war exhaustion each epoch
 */
export function decayWarExhaustion(currentExhaustion: number): number {
  return Math.max(0, currentExhaustion - PASSIVE_DECAY_PER_EPOCH);
}

/**
 * Get the yield penalty level based on war exhaustion
 */
export function getExhaustionLevel(exhaustion: number): 0 | 1 | 2 {
  if (exhaustion >= WE_THRESHOLD_2) return 2;
  if (exhaustion >= WE_THRESHOLD_1) return 1;
  return 0;
}

/**
 * Check if civil unrest triggers (Resilience collapse)
 */
export function isCivilUnrest(exhaustion: number): boolean {
  return exhaustion >= WE_CIVIL_UNREST;
}

/**
 * Check if trade is blocked by exhaustion
 */
export function isTradeBlocked(exhaustion: number): boolean {
  return exhaustion >= WE_THRESHOLD_2;
}

/**
 * Calculate post-war consequences for a team
 */
export function calculateWarConsequences(state: WarExhaustionState): WarConsequences {
  const events: string[] = [];

  // Population loss
  let popLoss: number;
  if (state.isWinner) {
    popLoss = 2;
    events.push("Victory — but at a cost: -2 population");
  } else {
    popLoss = Math.floor(Math.random() * 3) + 3; // 3-5
    events.push(`Defeat — devastating losses: -${popLoss} population`);
  }

  // Production penalty: -30% next epoch for both sides
  const productionPenalty = 0.3;
  events.push("Production reduced by 30% (war recovery)");

  // Bank plunder
  let bankLoss: number;
  if (state.isWinner) {
    bankLoss = 0.15; // winner loses 15% (campaign cost)
    events.push("Campaign costs: -15% banked resources");
  } else {
    bankLoss = 0.25; // loser loses 25% (plunder)
    events.push("Plundered! -25% banked resources");
  }

  // Soldiers lost
  let soldiersLost: number;
  if (state.isWinner) {
    soldiersLost = 1; // Pyrrhic cost
    events.push("Pyrrhic victory: -1 soldier");
  } else {
    soldiersLost = Math.floor(Math.random() * 3) + 1; // 1-3
    events.push(`Military collapse: -${soldiersLost} soldiers`);
  }

  // Population recovery suppressed until Farm + Granary both exist
  const suppressPopRecovery = !(state.hasFarm && state.hasGranary);
  if (suppressPopRecovery) {
    events.push("Population recovery suppressed — build Farm + Granary to resume growth");
  }

  return {
    populationLoss: popLoss,
    productionPenalty,
    bankLossPercent: bankLoss,
    soldiersLost,
    suppressPopRecovery,
    events,
  };
}

/**
 * Projector message for Pyrrhic victory
 */
export const PYRRHIC_MESSAGE =
  "Victory is secured. But the fields are quiet...";
