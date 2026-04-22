// ============================================
// ClassCiv Battle Resolver — DEFEND → Battle Round
// Decision 59: Pre-battle de-escalation, strategy +
// d20 + modifiers, territory transfer
// ============================================

export interface BattleParticipant {
  teamId: string;
  teamName: string;
  soldiers: number;
  barracks: boolean;
  walls: boolean;
  d20Roll: number;
  justificationMultiplier: number; // 0.5-2.0 from DM
  isAttacker: boolean;
}

export interface BattleResult {
  winnerId: string;
  loserId: string;
  winnerScore: number;
  loserScore: number;
  scoreDifferential: number;       // |winner - loser| — consumed by sub-zone transfer + vassalage offer logic
  resilienceLoss: number;          // loser loses this
  soldiersLost: number;            // loser loses 1-2 soldiers
  subZoneTransferred: boolean;     // true if differential >= 10 — caller still enforces F4 (never take last sub-zone)
  offerVassalage: boolean;         // true if differential >= 20 — caller presents vassalage option to loser
  allySupport: {                   // Realms v1.5 alliance combat support (Q6, F9)
    allyTeamId: string | null;
    soldiersCommitted: number;
    contributed: boolean;          // false if ally had 0 soldiers available
  } | null;
  breakdown: {
    label: string;
    attackerValue: number;
    defenderValue: number;
  }[];
}

/**
 * Calculate battle score for one participant.
 */
function calculateScore(p: BattleParticipant): { score: number; breakdown: { label: string; value: number }[] } {
  const breakdown: { label: string; value: number }[] = [];

  // Base: soldiers
  const soldierScore = p.soldiers * 3;
  breakdown.push({ label: "Soldiers", value: soldierScore });

  // Barracks bonus (attacker only)
  const barracksBonus = p.isAttacker && p.barracks ? 5 : 0;
  if (barracksBonus) breakdown.push({ label: "Barracks (attacker)", value: barracksBonus });

  // Walls bonus (defender only)
  const wallsBonus = !p.isAttacker && p.walls ? 8 : 0;
  if (wallsBonus) breakdown.push({ label: "Walls (defender)", value: wallsBonus });

  // d20 roll
  breakdown.push({ label: "d20 Roll", value: p.d20Roll });

  // Justification multiplier
  const baseScore = soldierScore + barracksBonus + wallsBonus + p.d20Roll;
  const finalScore = Math.round(baseScore * p.justificationMultiplier);
  breakdown.push({ label: `Justification (×${p.justificationMultiplier})`, value: finalScore - baseScore });

  return { score: finalScore, breakdown };
}

/**
 * Resolve a battle between attacker and defender.
 * Optional ally participant (Realms v1.5 Q6 alliance combat support):
 *   - Ally contributes declared `soldiers` (subset of their garrison) to the defender's score.
 *   - If ally has 0 soldiers, they are marked as "unable to assist" and contribute nothing.
 *   - Ally's d20 roll, barracks, walls, and justification multiplier all apply — BUT only if
 *     soldiers > 0. Otherwise the ally is skipped entirely.
 *   - The ally is always assumed to support the defender (classic "alliance defense").
 */
export function resolveBattle(
  attacker: BattleParticipant,
  defender: BattleParticipant,
  ally?: BattleParticipant
): BattleResult {
  const attackResult = calculateScore(attacker);
  const defendResult = calculateScore(defender);

  // Alliance combat support — ally contributes to defender's side (Realms §4.5)
  let allyResult: { score: number; breakdown: { label: string; value: number }[] } | null = null;
  let allyContributed = false;
  if (ally && ally.soldiers > 0) {
    allyResult = calculateScore(ally);
    allyContributed = true;
  }

  const defenderTotal = defendResult.score + (allyResult?.score ?? 0);
  const attackerWins = attackResult.score > defenderTotal;
  const winnerId = attackerWins ? attacker.teamId : defender.teamId;
  const loserId = attackerWins ? defender.teamId : attacker.teamId;

  // Loser consequences (use combined defender+ally score for differential)
  const scoreDiff = Math.abs(attackResult.score - defenderTotal);
  const soldiersLost = scoreDiff > 15 ? 2 : 1;
  const resilienceLoss = 10 + Math.min(20, scoreDiff);
  const subZoneTransferred = scoreDiff >= 10;
  const offerVassalage = scoreDiff >= 20;

  // Build combined breakdown (ally column merged into defender for display simplicity)
  const breakdown = attackResult.breakdown.map((b, i) => ({
    label: b.label,
    attackerValue: b.value,
    defenderValue:
      (defendResult.breakdown[i]?.value ?? 0) +
      (allyResult?.breakdown[i]?.value ?? 0),
  }));

  return {
    winnerId,
    loserId,
    winnerScore: attackerWins ? attackResult.score : defenderTotal,
    loserScore: attackerWins ? defenderTotal : attackResult.score,
    scoreDifferential: scoreDiff,
    resilienceLoss,
    soldiersLost,
    subZoneTransferred,
    offerVassalage,
    allySupport: ally
      ? {
          allyTeamId: ally.teamId,
          soldiersCommitted: ally.soldiers,
          contributed: allyContributed,
        }
      : null,
    breakdown,
  };
}

/**
 * Check if de-escalation was accepted.
 */
export interface DeEscalationOffer {
  fromTeamId: string;
  toTeamId: string;
  terms: string;
  accepted: boolean | null; // null = pending
}

/**
 * If de-escalation is accepted, both teams get a resilience bonus.
 */
export function getDeEscalationBonus(): { resilience: number } {
  return { resilience: 5 };
}

/**
 * Get war exhaustion increase from a battle.
 */
export function getBattleWarExhaustion(participated: boolean, won: boolean): number {
  if (!participated) return 0;
  return won ? 5 : 10;
}
