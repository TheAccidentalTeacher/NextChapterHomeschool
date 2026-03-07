// ============================================
// ClassCiv Research Engine
// Decision 62: One active research per team per epoch
// Legacy investment fills progress bar.
// ============================================

import { getTech, canResearch, TECH_TREE, type TechDefinition } from "./tech-tree";

export interface ResearchState {
  activeResearchId: string | null;
  legacyInvested: number;           // toward active research
  legacyCostRequired: number;       // total needed
  completedTechIds: string[];
  progressPercent: number;
}

/**
 * Check if a team can select a tech for research
 */
export function canSelectResearch(
  techId: string,
  completedTechIds: string[],
  activeResearchId: string | null
): { allowed: boolean; reason: string } {
  const tech = getTech(techId);
  if (!tech) {
    return { allowed: false, reason: "Unknown tech" };
  }

  if (completedTechIds.includes(techId)) {
    return { allowed: false, reason: "Already researched" };
  }

  if (activeResearchId && activeResearchId !== techId) {
    return { allowed: false, reason: "Already researching another tech this epoch" };
  }

  if (!canResearch(techId, completedTechIds)) {
    const missing = tech.prerequisites.filter(
      (p) => !completedTechIds.includes(p)
    );
    const missingNames = missing
      .map((id) => getTech(id)?.name ?? id)
      .join(", ");
    return {
      allowed: false,
      reason: `Missing prerequisites: ${missingNames}`,
    };
  }

  return { allowed: true, reason: "OK" };
}

/**
 * Apply Legacy investment to active research.
 * Returns whether the tech completed.
 */
export function investLegacy(
  state: ResearchState,
  amount: number
): {
  newInvested: number;
  completed: boolean;
  overflow: number;
} {
  if (!state.activeResearchId) {
    return { newInvested: 0, completed: false, overflow: amount };
  }

  const newInvested = state.legacyInvested + amount;
  const completed = newInvested >= state.legacyCostRequired;
  const overflow = completed
    ? Math.max(0, newInvested - state.legacyCostRequired)
    : 0;

  return {
    newInvested: completed ? state.legacyCostRequired : newInvested,
    completed,
    overflow,
  };
}

/**
 * Get what a tech unlocks in terms of game mechanics
 */
export function getTechUnlocks(techId: string): string[] {
  const tech = getTech(techId);
  return tech?.unlocks ?? [];
}

/**
 * Check if a specific feature is unlocked by the team's tech state
 */
export function isFeatureUnlocked(
  featureKey: string,
  completedTechIds: string[]
): boolean {
  // Map features to required techs
  const FEATURE_TECHS: Record<string, string> = {
    // Buildings
    granary: "animal_husbandry",
    library: "writing",
    market: "currency",
    aqueduct: "construction",
    walls_discount: "bronze_working",
    // Units
    swordsman: "bronze_working",
    archer: "archery",
    cavalry: "horseback_riding",
    catapult: "mathematics",
    knight: "chivalry",
    musketeer: "gunpowder",
    // Trade
    food_trade: "pottery",
    trade_agreements: "trade_routes",
    sea_routes: "sailing",
    // Governance
    government_choices: "philosophy",
    vassal_system: "feudalism",
    diplomatic_corps: "diplomatic_corps",
    // Culture
    codex: "writing",
    festival: "drama_and_poetry",
    ci_spread_bonus: "drama_and_poetry",
  };

  const requiredTech = FEATURE_TECHS[featureKey];
  if (!requiredTech) return true; // no gate = unlocked by default
  return completedTechIds.includes(requiredTech);
}

/**
 * Get the highest tier reached by a team
 */
export function getHighestTier(completedTechIds: string[]): number {
  let highest = 0;
  for (const techId of completedTechIds) {
    const tech = getTech(techId);
    if (tech && tech.tier > highest) {
      highest = tech.tier;
    }
  }
  return highest;
}
