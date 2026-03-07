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
  resilienceLoss: number;          // loser loses this
  soldiersLost: number;            // loser loses 1-2 soldiers
  subZoneTransferred: boolean;
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
 */
export function resolveBattle(
  attacker: BattleParticipant,
  defender: BattleParticipant
): BattleResult {
  const attackResult = calculateScore(attacker);
  const defendResult = calculateScore(defender);

  const attackerWins = attackResult.score > defendResult.score;
  const winnerId = attackerWins ? attacker.teamId : defender.teamId;
  const loserId = attackerWins ? defender.teamId : attacker.teamId;

  // Loser consequences
  const scoreDiff = Math.abs(attackResult.score - defendResult.score);
  const soldiersLost = scoreDiff > 15 ? 2 : 1;
  const resilienceLoss = 10 + Math.min(20, scoreDiff);
  const subZoneTransferred = scoreDiff >= 10; // decisive victory transfers territory

  // Build combined breakdown
  const breakdown = attackResult.breakdown.map((b, i) => ({
    label: b.label,
    attackerValue: b.value,
    defenderValue: defendResult.breakdown[i]?.value ?? 0,
  }));

  return {
    winnerId,
    loserId,
    winnerScore: attackerWins ? attackResult.score : defendResult.score,
    loserScore: attackerWins ? defendResult.score : attackResult.score,
    resilienceLoss,
    soldiersLost,
    subZoneTransferred,
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
