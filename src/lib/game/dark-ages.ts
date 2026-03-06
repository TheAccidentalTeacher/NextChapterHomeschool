// ============================================
// Dark Ages System (Decision 75)
// No civ death. Crisis → Dark Ages: reduced yields, recoverable.
// ============================================

export interface DarkAgesCheckInput {
  populationCurrent: number;
  resilienceCurrent: number;
  warExhaustion: number;
  hasFamineOrPlagueThisEpoch: boolean;
}

export interface DarkAgesEffects {
  yieldPenalty: number;           // 0.5 = -50%
  expandLocked: boolean;
  tradeRestricted: boolean;      // spot trade only
  showBanner: boolean;
  recapTone: "crisis";
}

export interface DarkAgesRecoveryCheck {
  populationCurrent: number;
  resilienceCurrent: number;
}

// Trigger thresholds
const POP_THRESHOLD = 3;
const RESILIENCE_THRESHOLD = 0;
const WAR_EXHAUSTION_THRESHOLD = 75;

/**
 * Check if Dark Ages should trigger
 * ALL conditions must be true simultaneously
 */
export function shouldTriggerDarkAges(input: DarkAgesCheckInput): boolean {
  const popTrigger = input.populationCurrent <= POP_THRESHOLD;
  const resTrigger = input.resilienceCurrent <= RESILIENCE_THRESHOLD;
  const warOrPlague =
    input.warExhaustion >= WAR_EXHAUSTION_THRESHOLD ||
    input.hasFamineOrPlagueThisEpoch;

  return popTrigger && resTrigger && warOrPlague;
}

/**
 * Check if Dark Ages can be recovered from
 */
export function canRecoverFromDarkAges(check: DarkAgesRecoveryCheck): boolean {
  return check.populationCurrent >= 5 && check.resilienceCurrent >= 10;
}

/**
 * Get Dark Ages effects (applied while in Dark Ages)
 */
export function getDarkAgesEffects(): DarkAgesEffects {
  return {
    yieldPenalty: 0.5,          // -50% all yields
    expandLocked: true,         // EXPAND submissions locked
    tradeRestricted: true,      // spot trade only
    showBanner: true,           // projector banner
    recapTone: "crisis",        // Haiku recap in crisis language
  };
}

/**
 * Recovery progress percentage (0–100)
 */
export function getRecoveryProgress(
  populationCurrent: number,
  resilienceCurrent: number
): number {
  const popProgress = Math.min(100, (populationCurrent / 5) * 100);
  const resProgress = Math.min(100, (resilienceCurrent / 10) * 100);
  return Math.round((popProgress + resProgress) / 2);
}
