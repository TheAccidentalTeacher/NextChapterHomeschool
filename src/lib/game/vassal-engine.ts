// ============================================
// ClassCiv Vassal Engine
// Decision 63: Feudalism tech unlocks vassal mechanic
// 20% tribute, war obligation, revolt
// ============================================

export interface VassalBond {
  id: string;
  liegeTeamId: string;
  vassalTeamId: string;
  startedEpoch: number;
  tributeRate: number;    // 0.2 = 20%
  warRefusals: number;    // 2 refusals → revolt countdown
  revoltCountdown: number | null; // epochs until auto-revolt
  isActive: boolean;
}

/**
 * Calculate tribute: 20% of vassal's earned resources route to liege.
 */
export function calculateTribute(
  vassalEarned: Record<string, number>,
  tributeRate: number = 0.2
): { tribute: Record<string, number>; remaining: Record<string, number> } {
  const tribute: Record<string, number> = {};
  const remaining: Record<string, number> = {};

  for (const [resource, amount] of Object.entries(vassalEarned)) {
    const tributeAmount = Math.floor(amount * tributeRate);
    tribute[resource] = tributeAmount;
    remaining[resource] = amount - tributeAmount;
  }

  return { tribute, remaining };
}

/**
 * Handle war obligation refusal.
 * 2 refusals → auto-revolt countdown (2 epochs).
 */
export function handleWarRefusal(bond: VassalBond): {
  newRefusals: number;
  resiliencePenalty: number;
  revoltCountdown: number | null;
} {
  const newRefusals = bond.warRefusals + 1;
  const resiliencePenalty = 25; // costs 25 Resilience to refuse

  let revoltCountdown: number | null = bond.revoltCountdown;
  if (newRefusals >= 2) {
    revoltCountdown = 2; // 2 epochs until auto-revolt
  }

  return { newRefusals, resiliencePenalty, revoltCountdown };
}

/**
 * Check if vassal is auto-freed due to liege losing home sub-zone.
 */
export function checkConquestFreedom(
  liegeHomeSubZoneOwnerId: string | null,
  liegeTeamId: string
): boolean {
  return liegeHomeSubZoneOwnerId !== liegeTeamId;
}

/**
 * Calculate revolt cost for the vassal.
 */
export function getRevoltCost(): { resilience: number } {
  return { resilience: 30 };
}

/**
 * Check if a team can propose vassalage (requires Feudalism tech).
 */
export function canProposeVassalage(
  completedTechIds: string[],
  existingBonds: VassalBond[],
  proposerTeamId: string,
  targetTeamId: string
): { allowed: boolean; reason: string } {
  if (!completedTechIds.includes("feudalism")) {
    return { allowed: false, reason: "Feudalism tech required" };
  }

  // No vassal-of-a-vassal (flat only)
  const isProposerVassal = existingBonds.some(
    (b) => b.vassalTeamId === proposerTeamId && b.isActive
  );
  if (isProposerVassal) {
    return { allowed: false, reason: "Vassals cannot take vassals — flat structure only" };
  }

  const isTargetAlreadyVassal = existingBonds.some(
    (b) => b.vassalTeamId === targetTeamId && b.isActive
  );
  if (isTargetAlreadyVassal) {
    return { allowed: false, reason: "Target is already a vassal of another team" };
  }

  return { allowed: true, reason: "OK" };
}
