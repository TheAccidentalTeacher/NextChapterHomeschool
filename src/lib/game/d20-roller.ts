// ============================================
// ClassCiv d20 Roller
// Decision 33: Roll d20 independently for each team
// once per class day at a random round.
// ============================================

import { rollD20Event, type EventDefinition } from "./event-deck";

export interface D20RollResult {
  teamId: string;
  roll: number;
  event: EventDefinition | null;
  isCoastal: boolean;
}

/**
 * Generate a random d20 roll (1-20)
 */
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Roll d20 for a single team and resolve the event
 */
export function rollForTeam(
  teamId: string,
  isCoastal: boolean
): D20RollResult {
  const roll = rollD20();
  const event = rollD20Event(roll, isCoastal);
  return { teamId, roll, event, isCoastal };
}

/**
 * Roll d20 for ALL teams in one batch
 * Returns array of roll results
 */
export function rollForAllTeams(
  teams: { id: string; isCoastal: boolean }[]
): D20RollResult[] {
  return teams.map((team) => rollForTeam(team.id, team.isCoastal));
}

/**
 * Pick a random round index for when the d20 event fires
 * Returns index 0-3 (EXPAND, BUILD, RESOLVE, DEFINE)
 */
export function pickRandomRound(): number {
  return Math.floor(Math.random() * 4);
}

/**
 * Format a d20 roll result for display
 */
export function formatRollResult(result: D20RollResult): string {
  if (!result.event) {
    return `🎲 Rolled ${result.roll} — No event triggered.`;
  }
  return `🎲 Rolled ${result.roll} — ${result.event.emoji} ${result.event.name}: ${result.event.description}`;
}
