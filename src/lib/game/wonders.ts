// ============================================
// ClassCiv Wonder System Data Model
// Decision 36: 12 team-specific wonders
// Decision 40: 4-track progress, tiered milestones
// ============================================

export interface WonderDefinition {
  id: string;
  name: string;
  emoji: string;
  completionBonus: string;
  bonusKey: string;        // programmatic key for applying bonus
  description: string;
  historicalNote: string;
}

export interface WonderProgress {
  wonderId: string;
  teamId: string;
  constructionTrack: number;  // Production contributions → 0-100
  foundationTrack: number;    // Reach contributions → 0-100
  cultureTrack: number;       // Legacy contributions → 0-100
  fortificationTrack: number; // Resilience contributions → 0-100
  isComplete: boolean;
  milestones25: boolean;
  milestones50: boolean;
  milestones75: boolean;
}

export const WONDERS: WonderDefinition[] = [
  {
    id: "trans_alaska_pipeline",
    name: "Trans-Alaska Pipeline",
    emoji: "🛢️",
    completionBonus: "All trade routes double speed permanently",
    bonusKey: "trade_double_speed",
    description: "An engineering marvel spanning 800 miles of wilderness — your civilization masters the art of resource transport.",
    historicalNote: "The real pipeline moves 2 million barrels of oil daily across some of the harshest terrain on Earth.",
  },
  {
    id: "brooklyn_bridge",
    name: "Brooklyn Bridge",
    emoji: "🌉",
    completionBonus: "Diplomacy with ANY team regardless of contact state",
    bonusKey: "universal_diplomacy",
    description: "A bridge between worlds. Your diplomats can reach any civilization, contacted or not.",
    historicalNote: "The Brooklyn Bridge connected two independent cities and forever changed urban connectivity.",
  },
  {
    id: "grand_coulee_dam",
    name: "Grand Coulee Dam",
    emoji: "🏗️",
    completionBonus: "BUILD round production doubles every epoch",
    bonusKey: "production_doubles",
    description: "Harness the power of nature itself. Your builders work with doubled output from this epoch forward.",
    historicalNote: "The Grand Coulee Dam remains the largest power-producing facility in the United States.",
  },
  {
    id: "el_castillo",
    name: "El Castillo",
    emoji: "🏛️",
    completionBonus: "All DEFINE Knowledge gains double",
    bonusKey: "define_double",
    description: "A temple to knowledge. Every cultural and intellectual pursuit yields twice the insight.",
    historicalNote: "El Castillo at Chichén Itzá was designed so that during equinoxes, a shadow serpent descends its steps.",
  },
  {
    id: "machu_picchu",
    name: "Machu Picchu",
    emoji: "🏔️",
    completionBonus: "Immune to military attacks for 2 epochs",
    bonusKey: "military_immunity_2",
    description: "Hidden in the clouds, your civilization becomes untouchable — no army can reach you.",
    historicalNote: "Machu Picchu was never found by Spanish conquistadors and remained hidden for centuries.",
  },
  {
    id: "the_colosseum",
    name: "The Colosseum",
    emoji: "🏟️",
    completionBonus: "DEFEND rounds auto-resolve at minimum success",
    bonusKey: "defend_auto_success",
    description: "Your warriors' reputation precedes them. Enemies think twice before engaging.",
    historicalNote: "The Colosseum could hold 50,000 spectators and featured a complex underground staging area.",
  },
  {
    id: "stonehenge",
    name: "Stonehenge",
    emoji: "🗿",
    completionBonus: "Immune to all d20 negative events",
    bonusKey: "d20_immunity",
    description: "Ancient cosmic alignment protects your lands from misfortune.",
    historicalNote: "Stonehenge's precise astronomical alignments mystify archaeologists to this day.",
  },
  {
    id: "great_pyramid",
    name: "Great Pyramid",
    emoji: "🔺",
    completionBonus: "Wonder contributions cost half",
    bonusKey: "wonder_half_cost",
    description: "Your mastery of construction means future wonders require half the effort.",
    historicalNote: "The Great Pyramid of Giza was the tallest structure on Earth for over 3,800 years.",
  },
  {
    id: "great_zimbabwe",
    name: "Great Zimbabwe",
    emoji: "🏰",
    completionBonus: "All trade routes generate double resources",
    bonusKey: "trade_double_resources",
    description: "A center of commerce unmatched in history. Every trade fills your coffers twice.",
    historicalNote: "Great Zimbabwe was a major trading center controlling the gold and ivory routes of medieval Africa.",
  },
  {
    id: "trans_siberian_railway",
    name: "Trans-Siberian Railway",
    emoji: "🚂",
    completionBonus: "Territory expansion costs zero for 3 epochs",
    bonusKey: "free_expansion_3",
    description: "Rails connect your empire's farthest reaches — expansion costs nothing.",
    historicalNote: "The Trans-Siberian Railway spans 5,772 miles across 7 time zones.",
  },
  {
    id: "taj_mahal",
    name: "Taj Mahal",
    emoji: "🕌",
    completionBonus: "No team may declare war on you",
    bonusKey: "war_immunity",
    description: "A monument so beautiful the world agrees — no one shall destroy it.",
    historicalNote: "The Taj Mahal took 22 years and 20,000 workers to complete.",
  },
  {
    id: "floating_torii_gate",
    name: "Floating Torii Gate",
    emoji: "⛩️",
    completionBonus: "Full map fog of war cleared",
    bonusKey: "full_map_reveal",
    description: "The gate between worlds opens — all lands are revealed to your civilization.",
    historicalNote: "The Itsukushima Shrine's torii gate appears to float at high tide, marking the boundary between the spirit world and the physical world.",
  },
];

/**
 * Get a wonder by ID
 */
export function getWonder(id: string): WonderDefinition | undefined {
  return WONDERS.find((w) => w.id === id);
}

/**
 * Compute the overall completion percentage for a wonder.
 * All 4 tracks must be ≥ 50% for completion.
 */
export function getOverallProgress(progress: WonderProgress): number {
  return Math.round(
    (progress.constructionTrack +
      progress.foundationTrack +
      progress.cultureTrack +
      progress.fortificationTrack) /
      4
  );
}

/**
 * Check if a wonder is eligible for completion.
 * All 4 tracks must be ≥ 100 AND all ≥ 50.
 */
export function canCompleteWonder(progress: WonderProgress): boolean {
  return (
    progress.constructionTrack >= 100 &&
    progress.foundationTrack >= 100 &&
    progress.cultureTrack >= 100 &&
    progress.fortificationTrack >= 100
  );
}

/**
 * Check milestone thresholds (25%, 50%, 75%).
 * Returns which milestones are newly reached.
 */
export function checkMilestones(
  progress: WonderProgress
): { milestone25: boolean; milestone50: boolean; milestone75: boolean } {
  const overall = getOverallProgress(progress);
  return {
    milestone25: overall >= 25 && !progress.milestones25,
    milestone50: overall >= 50 && !progress.milestones50,
    milestone75: overall >= 75 && !progress.milestones75,
  };
}

/**
 * Resource type → wonder track mapping
 */
export type WonderTrack = "constructionTrack" | "foundationTrack" | "cultureTrack" | "fortificationTrack";

export function resourceToTrack(resourceType: string): WonderTrack | null {
  switch (resourceType) {
    case "production":
      return "constructionTrack";
    case "reach":
      return "foundationTrack";
    case "legacy":
      return "cultureTrack";
    case "resilience":
      return "fortificationTrack";
    default:
      return null;
  }
}

/**
 * Calculate the contribution amount after applying bonuses.
 * Great Pyramid bonus: contributions cost half.
 */
export function getContributionAmount(
  base: number,
  hasGreatPyramid: boolean
): number {
  return hasGreatPyramid ? Math.ceil(base * 2) : base;
}

/**
 * Default empty wonder progress
 */
export function createEmptyProgress(wonderId: string, teamId: string): WonderProgress {
  return {
    wonderId,
    teamId,
    constructionTrack: 0,
    foundationTrack: 0,
    cultureTrack: 0,
    fortificationTrack: 0,
    isComplete: false,
    milestones25: false,
    milestones50: false,
    milestones75: false,
  };
}
