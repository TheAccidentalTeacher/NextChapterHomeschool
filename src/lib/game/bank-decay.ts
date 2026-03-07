// ============================================
// Bank Decay Engine (Decision 38)
// 5% decay per epoch (calibrated for 30-epoch arc), Banking tech = 5% interest
// ============================================

export interface BankDecayInput {
  resourceType: string;
  bankAmount: number;
  hasBankingTech: boolean;   // Tier 5: no decay, +5% interest
}

export interface BankDecayResult {
  resourceType: string;
  previousAmount: number;
  newAmount: number;
  changeAmount: number;
  reason: string;
}

/**
 * Apply bank decay (or interest) to a resource bank total.
 * Standard: floor(bank * 0.95) → 5% decay (calibrated for 30-epoch arc)
 * Banking tech: floor(bank * 1.05) → 5% interest
 */
export function applyBankDecay(input: BankDecayInput): BankDecayResult {
  const { resourceType, bankAmount, hasBankingTech } = input;

  if (hasBankingTech) {
    const newAmount = Math.floor(bankAmount * 1.05);
    return {
      resourceType,
      previousAmount: bankAmount,
      newAmount,
      changeAmount: newAmount - bankAmount,
      reason: "Banking tech: +5% interest",
    };
  }

  const newAmount = Math.floor(bankAmount * 0.95);
  return {
    resourceType,
    previousAmount: bankAmount,
    newAmount,
    changeAmount: newAmount - bankAmount,
    reason: "Bank decay: -5% per epoch (calibrated for 30-epoch arc)",
  };
}

/**
 * Process bank decay for all resources of a team
 */
export function processTeamBankDecay(
  banks: { resourceType: string; amount: number }[],
  hasBankingTech: boolean
): BankDecayResult[] {
  return banks.map((b) =>
    applyBankDecay({
      resourceType: b.resourceType,
      bankAmount: b.amount,
      hasBankingTech,
    })
  );
}

/**
 * Calculate caravan theft amount (d20 event: stolen caravan)
 * Removes 1d6 banked resources from target
 */
export function calculateCaravanTheft(): number {
  return Math.floor(Math.random() * 6) + 1; // 1d6
}
