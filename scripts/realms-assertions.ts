/**
 * Realms v1.5 Pass 7 — invariant assertions for simulate.ts / snapshot-check.ts
 *
 * Each assertion takes a Supabase client + gameId and returns AssertionResult.
 * Designed to be callable from simulate.ts (--assert flag), from
 * snapshot-check.ts, or standalone via:
 *
 *   npx tsx scripts/realms-assertions.ts <game_id>
 *
 * Ship-blockers covered: F4, F6, F9, F11, F18.
 * Polgara Guardrails covered: 1, 2, 4 (partial — 3 is UI-rendered, asserted in frontend test).
 * Decision B §4.6.2 covered: assertEpilogueGeneratedForEveryTeam (at game end only).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface AssertionResult {
  name: string;
  passed: boolean;
  violations: string[];
  notes?: string;
}

// ============================================================================
// Shared helpers
// ============================================================================

type MinimalTeam = {
  id: string;
  game_id: string;
  name: string;
  civilization_name: string | null;
  reputation_score: number | null;
  aggression_score: number | null;
};

async function loadTeams(sb: SupabaseClient, gameId: string): Promise<MinimalTeam[]> {
  const { data } = await sb
    .from("teams")
    .select("id, game_id, name, civilization_name, reputation_score, aggression_score")
    .eq("game_id", gameId);
  return data ?? [];
}

// ============================================================================
// F4 — Guardrail 1: engine never erases a team (no team ends with zero sub-zones)
// ============================================================================

export async function assertGuardrail1NeverErases(
  sb: SupabaseClient,
  gameId: string
): Promise<AssertionResult> {
  const teams = await loadTeams(sb, gameId);
  const { data: subZones } = await sb
    .from("sub_zones")
    .select("id, controlled_by_team_id")
    .eq("game_id", gameId);

  const ownedCount = new Map<string, number>();
  for (const sz of subZones ?? []) {
    if (sz.controlled_by_team_id) {
      ownedCount.set(sz.controlled_by_team_id, (ownedCount.get(sz.controlled_by_team_id) ?? 0) + 1);
    }
  }

  const violations: string[] = [];
  for (const t of teams) {
    const count = ownedCount.get(t.id) ?? 0;
    if (count === 0) {
      violations.push(`team ${t.civilization_name ?? t.name} (${t.id}) owns 0 sub-zones — erased from map`);
    }
  }

  return {
    name: "assertGuardrail1NeverErases",
    passed: violations.length === 0,
    violations,
    notes: "F4 — every team must own at least one sub-zone at all times. The battle engine enforces this via /battles/resolve.",
  };
}

// ============================================================================
// F6 — casus_belli_grants child-table integrity (multi-grant support)
// ============================================================================

export async function assertCasusBelliChildTableIntegrity(
  sb: SupabaseClient,
  gameId: string
): Promise<AssertionResult> {
  const { data } = await sb
    .from("casus_belli_grants")
    .select("id, holder_team_id, grantor_team_id, granted_epoch, expires_epoch, consumed")
    .limit(500);

  const violations: string[] = [];
  for (const row of data ?? []) {
    if (row.holder_team_id === row.grantor_team_id) {
      violations.push(`grant ${row.id} has holder == grantor`);
    }
    if (row.expires_epoch < row.granted_epoch) {
      violations.push(`grant ${row.id} expires_epoch < granted_epoch`);
    }
  }

  return {
    name: "assertCasusBelliChildTableIntegrity",
    passed: violations.length === 0,
    violations,
    notes: "F6 — multiple casus-belli grants per holder are supported by the child table.",
  };
}

// ============================================================================
// F9 — alliance-support is never zero-commit (no symbolic-only assist)
// ============================================================================

export async function assertAllianceMinSoldierCommit(
  sb: SupabaseClient,
  gameId: string
): Promise<AssertionResult> {
  // Scan game_events for battle_resolution rows; inspect metadata.battle_result.allySupport
  const { data } = await sb
    .from("game_events")
    .select("id, metadata")
    .eq("game_id", gameId)
    .eq("event_type", "battle_resolution")
    .limit(500);

  const violations: string[] = [];
  for (const evt of data ?? []) {
    const ally = evt.metadata?.battle_result?.allySupport;
    if (!ally) continue;
    const committed: number = ally.soldiersCommitted ?? 0;
    const contributed: boolean = ally.contributed ?? false;
    // It is valid for soldiersCommitted = 0 only when contributed = false AND
    // the ally was flagged "unable to assist" (no soldiers available).
    // If the battle logged soldiersCommitted = 0 with contributed = true, that
    // is an F9 violation — symbolic-only support slipped through.
    if (committed === 0 && contributed) {
      violations.push(`event ${evt.id} logged zero-commit ally that still 'contributed' = F9 violation`);
    }
  }

  return {
    name: "assertAllianceMinSoldierCommit",
    passed: violations.length === 0,
    violations,
    notes: "F9 — battle endpoint rejects zero-commit when ally has soldiers; contributed=true implies committed>=1.",
  };
}

// ============================================================================
// F11 — vassal_relationships duration minimum (end_epoch >= start_epoch + 3)
// ============================================================================

export async function assertVassalageDurationMinimum(
  sb: SupabaseClient,
  gameId: string
): Promise<AssertionResult> {
  const { data } = await sb
    .from("vassal_relationships")
    .select("id, start_epoch, end_epoch")
    .eq("game_id", gameId);

  const violations: string[] = [];
  for (const row of data ?? []) {
    if (row.end_epoch !== null && row.end_epoch < row.start_epoch + 3) {
      violations.push(
        `vassal_relationship ${row.id}: end_epoch=${row.end_epoch} < start_epoch+3=${row.start_epoch + 3}`
      );
    }
  }

  return {
    name: "assertVassalageDurationMinimum",
    passed: violations.length === 0,
    violations,
    notes: "F11 — DB constraint + this assertion both enforce the 3-epoch minimum.",
  };
}

// ============================================================================
// F18 — hard-live games must have adjacency_strict = true
// ============================================================================

export async function assertAdjacencyStrictBeforeHardLive(
  sb: SupabaseClient,
  gameId: string
): Promise<AssertionResult> {
  const { data: game } = await sb
    .from("games")
    .select("id, game_mode, adjacency_strict, total_epochs, is_rehearsal, created_at")
    .eq("id", gameId)
    .single();

  const violations: string[] = [];
  if (!game) {
    return { name: "assertAdjacencyStrictBeforeHardLive", passed: false, violations: [`game ${gameId} not found`] };
  }
  const isRealmsHardLive =
    game.game_mode === "realms" &&
    !game.is_rehearsal &&
    (game.total_epochs ?? 10) === 10 &&
    new Date(game.created_at) >= new Date("2026-04-23T00:00:00Z");
  if (isRealmsHardLive && !game.adjacency_strict) {
    violations.push(`Realms hard-live game created ${game.created_at} has adjacency_strict = false`);
  }

  return {
    name: "assertAdjacencyStrictBeforeHardLive",
    passed: violations.length === 0,
    violations,
    notes: "F18 — adjacency seed must load and strict flag flip before Apr 23 2026 hard-live.",
  };
}

// ============================================================================
// Decision I — alliance cluster cap: max 2 active outbound per civ
// ============================================================================

export async function assertAllianceClusterCapObserved(
  sb: SupabaseClient,
  gameId: string
): Promise<AssertionResult> {
  const { data } = await sb
    .from("alliances")
    .select("proposer_team_id, status")
    .eq("game_id", gameId)
    .in("status", ["pending", "active"]);

  const perProposer = new Map<string, number>();
  for (const a of data ?? []) {
    perProposer.set(a.proposer_team_id, (perProposer.get(a.proposer_team_id) ?? 0) + 1);
  }

  const violations: string[] = [];
  for (const [proposerId, count] of perProposer) {
    if (count > 2) {
      violations.push(`team ${proposerId} holds ${count} active/pending outbound alliances (cap = 2)`);
    }
  }

  return {
    name: "assertAllianceClusterCapObserved",
    passed: violations.length === 0,
    violations,
    notes: "Decision I — cap enforced by /alliances/propose route.",
  };
}

// ============================================================================
// Alliance treaty text captured (non-empty on every active alliance — Guardrail 4)
// ============================================================================

export async function assertAllianceTreatyTextCaptured(
  sb: SupabaseClient,
  gameId: string
): Promise<AssertionResult> {
  const { data } = await sb
    .from("alliances")
    .select("id, treaty_text")
    .eq("game_id", gameId)
    .eq("status", "active");

  const violations: string[] = [];
  for (const a of data ?? []) {
    if (!a.treaty_text || a.treaty_text.trim().length < 10) {
      violations.push(`alliance ${a.id} has empty or too-short treaty_text`);
    }
  }

  return {
    name: "assertAllianceTreatyTextCaptured",
    passed: violations.length === 0,
    violations,
    notes: "Guardrail 4 — portfolio ships treaty prose back to the child.",
  };
}

// ============================================================================
// Guardrail 2 — vassal teams still submit every epoch they are active
// ============================================================================

export async function assertVassalStillSubmits(
  sb: SupabaseClient,
  gameId: string
): Promise<AssertionResult> {
  const { data: rels } = await sb
    .from("vassal_relationships")
    .select("vassal_team_id, start_epoch, end_epoch, is_active")
    .eq("game_id", gameId)
    .eq("is_active", true);

  const { data: game } = await sb.from("games").select("current_epoch").eq("id", gameId).single();
  const currentEpoch = game?.current_epoch ?? 1;

  const violations: string[] = [];
  for (const rel of rels ?? []) {
    // For each epoch between start and current, check the vassal submitted at least one row
    for (let e = rel.start_epoch; e <= currentEpoch; e++) {
      const { count } = await sb
        .from("epoch_submissions")
        .select("id", { count: "exact", head: true })
        .eq("team_id", rel.vassal_team_id)
        .eq("epoch", e);
      if ((count ?? 0) === 0) {
        violations.push(`vassal ${rel.vassal_team_id} submitted 0 rows in epoch ${e}`);
      }
    }
  }

  return {
    name: "assertVassalStillSubmits",
    passed: violations.length === 0,
    violations,
    notes: "Guardrail 2 — vassalage is a playable state, not a benching.",
  };
}

// ============================================================================
// Battle audit rows — every resolution writes pre_state + post_state
// ============================================================================

export async function assertBattleAuditRowWritten(
  sb: SupabaseClient,
  gameId: string
): Promise<AssertionResult> {
  const { data } = await sb
    .from("game_events")
    .select("id, metadata")
    .eq("game_id", gameId)
    .eq("event_type", "battle_resolution")
    .limit(500);

  const violations: string[] = [];
  for (const evt of data ?? []) {
    if (!evt.metadata?.pre_state || !evt.metadata?.post_state) {
      violations.push(`event ${evt.id} missing pre_state or post_state — DM Undo cannot restore`);
    }
  }

  return {
    name: "assertBattleAuditRowWritten",
    passed: violations.length === 0,
    violations,
    notes: "§4.5.1 — DM Undo reads pre_state to restore.",
  };
}

// ============================================================================
// Epoch gates enforced (no pre-E4 alliance proposals, no pre-E6 wars)
// ============================================================================

export async function assertDiplomacyGatesEnforced(
  sb: SupabaseClient,
  gameId: string
): Promise<AssertionResult> {
  const { data: preE4Alliances } = await sb
    .from("alliances")
    .select("id, proposed_epoch")
    .eq("game_id", gameId)
    .lt("proposed_epoch", 4);

  const { data: preE6Conflicts } = await sb
    .from("epoch_conflict_flags")
    .select("id, epoch")
    .eq("game_id", gameId)
    .lt("epoch", 6);

  const violations: string[] = [];
  for (const a of preE4Alliances ?? []) {
    violations.push(`alliance ${a.id} proposed at epoch ${a.proposed_epoch} < 4`);
  }
  for (const c of preE6Conflicts ?? []) {
    violations.push(`conflict_flag ${c.id} at epoch ${c.epoch} < 6`);
  }

  return {
    name: "assertDiplomacyGatesEnforced",
    passed: violations.length === 0,
    violations,
    notes: "Realms epoch gates — enforced in /submissions route + dedicated diplomatic endpoints.",
  };
}

// ============================================================================
// Decision B §4.6.2 — epilogue generated for every team at game end
// (Only meaningful after the endgame phase runs. Returns 'skipped' pre-E10.)
// ============================================================================

export async function assertEpilogueGeneratedForEveryTeam(
  sb: SupabaseClient,
  gameId: string
): Promise<AssertionResult> {
  const { data: game } = await sb
    .from("games")
    .select("current_epoch, total_epochs, finale_triggered")
    .eq("id", gameId)
    .single();
  if (!game || !game.finale_triggered) {
    return {
      name: "assertEpilogueGeneratedForEveryTeam",
      passed: true,
      violations: [],
      notes: "Skipped — finale not triggered yet.",
    };
  }

  // The implementation stores epilogue in game_events (event_type='civ_epilogue')
  // keyed by team_id. Verify every team has at least one such row.
  const teams = await loadTeams(sb, gameId);
  const violations: string[] = [];
  for (const t of teams) {
    const { data: evt } = await sb
      .from("game_events")
      .select("id, description")
      .eq("game_id", gameId)
      .eq("event_type", "civ_epilogue")
      .contains("affected_team_ids", [t.id])
      .limit(1)
      .maybeSingle();
    if (!evt) {
      violations.push(`team ${t.civilization_name ?? t.name} has no epilogue event`);
    } else if (!evt.description || evt.description.length < 50) {
      violations.push(`team ${t.civilization_name ?? t.name} epilogue is too short or empty`);
    }
  }

  return {
    name: "assertEpilogueGeneratedForEveryTeam",
    passed: violations.length === 0,
    violations,
    notes: "Decision B §4.6.2 — every civilization gets a dignifying epilogue, not just winners.",
  };
}

// ============================================================================
// Master runner
// ============================================================================

export const ALL_ASSERTIONS = [
  assertGuardrail1NeverErases,
  assertCasusBelliChildTableIntegrity,
  assertAllianceMinSoldierCommit,
  assertVassalageDurationMinimum,
  assertAdjacencyStrictBeforeHardLive,
  assertAllianceClusterCapObserved,
  assertAllianceTreatyTextCaptured,
  assertVassalStillSubmits,
  assertBattleAuditRowWritten,
  assertDiplomacyGatesEnforced,
  assertEpilogueGeneratedForEveryTeam,
] as const;

export async function runAllAssertions(sb: SupabaseClient, gameId: string): Promise<AssertionResult[]> {
  const results: AssertionResult[] = [];
  for (const fn of ALL_ASSERTIONS) {
    try {
      results.push(await fn(sb, gameId));
    } catch (err) {
      results.push({
        name: fn.name,
        passed: false,
        violations: [err instanceof Error ? err.message : String(err)],
      });
    }
  }
  return results;
}

// ============================================================================
// Standalone CLI entry
// ============================================================================

async function cli() {
  const gameId = process.argv[2];
  if (!gameId) {
    console.error("Usage: npx tsx scripts/realms-assertions.ts <game_id>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    process.exit(1);
  }

  const sb = createClient(url, key);
  const results = await runAllAssertions(sb, gameId);

  let failed = 0;
  for (const r of results) {
    const icon = r.passed ? "✅" : "❌";
    console.log(`${icon} ${r.name}`);
    if (!r.passed) {
      failed++;
      for (const v of r.violations) console.log(`   - ${v}`);
    }
  }

  console.log(
    `\n${results.length - failed} passed, ${failed} failed, ${results.length} total assertions.`
  );
  process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
  cli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
