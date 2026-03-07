// ============================================
// ClassCiv d20 Event Deck
// Decision 33, 92: Random events per class day
// Roll distribution:
//   1-8:   moderate positive
//   9-10:  extreme positive
//   11-18: moderate negative
//   19-20: extreme negative
// Floor rule: No event eliminates a civilization.
// ============================================

export type EventSeverity =
  | "moderate_positive"
  | "extreme_positive"
  | "moderate_negative"
  | "extreme_negative";

export interface EventDefinition {
  id: string;
  name: string;
  emoji: string;
  flavorText: string;
  description: string;
  severity: EventSeverity;
  rollRange: [number, number]; // inclusive
  coastalOnly: boolean;
  /** Resource impacts: positive = gain, negative = loss */
  resourceImpact: Partial<Record<string, number>>;
  /** Asset keys targeted for destruction */
  assetTargets: string[];
  /** Tech/building keys that mitigate this event */
  mitigations: string[];
  /** Population impact */
  populationImpact: number;
}

export const EVENT_DECK: EventDefinition[] = [
  // ---- MODERATE POSITIVE (1-8) ----
  {
    id: "trade_caravan",
    name: "Trade Caravan Arrives",
    emoji: "🤝",
    flavorText: "A line of pack animals appears on the horizon, laden with goods from distant lands.",
    description: "Trade one surplus resource for one needed resource.",
    severity: "moderate_positive",
    rollRange: [1, 2],
    coastalOnly: false,
    resourceImpact: { production: 10, reach: 5 },
    assetTargets: [],
    mitigations: [],
    populationImpact: 0,
  },
  {
    id: "ancient_ruins",
    name: "Ancient Ruins Found",
    emoji: "📜",
    flavorText: "Scouts stumble upon crumbling stone pillars covered in strange glyphs...",
    description: "Extra Legacy, Production, or free tech reveal.",
    severity: "moderate_positive",
    rollRange: [3, 4],
    coastalOnly: false,
    resourceImpact: { legacy: 8, production: 5 },
    assetTargets: [],
    mitigations: [],
    populationImpact: 0,
  },
  {
    id: "mountain_pass",
    name: "Mountain Pass Discovered",
    emoji: "🏔️",
    flavorText: "A narrow trail winds upward through the rock face—there's a way through!",
    description: "First to reach = Scout reveals +2 additional sub-zones permanently.",
    severity: "moderate_positive",
    rollRange: [5, 6],
    coastalOnly: false,
    resourceImpact: { reach: 8 },
    assetTargets: [],
    mitigations: [],
    populationImpact: 0,
  },
  {
    id: "favorable_weather",
    name: "Favorable Weather",
    emoji: "☀️",
    flavorText: "Warm rains come at precisely the right moment. The fields flourish.",
    description: "Food bonus from excellent growing conditions.",
    severity: "moderate_positive",
    rollRange: [7, 8],
    coastalOnly: false,
    resourceImpact: { food: 12 },
    assetTargets: [],
    mitigations: [],
    populationImpact: 0,
  },

  // ---- EXTREME POSITIVE (9-10) ----
  {
    id: "great_person",
    name: "Great Person Born",
    emoji: "🌟",
    flavorText: "A child prodigy emerges in your civilization—their talents are already legendary.",
    description: "Bonus to Legacy, CI, or Resilience.",
    severity: "extreme_positive",
    rollRange: [9, 9],
    coastalOnly: false,
    resourceImpact: { legacy: 15, resilience: 10 },
    assetTargets: [],
    mitigations: [],
    populationImpact: 1,
  },
  {
    id: "golden_age",
    name: "Golden Age",
    emoji: "✨",
    flavorText: "Art, science, and trade all flourish simultaneously. This is your civilization's finest hour.",
    description: "All resources boosted for this epoch.",
    severity: "extreme_positive",
    rollRange: [10, 10],
    coastalOnly: false,
    resourceImpact: { production: 10, reach: 10, legacy: 10, resilience: 10, food: 10 },
    assetTargets: [],
    mitigations: [],
    populationImpact: 0,
  },

  // ---- MODERATE NEGATIVE (11-18) ----
  {
    id: "drought",
    name: "Drought",
    emoji: "🌧️",
    flavorText: "The wells run dry. Dust swirls where crops once grew.",
    description: "−30 Food. Mitigated by Aqueduct.",
    severity: "moderate_negative",
    rollRange: [11, 12],
    coastalOnly: false,
    resourceImpact: { food: -30 },
    assetTargets: [],
    mitigations: ["aqueduct"],
    populationImpact: 0,
  },
  {
    id: "dysentery",
    name: "Dysentery",
    emoji: "🤒",
    flavorText: "Contaminated water spreads illness through the settlements.",
    description: "−1 Population, consume Medicine supply. Mitigated by Aqueduct.",
    severity: "moderate_negative",
    rollRange: [13, 13],
    coastalOnly: false,
    resourceImpact: {},
    assetTargets: ["medicine"],
    mitigations: ["aqueduct"],
    populationImpact: -1,
  },
  {
    id: "river_crossing",
    name: "River Crossing Disaster",
    emoji: "🌊",
    flavorText: "The river is swollen and fast. The crossing will not be easy.",
    description: "Halt EXPAND until next round. 50/50 ford roll.",
    severity: "moderate_negative",
    rollRange: [14, 14],
    coastalOnly: false,
    resourceImpact: { reach: -8 },
    assetTargets: [],
    mitigations: [],
    populationImpact: 0,
  },
  {
    id: "storm_destroys_farm",
    name: "Storm Destroys Farm",
    emoji: "🌪️",
    flavorText: "Thunder cracks the sky open. Lightning splits your best farmland.",
    description: "One Farm removed. Rebuild required.",
    severity: "moderate_negative",
    rollRange: [15, 15],
    coastalOnly: false,
    resourceImpact: {},
    assetTargets: ["farm"],
    mitigations: [],
    populationImpact: 0,
  },
  {
    id: "raid",
    name: "Raid",
    emoji: "🏹",
    flavorText: "Riders appear without warning, torches blazing. They want tribute—or blood.",
    description: "Lose Soldiers or pay 50 Production tribute. Mitigated by Barracks/Walls.",
    severity: "moderate_negative",
    rollRange: [16, 17],
    coastalOnly: false,
    resourceImpact: { production: -25 },
    assetTargets: ["soldier"],
    mitigations: ["barracks", "walls"],
    populationImpact: 0,
  },
  {
    id: "piracy",
    name: "Piracy",
    emoji: "🏴‍☠️",
    flavorText: "Black sails on the horizon. Your coastal trade routes are under attack.",
    description: "−15% Reach bank. Coastal teams only.",
    severity: "moderate_negative",
    rollRange: [18, 18],
    coastalOnly: true,
    resourceImpact: {}, // percentage-based, applied in resolver
    assetTargets: [],
    mitigations: ["walls"],
    populationImpact: 0,
  },

  // ---- EXTREME NEGATIVE (19-20) ----
  {
    id: "plague",
    name: "Plague",
    emoji: "☠️",
    flavorText: "The sickness spreads faster than fear. No settlement is spared.",
    description: "ALL teams lose Population + consume Medicine.",
    severity: "extreme_negative",
    rollRange: [19, 19],
    coastalOnly: false,
    resourceImpact: {},
    assetTargets: ["medicine"],
    mitigations: ["aqueduct"],
    populationImpact: -2,
  },
  {
    id: "pirate_blockade",
    name: "Pirate Blockade",
    emoji: "🏴‍☠️",
    flavorText: "An armada of pirate vessels seals the harbor. No ships in or out.",
    description: "Sea-route Trade Agreements suspended 1 epoch. Coastal only.",
    severity: "extreme_negative",
    rollRange: [20, 20],
    coastalOnly: true,
    resourceImpact: {},
    assetTargets: [],
    mitigations: ["walls"],
    populationImpact: 0,
  },
];

/**
 * Roll a d20 and return the matching event
 */
export function rollD20Event(
  roll: number,
  isCoastal: boolean
): EventDefinition | null {
  // Find events matching the roll
  const candidates = EVENT_DECK.filter((e) => {
    if (roll < e.rollRange[0] || roll > e.rollRange[1]) return false;
    if (e.coastalOnly && !isCoastal) return false;
    return true;
  });

  if (candidates.length === 0) {
    // If coastal-only event missed, find a non-coastal fallback in range
    const fallback = EVENT_DECK.filter(
      (e) =>
        roll >= e.rollRange[0] &&
        roll <= e.rollRange[1] &&
        !e.coastalOnly
    );
    return fallback[0] ?? null;
  }

  return candidates[0];
}

/**
 * Get severity from a d20 roll number
 */
export function getSeverityFromRoll(roll: number): EventSeverity {
  if (roll >= 1 && roll <= 8) return "moderate_positive";
  if (roll >= 9 && roll <= 10) return "extreme_positive";
  if (roll >= 11 && roll <= 18) return "moderate_negative";
  return "extreme_negative"; // 19-20
}

/**
 * Get severity display info
 */
export function getSeverityDisplay(severity: EventSeverity): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (severity) {
    case "moderate_positive":
      return { label: "Favorable", color: "text-green-400", bgColor: "bg-green-900/20" };
    case "extreme_positive":
      return { label: "Extraordinary!", color: "text-yellow-400", bgColor: "bg-yellow-900/20" };
    case "moderate_negative":
      return { label: "Unfortunate", color: "text-orange-400", bgColor: "bg-orange-900/20" };
    case "extreme_negative":
      return { label: "Catastrophic!", color: "text-red-400", bgColor: "bg-red-900/20" };
  }
}
