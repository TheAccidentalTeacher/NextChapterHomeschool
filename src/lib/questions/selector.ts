// ============================================
// Question Selector (Decision 27)
// Selects best-matching question from bank
// ============================================

import type { QuestionBankEntry, TeamStateSnapshot } from "./types";

/**
 * Score how well a question matches the team's current state.
 * Higher score = better match.
 */
function scoreQuestion(q: QuestionBankEntry, state: TeamStateSnapshot): number {
  let score = 0;

  // Round must match (required)
  if (q.round !== state.round) return -1;

  // Role must match (required)
  if (q.leadRole !== state.role) return -1;

  // Epoch range match (required)
  if (state.epoch < q.epochMin || state.epoch > q.epochMax) return -1;

  // Terrain match (bonus)
  if (q.terrainConditions && q.terrainConditions.length > 0) {
    const overlap = q.terrainConditions.filter((t) =>
      state.terrainTypes.includes(t)
    );
    if (overlap.length > 0) {
      score += overlap.length * 5;
    } else {
      score -= 2; // slight penalty for terrain mismatch
    }
  }

  // Tech tier match (bonus if met, penalty if not)
  if (q.techTierMin !== undefined) {
    if (state.techTier >= q.techTierMin) {
      score += 3;
    } else {
      return -1; // hard gate
    }
  }

  // Civ state tags match (bonus)
  if (q.civStateTags && q.civStateTags.length > 0) {
    const stateFlags = buildStateFlags(state);
    const tagMatch = q.civStateTags.filter((tag) => stateFlags.includes(tag));
    score += tagMatch.length * 4;
  }

  // Prefer questions in the middle of their epoch range (more specific)
  const epochRange = q.epochMax - q.epochMin;
  if (epochRange <= 3) score += 3;  // narrow range = more specific
  if (epochRange <= 1) score += 2;  // very specific

  return score;
}

/**
 * Build state flags from team state for tag matching
 */
function buildStateFlags(state: TeamStateSnapshot): string[] {
  const flags: string[] = [];

  if (state.isInDarkAge) flags.push("dark_age");
  if (state.warExhaustionLevel >= 2) flags.push("war_exhausted");
  if (state.warExhaustionLevel >= 1) flags.push("war_tension");
  if (state.isContactOpen) flags.push("contact_open");
  if (state.population <= 3) flags.push("low_population");
  if (state.population >= 10) flags.push("high_population");
  if (state.territoryCount >= 6) flags.push("expansive");
  if (state.territoryCount <= 2) flags.push("small_territory");

  // Resource-based flags
  const res = state.resourceLevels;
  if ((res.food ?? 0) <= 0) flags.push("famine_risk");
  if ((res.production ?? 0) >= 50) flags.push("wealthy");
  if ((res.resilience ?? 0) <= 5) flags.push("vulnerable");

  // Building flags
  if (state.hasSpecificBuildings.includes("farm")) flags.push("has_farm");
  if (state.hasSpecificBuildings.includes("market")) flags.push("has_market");
  if (state.hasSpecificBuildings.includes("library")) flags.push("has_library");
  if (state.hasSpecificBuildings.includes("walls")) flags.push("has_walls");

  return flags;
}

/**
 * Select the best question from the bank for the given team state.
 * Returns null if no match found (flag for Haiku override).
 */
export function selectQuestion(
  bank: QuestionBankEntry[],
  state: TeamStateSnapshot
): QuestionBankEntry | null {
  const scored = bank
    .map((q) => ({ question: q, score: scoreQuestion(q, state) }))
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  // If top scores are tied, pick randomly among them for variety
  const topScore = scored[0].score;
  const topTied = scored.filter((s) => s.score === topScore);
  const pick = topTied[Math.floor(Math.random() * topTied.length)];

  return pick.question;
}

/**
 * Select multiple unique questions (for DM preview / testing)
 */
export function selectMultipleQuestions(
  bank: QuestionBankEntry[],
  state: TeamStateSnapshot,
  count: number
): QuestionBankEntry[] {
  const scored = bank
    .map((q) => ({ question: q, score: scoreQuestion(q, state) }))
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((s) => s.question);
}
