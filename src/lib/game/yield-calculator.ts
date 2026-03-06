// ============================================
// Yield Calculation Engine (Decision 37, 78)
// Yield = Base × Justification × d20 × Modifiers
// ============================================

export interface YieldInputs {
  epoch: number;
  justificationMultiplier: number;  // 0.5–2.0
  d20Modifier: number;             // 0.5–1.5
  populationCurrent: number;
  populationBase: number;
  regionBonusApplies: boolean;      // is this the bonus resource for team's region?
  regionBonusAmount: number;        // typically 0.1–0.15
  techModifiers: number;            // cumulative from tech tree
  warExhaustionLevel: number;       // 0, 1, 2
  isInDarkAge: boolean;
  depletionPenalty: number;         // 0.0 or 0.25 from depletion
}

/**
 * Base yield scales with epoch progression
 */
export function getBaseYield(epoch: number): number {
  if (epoch <= 3)  return 8;
  if (epoch <= 7)  return 10;
  if (epoch <= 11) return 12;
  return 15;
}

/**
 * Map a d20 roll (1-20) to a yield modifier
 * Decision 33 roll distribution
 */
export function d20RollToModifier(roll: number): number {
  if (roll >= 9 && roll <= 10) return 1.5;   // extremely positive
  if (roll >= 1 && roll <= 8)  return 1.25;  // moderate positive
  if (roll >= 19)              return 0.5;   // extremely negative
  if (roll >= 11)              return 0.75;  // moderate negative
  return 1.0;
}

/**
 * Population modifier: slight bonus/penalty based on pop ratio
 */
export function getPopulationModifier(current: number, base: number): number {
  if (base <= 0) return 1.0;
  return 1 + ((current / base) - 1) * 0.1;
}

/**
 * War exhaustion penalty (Decision 65)
 */
export function getWarExhaustionPenalty(level: number): number {
  if (level >= 2) return 0.30;  // -30%
  if (level >= 1) return 0.15;  // -15%
  return 0;
}

/**
 * Calculate total yield for a round
 */
export function calculateYield(inputs: YieldInputs): number {
  const base = getBaseYield(inputs.epoch);

  // Start with base
  let yield_ = base;

  // Apply justification multiplier (0.5x – 2.0x)
  yield_ *= inputs.justificationMultiplier;

  // Apply d20 modifier (0.5x – 1.5x)
  yield_ *= inputs.d20Modifier;

  // Population modifier
  const popMod = getPopulationModifier(inputs.populationCurrent, inputs.populationBase);
  yield_ *= popMod;

  // Region bonus (if applicable)
  if (inputs.regionBonusApplies) {
    yield_ *= (1 + inputs.regionBonusAmount);
  }

  // Tech modifiers (cumulative percentage)
  yield_ *= (1 + inputs.techModifiers);

  // War exhaustion penalty
  const warPenalty = getWarExhaustionPenalty(inputs.warExhaustionLevel);
  yield_ *= (1 - warPenalty);

  // Dark Ages: -50% yield
  if (inputs.isInDarkAge) {
    yield_ *= 0.5;
  }

  // Sub-zone depletion penalty
  yield_ *= (1 - inputs.depletionPenalty);

  // Floor at 1 (never zero)
  return Math.max(1, Math.round(yield_));
}

/**
 * The full yield result including breakdown
 */
export interface YieldBreakdown {
  baseYield: number;
  justificationMultiplier: number;
  d20Modifier: number;
  populationModifier: number;
  regionBonus: number;
  techBonus: number;
  warPenalty: number;
  darkAgePenalty: number;
  depletionPenalty: number;
  finalYield: number;
}

/**
 * Calculate yield with full breakdown for UI display
 */
export function calculateYieldWithBreakdown(inputs: YieldInputs): YieldBreakdown {
  const base = getBaseYield(inputs.epoch);
  const popMod = getPopulationModifier(inputs.populationCurrent, inputs.populationBase);
  const warPenalty = getWarExhaustionPenalty(inputs.warExhaustionLevel);
  const regionBonus = inputs.regionBonusApplies ? inputs.regionBonusAmount : 0;
  const darkAgePenalty = inputs.isInDarkAge ? 0.5 : 0;

  return {
    baseYield: base,
    justificationMultiplier: inputs.justificationMultiplier,
    d20Modifier: inputs.d20Modifier,
    populationModifier: Math.round(popMod * 100) / 100,
    regionBonus,
    techBonus: inputs.techModifiers,
    warPenalty,
    darkAgePenalty,
    depletionPenalty: inputs.depletionPenalty,
    finalYield: calculateYield(inputs),
  };
}
