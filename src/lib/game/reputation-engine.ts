// ============================================
// Reputation Engine — NPC Reputation Tracking
// Decision 64: Real DB value per team per NPC (0-100)
// Starting: 50 (neutral)
// ============================================

export interface ReputationState {
  teamId: string;
  npcId: string;
  reputation: number;
}

export type ReputationEvent =
  | "rob_caravan"           // -20
  | "attack_sanctuary"      // -15 (without Diplomat contact)
  | "gift_sanctuary"        // +10
  | "trade_caravan"          // +5
  | "passive_recovery"      // +5 per epoch
  | "bribe_horde"           // +3
  | "cultural_exchange"     // +8
  | "conquered_sanctuary";  // -25

const REPUTATION_MODIFIERS: Record<ReputationEvent, number> = {
  rob_caravan: -20,
  attack_sanctuary: -15,
  gift_sanctuary: 10,
  trade_caravan: 5,
  passive_recovery: 5,
  bribe_horde: 3,
  cultural_exchange: 8,
  conquered_sanctuary: -25,
};

const DEFAULT_REPUTATION = 50;
const MIN_REPUTATION = 0;
const MAX_REPUTATION = 100;

// ---- Thresholds ----
/** Below 30: caravans permanently reroute around team */
export const CARAVAN_REROUTE_THRESHOLD = 30;
/** Below 10: all sanctuaries refuse contact */
export const SANCTUARY_REFUSE_THRESHOLD = 10;

/**
 * Create initial reputation state for a team-NPC pair.
 */
export function createReputation(teamId: string, npcId: string): ReputationState {
  return { teamId, npcId, reputation: DEFAULT_REPUTATION };
}

/**
 * Apply a reputation event modifier. Clamps to 0-100.
 */
export function applyReputationEvent(
  state: ReputationState,
  event: ReputationEvent
): ReputationState {
  const delta = REPUTATION_MODIFIERS[event];
  const newRep = Math.max(
    MIN_REPUTATION,
    Math.min(MAX_REPUTATION, state.reputation + delta)
  );

  return { ...state, reputation: newRep };
}

/**
 * Apply passive epoch recovery (+5) for all team-NPC pairs.
 */
export function applyPassiveRecovery(
  states: ReputationState[]
): ReputationState[] {
  return states.map((s) =>
    applyReputationEvent(s, "passive_recovery")
  );
}

/**
 * Check if caravans will reroute this team.
 */
export function willCaravansReroute(reputation: number): boolean {
  return reputation < CARAVAN_REROUTE_THRESHOLD;
}

/**
 * Check if sanctuaries refuse contact with this team.
 */
export function willSanctuariesRefuse(reputation: number): boolean {
  return reputation < SANCTUARY_REFUSE_THRESHOLD;
}

/**
 * Get the reputation modifier value for an event (for display).
 */
export function getModifierValue(event: ReputationEvent): number {
  return REPUTATION_MODIFIERS[event];
}

/**
 * Get a human-readable reputation tier.
 */
export function getReputationTier(reputation: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (reputation >= 80) return { label: "Revered", color: "text-green-400", emoji: "🌟" };
  if (reputation >= 60) return { label: "Friendly", color: "text-blue-400", emoji: "😊" };
  if (reputation >= 40) return { label: "Neutral", color: "text-gray-400", emoji: "😐" };
  if (reputation >= 20) return { label: "Suspicious", color: "text-yellow-400", emoji: "🤨" };
  return { label: "Hostile", color: "text-red-400", emoji: "😡" };
}

/**
 * Get all warnings for a team based on reputation thresholds.
 */
export function getReputationWarnings(reputation: number): string[] {
  const warnings: string[] = [];

  if (reputation < CARAVAN_REROUTE_THRESHOLD) {
    warnings.push("⚠️ Caravans permanently reroute around your territory");
  }
  if (reputation < SANCTUARY_REFUSE_THRESHOLD) {
    warnings.push("🚫 All Sanctuaries refuse contact with your civilization");
  }

  return warnings;
}
