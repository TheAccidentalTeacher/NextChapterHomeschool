// ============================================
// NPC Engine — Non-Player Civilizations
// Decision 64: 5 archetypes with distinct AI behavior
// Lifecycle triggers based on room tech-tier level
// ============================================

// ---- Types ----

export type NPCArchetype = "horde" | "sanctuary" | "colossus" | "caravan" | "recluse";

export type NPCLifecycleStage =
  | "dormant"
  | "active"
  | "imperial"   // Colossus only
  | "peak"       // Colossus only
  | "declining"  // Colossus only
  | "fallen"
  | "dissolved";

export interface NPCDefinition {
  archetype: NPCArchetype;
  name: string;
  emoji: string;
  description: string;
  defaultTerritory: number;           // number of sub-zones
  hasTerritory: boolean;
  triggerCondition: string;           // human-readable
  behavior: string;
  defeatCondition: string;
}

export interface NPCInstance {
  id: string;
  gameId: string;
  archetype: NPCArchetype;
  name: string;
  stage: NPCLifecycleStage;
  subZoneIds: string[];
  route?: string[];                   // Caravan only
  metadata: Record<string, unknown>;
  activatedAtEpoch?: number;
  lastActionEpoch?: number;
}

export interface NPCAction {
  type: "raid" | "trade_offer" | "legacy_drain" | "expand" | "decline" | "reroute" | "cultural_exchange" | "warning" | "fall" | "none";
  targetTeamId?: string;
  description: string;
  payload?: Record<string, unknown>;
}

// ---- Archetype Definitions ----

export const NPC_ARCHETYPES: Record<NPCArchetype, NPCDefinition> = {
  horde: {
    archetype: "horde",
    name: "Horde",
    emoji: "🐎",
    description: "Aggressive raider civ. Auto-pulse raids lowest-Resilience adjacent team each epoch. Bribable via Merchant tribute.",
    defaultTerritory: 3,
    hasTerritory: true,
    triggerCondition: "2+ teams reach Tier 4",
    behavior: "Raids lowest-Resilience adjacent team each epoch. Can be bribed by Merchant (skips 1 epoch).",
    defeatCondition: "Disintegration after 6-8 epochs — territory goes neutral",
  },
  sanctuary: {
    archetype: "sanctuary",
    name: "Sanctuary",
    emoji: "🕊️",
    description: "Peaceful NPC. Never attacks. Passive trade offer every 2 epochs. Military conquest costs -10 CI permanently.",
    defaultTerritory: 2,
    hasTerritory: true,
    triggerCondition: "DM spawns at game setup",
    behavior: "Passive trade every 2 epochs. Never initiates conflict. Conquering costs -10 CI permanently.",
    defeatCondition: "Peaceful — persists unless conquered",
  },
  colossus: {
    archetype: "colossus",
    name: "Colossus",
    emoji: "🏛️",
    description: "Rome-like super-civ. Dormant → Imperial → Peak → Decline → Fall. Drains Legacy from weaker neighbors.",
    defaultTerritory: 10,
    hasTerritory: true,
    triggerCondition: "3+ teams reach Tier 3 (or WAKE ROME button)",
    behavior: "Dormant Legacy drain (-1/epoch) on weaker adjacent civs. Expands during Imperial. Declines after Peak.",
    defeatCondition: "Rise → Peak → Decline (−1 sub-zone/epoch) → Fall — territory goes neutral",
  },
  caravan: {
    archetype: "caravan",
    name: "Caravan",
    emoji: "🐪",
    description: "Traveling trader NPC. Follows preset route. Trade popup when passing Market/Merchant sub-zones. Robbable.",
    defaultTerritory: 0,
    hasTerritory: false,
    triggerCondition: "DM assigns route at game setup",
    behavior: "Travels route. Trade popup at Market sub-zones. Robbery costs 1 Soldier, -20 Rep. Reroutes 3 epochs if robbed.",
    defeatCondition: "Never ends — reroutes if robbed",
  },
  recluse: {
    archetype: "recluse",
    name: "Recluse",
    emoji: "🏔️",
    description: "Extreme defense. 1-epoch attack warning. Befriendable via 3 consecutive Lorekeeper cultural exchanges.",
    defaultTerritory: 4,
    hasTerritory: true,
    triggerCondition: "DM spawns at game setup",
    behavior: "Extreme defense. Warns 1 epoch before any attack. Befriendable via 3 cultural exchanges in a row.",
    defeatCondition: "Permanent ally if befriended",
  },
};

// ---- Lifecycle Check ----

export interface TechTierCounts {
  tier3Count: number;  // teams at tier 3+
  tier4Count: number;  // teams at tier 4+
}

/**
 * Check if an NPC should activate based on room tech tiers.
 */
export function shouldActivate(
  npc: NPCInstance,
  tierCounts: TechTierCounts
): boolean {
  if (npc.stage !== "dormant") return false;

  switch (npc.archetype) {
    case "colossus":
      return tierCounts.tier3Count >= 3;
    case "horde":
      return tierCounts.tier4Count >= 2;
    case "sanctuary":
    case "caravan":
    case "recluse":
      // These are DM-triggered, not tech-gated
      return false;
    default:
      return false;
  }
}

/**
 * Advance a Colossus NPC through its lifecycle stages.
 * Returns the new stage and any territory changes.
 */
export function advanceColossusLifecycle(
  npc: NPCInstance,
  currentEpoch: number
): { newStage: NPCLifecycleStage; territoryChange: number } {
  const epochsActive = npc.activatedAtEpoch
    ? currentEpoch - npc.activatedAtEpoch
    : 0;

  switch (npc.stage) {
    case "dormant":
      return { newStage: "imperial", territoryChange: 0 };
    case "imperial":
      // Expand for 4-5 epochs, then peak
      if (epochsActive >= 5) {
        return { newStage: "peak", territoryChange: 0 };
      }
      return { newStage: "imperial", territoryChange: 1 }; // expand 1 sub-zone
    case "peak":
      // Peak lasts 2 epochs
      if (epochsActive >= 7) {
        return { newStage: "declining", territoryChange: 0 };
      }
      return { newStage: "peak", territoryChange: 0 };
    case "declining":
      // Lose 1 sub-zone per epoch
      if (npc.subZoneIds.length <= 1) {
        return { newStage: "fallen", territoryChange: 0 };
      }
      return { newStage: "declining", territoryChange: -1 };
    case "fallen":
      return { newStage: "dissolved", territoryChange: 0 };
    default:
      return { newStage: npc.stage, territoryChange: 0 };
  }
}

// ---- Behavior Pulse (per epoch at RESOLVE) ----

export interface TeamProximityData {
  teamId: string;
  teamName: string;
  resilience: number;
  subZoneIds: string[];
  isAdjacent: boolean;
  hasMarket: boolean;
}

/**
 * Determine the NPC's automatic action for this epoch.
 */
export function resolveNPCAction(
  npc: NPCInstance,
  currentEpoch: number,
  nearbyTeams: TeamProximityData[]
): NPCAction {
  if (npc.stage === "dormant" || npc.stage === "dissolved" || npc.stage === "fallen") {
    return { type: "none", description: `${npc.name} is ${npc.stage}` };
  }

  const adjacentTeams = nearbyTeams.filter((t) => t.isAdjacent);

  switch (npc.archetype) {
    case "horde":
      return resolveHordeAction(npc, adjacentTeams);
    case "sanctuary":
      return resolveSanctuaryAction(npc, currentEpoch, adjacentTeams);
    case "colossus":
      return resolveColossusAction(npc, currentEpoch, adjacentTeams);
    case "caravan":
      return resolveCaravanAction(npc, nearbyTeams);
    case "recluse":
      return resolveRecluseAction(npc);
    default:
      return { type: "none", description: "Unknown archetype" };
  }
}

function resolveHordeAction(
  npc: NPCInstance,
  adjacentTeams: TeamProximityData[]
): NPCAction {
  // Check if bribed this epoch
  const bribedUntil = (npc.metadata.bribedUntilEpoch as number) ?? 0;
  if (bribedUntil > 0) {
    return { type: "none", description: `${npc.name} was bribed — skipping raid` };
  }

  if (adjacentTeams.length === 0) {
    return { type: "none", description: `${npc.name} has no adjacent targets` };
  }

  // Raid lowest-resilience adjacent team
  const target = adjacentTeams.reduce((lowest, team) =>
    team.resilience < lowest.resilience ? team : lowest
  );

  return {
    type: "raid",
    targetTeamId: target.teamId,
    description: `${npc.name} raids ${target.teamName} (lowest Resilience: ${target.resilience})`,
    payload: {
      resilienceDamage: 10,
      resourceStolen: "production",
      amountStolen: 3,
    },
  };
}

function resolveSanctuaryAction(
  npc: NPCInstance,
  currentEpoch: number,
  adjacentTeams: TeamProximityData[]
): NPCAction {
  // Trade offer every 2 epochs
  if (currentEpoch % 2 !== 0 || adjacentTeams.length === 0) {
    return { type: "none", description: `${npc.name} rests peacefully` };
  }

  // Random adjacent team gets trade offer
  const target = adjacentTeams[Math.floor(Math.random() * adjacentTeams.length)];

  return {
    type: "trade_offer",
    targetTeamId: target.teamId,
    description: `${npc.name} offers peaceful trade to ${target.teamName}`,
    payload: {
      offerResource: "reach",
      offerAmount: 5,
      requestResource: "production",
      requestAmount: 3,
    },
  };
}

function resolveColossusAction(
  npc: NPCInstance,
  _currentEpoch: number,
  adjacentTeams: TeamProximityData[]
): NPCAction {
  switch (npc.stage) {
    case "imperial":
      // Expand and drain
      if (adjacentTeams.length > 0) {
        return {
          type: "expand",
          description: `${npc.name} expands its borders and drains Legacy from neighbors`,
          payload: { legacyDrain: 1 },
        };
      }
      return {
        type: "legacy_drain",
        description: `${npc.name} drains Legacy from weaker adjacent civilizations`,
        payload: { legacyDrain: 1 },
      };
    case "peak":
      return {
        type: "legacy_drain",
        description: `${npc.name} is at its peak — passive Legacy drain continues`,
        payload: { legacyDrain: 1 },
      };
    case "declining":
      return {
        type: "decline",
        description: `${npc.name} is declining — losing territory`,
      };
    default:
      return { type: "none", description: `${npc.name} is quiet` };
  }
}

function resolveCaravanAction(
  npc: NPCInstance,
  nearbyTeams: TeamProximityData[]
): NPCAction {
  // Check if rerouted
  const rerouted = (npc.metadata.reroutedUntilEpoch as number) ?? 0;
  if (rerouted > 0) {
    return {
      type: "reroute",
      description: `${npc.name} is rerouted — avoiding robbers`,
    };
  }

  // Check if passing a Market sub-zone
  const marketTeams = nearbyTeams.filter((t) => t.hasMarket);
  if (marketTeams.length > 0) {
    const target = marketTeams[0];
    return {
      type: "trade_offer",
      targetTeamId: target.teamId,
      description: `${npc.name} passes ${target.teamName}'s market — trade opportunity!`,
      payload: {
        offerResource: "production",
        offerAmount: 4,
        requestResource: "reach",
        requestAmount: 2,
      },
    };
  }

  return { type: "none", description: `${npc.name} travels its route` };
}

function resolveRecluseAction(
  npc: NPCInstance
): NPCAction {
  // Check if befriended
  const culturalExchanges = (npc.metadata.consecutiveCulturalExchanges as number) ?? 0;
  if (culturalExchanges >= 3) {
    return {
      type: "cultural_exchange",
      description: `${npc.name} is now a permanent ally!`,
      payload: { allied: true },
    };
  }

  return {
    type: "warning",
    description: `${npc.name} watches from the mountains — do not provoke`,
  };
}

// ---- Horde Bribe ----

export function bribeHorde(npc: NPCInstance, currentEpoch: number): NPCInstance {
  return {
    ...npc,
    metadata: {
      ...npc.metadata,
      bribedUntilEpoch: currentEpoch + 1,
    },
  };
}

// ---- Caravan Robbery ----

export interface RobberyResult {
  npc: NPCInstance;
  soldierCost: number;
  reputationCost: number;
  resourcesGained: { resource: string; amount: number };
}

export function robCaravan(
  npc: NPCInstance,
  currentEpoch: number
): RobberyResult {
  return {
    npc: {
      ...npc,
      metadata: {
        ...npc.metadata,
        reroutedUntilEpoch: currentEpoch + 3,
      },
    },
    soldierCost: 1,
    reputationCost: 20,
    resourcesGained: { resource: "production", amount: 6 },
  };
}

// ---- Recluse Friendship ----

export function recordCulturalExchange(
  npc: NPCInstance,
  isConsecutive: boolean
): NPCInstance {
  const current = (npc.metadata.consecutiveCulturalExchanges as number) ?? 0;
  return {
    ...npc,
    metadata: {
      ...npc.metadata,
      consecutiveCulturalExchanges: isConsecutive ? current + 1 : 1,
    },
  };
}

// ---- Sanctuary Conquest Penalty ----

export const SANCTUARY_CONQUEST_CI_PENALTY = -10;

// ---- Create Default NPCs ----

export function createDefaultRome(gameId: string): NPCInstance {
  return {
    id: `npc_rome_${gameId}`,
    gameId,
    archetype: "colossus",
    name: "Rome",
    stage: "dormant",
    subZoneIds: [], // DM assigns Mediterranean sub-zones
    metadata: {},
  };
}

export function createDefaultMongolHorde(gameId: string): NPCInstance {
  return {
    id: `npc_mongol_${gameId}`,
    gameId,
    archetype: "horde",
    name: "Mongol Horde",
    stage: "dormant",
    subZoneIds: [], // DM assigns Central Asia sub-zones
    metadata: {},
  };
}
