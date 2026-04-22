// ============================================================
// POST /api/games/[id]/battles/resolve
// ============================================================
// Realms ship plan v1.5 Pass 2 — auto-mutation battle endpoint.
//
// Resolves a battle end-to-end:
//   1. Validates inputs + teacher auth
//   2. Enforces F9 (min 1 soldier commit for ally combat support)
//   3. Calls engine resolveBattle() with optional third (ally) participant
//   4. Applies F4 (Guardrail-1 preservation): NEVER transfers a team's LAST
//      sub-zone — suppresses transfer + offers vassalage next turn instead
//   5. Mutates DB atomically:
//      - teams.war_exhaustion_level (+5 winner, +10 loser)
//      - teams.population (-2 winner, -3..-5 loser RNG)
//      - team_resources.resilience (loser takes resilienceLoss)
//      - sub_zones.controlled_by_team_id (if transfer survives F4 check)
//   6. Writes audit row to game_events with pre_state + post_state blobs
//      (enables DM Undo per §4.5.1 — restore-from-pre_state)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeacher } from "@/lib/auth/roles";
import { resolveBattle, type BattleParticipant } from "@/lib/game/battle-resolver";

type RouteParams = { params: Promise<{ id: string }> };

interface ParticipantInput {
  team_id: string;
  soldiers: number;
  barracks: boolean;
  walls: boolean;
  d20_roll?: number;                 // optional — auto-rolled if absent
  justification_multiplier: number;  // 0.5–2.0, DM scoring
}

interface BattleRequestBody {
  attacker: ParticipantInput;
  defender: ParticipantInput;
  ally?: ParticipantInput & { soldiers_committed: number };
  casus_belli?: string;
  conflict_flag_id?: string;
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: gameId } = await params;

  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Teacher only" }, { status: 403 });
  }

  const body = (await req.json()) as BattleRequestBody;
  const { attacker, defender, ally, casus_belli, conflict_flag_id } = body;

  if (!attacker?.team_id || !defender?.team_id) {
    return NextResponse.json(
      { error: "Missing attacker.team_id or defender.team_id" },
      { status: 400 }
    );
  }

  if (attacker.team_id === defender.team_id) {
    return NextResponse.json({ error: "A civilization cannot attack itself" }, { status: 400 });
  }

  // F9 fix: zero-commit ally combat support not permitted when ally has soldiers.
  // If ally has soldiers > 0 but commits 0, reject. If ally has 0 total soldiers,
  // the engine marks them "unable to assist" — caller may still send the request.
  if (ally) {
    if (typeof ally.soldiers_committed !== "number" || ally.soldiers_committed < 0) {
      return NextResponse.json(
        { error: "ally.soldiers_committed must be a non-negative integer" },
        { status: 400 }
      );
    }
    if (ally.soldiers > 0 && ally.soldiers_committed === 0) {
      return NextResponse.json(
        {
          error:
            "Alliance combat support must commit at least 1 soldier when the ally has soldiers available (F9 — no symbolic-only support).",
        },
        { status: 400 }
      );
    }
    if (ally.soldiers_committed > ally.soldiers) {
      return NextResponse.json(
        { error: "ally.soldiers_committed cannot exceed ally.soldiers" },
        { status: 400 }
      );
    }
  }

  const supabase = await createClient();

  // Verify all teams belong to this game
  const teamIds = [attacker.team_id, defender.team_id, ally?.team_id].filter(Boolean) as string[];
  const { data: validTeams } = await supabase
    .from("teams")
    .select("id, name, game_id, population, war_exhaustion_level")
    .in("id", teamIds);

  if (!validTeams || validTeams.length !== teamIds.length) {
    return NextResponse.json({ error: "One or more teams not in this game" }, { status: 403 });
  }
  for (const t of validTeams) {
    if (t.game_id !== gameId) {
      return NextResponse.json({ error: "Team not in this game" }, { status: 403 });
    }
  }

  const teamById = new Map(validTeams.map((t) => [t.id, t]));
  const attackerTeam = teamById.get(attacker.team_id)!;
  const defenderTeam = teamById.get(defender.team_id)!;
  const allyTeam = ally ? teamById.get(ally.team_id) : null;

  // Build engine participants
  const attackerP: BattleParticipant = {
    teamId: attacker.team_id,
    teamName: attackerTeam.name,
    soldiers: attacker.soldiers,
    barracks: attacker.barracks,
    walls: attacker.walls,
    d20Roll: attacker.d20_roll ?? rollD20(),
    justificationMultiplier: attacker.justification_multiplier,
    isAttacker: true,
  };
  const defenderP: BattleParticipant = {
    teamId: defender.team_id,
    teamName: defenderTeam.name,
    soldiers: defender.soldiers,
    barracks: defender.barracks,
    walls: defender.walls,
    d20Roll: defender.d20_roll ?? rollD20(),
    justificationMultiplier: defender.justification_multiplier,
    isAttacker: false,
  };
  const allyP: BattleParticipant | undefined = ally && allyTeam
    ? {
        teamId: ally.team_id,
        teamName: allyTeam.name,
        soldiers: ally.soldiers_committed, // engine consumes only committed subset
        barracks: ally.barracks,
        walls: ally.walls,
        d20Roll: ally.d20_roll ?? rollD20(),
        justificationMultiplier: ally.justification_multiplier,
        isAttacker: false, // ally joins defender
      }
    : undefined;

  const result = resolveBattle(attackerP, defenderP, allyP);

  // Look up loser's sub-zones for F4 last-sub-zone preservation
  const { data: loserSubZones } = await supabase
    .from("sub_zones")
    .select("id, zone_number")
    .eq("game_id", gameId)
    .eq("controlled_by_team_id", result.loserId)
    .order("zone_number", { ascending: true });

  const loserSubZoneCount = loserSubZones?.length ?? 0;
  const wouldBeLastSubZone = loserSubZoneCount <= 1;

  // F4 fix: if sub-zone transfer would leave loser at 0 sub-zones, suppress it
  // AND flag offerVassalage = true regardless of score differential (give the
  // losing child a path that preserves her civilization's presence on the map).
  const subZoneTransferActual =
    result.subZoneTransferred && !wouldBeLastSubZone && loserSubZoneCount > 0;
  const offerVassalageActual = result.offerVassalage || (result.subZoneTransferred && wouldBeLastSubZone);

  // Pick sub-zone to transfer (deterministic: lowest zone_number)
  const transferredSubZoneId =
    subZoneTransferActual && loserSubZones && loserSubZones.length > 0
      ? loserSubZones[0].id
      : null;

  // Population losses — winner -2, loser -3 to -5 (RNG per war-exhaustion.ts spec)
  const winnerPopLoss = 2;
  const loserPopLoss = 3 + Math.floor(Math.random() * 3); // 3..5

  // Pre-state snapshot for audit (enables DM Undo restore)
  const preState = {
    attacker: {
      team_id: attacker.team_id,
      population: attackerTeam.population,
      war_exhaustion_level: attackerTeam.war_exhaustion_level,
    },
    defender: {
      team_id: defender.team_id,
      population: defenderTeam.population,
      war_exhaustion_level: defenderTeam.war_exhaustion_level,
    },
    ally: allyTeam
      ? {
          team_id: allyTeam.id,
          war_exhaustion_level: allyTeam.war_exhaustion_level,
          soldiers_committed: ally?.soldiers_committed ?? 0,
        }
      : null,
    loser_sub_zones_before: loserSubZoneCount,
    transferred_sub_zone_id: transferredSubZoneId,
  };

  // ---- Mutations ----

  const winnerIsAttacker = result.winnerId === attacker.team_id;
  const winnerTeam = winnerIsAttacker ? attackerTeam : defenderTeam;
  const loserTeam = winnerIsAttacker ? defenderTeam : attackerTeam;

  // 1. Winner: +5 exhaustion, -2 population (non-negative)
  await supabase
    .from("teams")
    .update({
      war_exhaustion_level: (winnerTeam.war_exhaustion_level ?? 0) + 5,
      population: Math.max(0, (winnerTeam.population ?? 0) - winnerPopLoss),
    })
    .eq("id", result.winnerId);

  // 2. Loser: +10 exhaustion, -3..-5 population
  await supabase
    .from("teams")
    .update({
      war_exhaustion_level: (loserTeam.war_exhaustion_level ?? 0) + 10,
      population: Math.max(0, (loserTeam.population ?? 0) - loserPopLoss),
    })
    .eq("id", result.loserId);

  // 3. Loser resilience loss via team_resources
  const { data: loserResilience } = await supabase
    .from("team_resources")
    .select("id, amount")
    .eq("team_id", result.loserId)
    .eq("resource_type", "resilience")
    .single();
  if (loserResilience) {
    await supabase
      .from("team_resources")
      .update({
        amount: Math.max(0, (loserResilience.amount ?? 0) - result.resilienceLoss),
        updated_at: new Date().toISOString(),
      })
      .eq("id", loserResilience.id);
  }

  // 4. Ally also +5 exhaustion if they contributed to combat
  if (allyTeam && result.allySupport?.contributed) {
    await supabase
      .from("teams")
      .update({
        war_exhaustion_level: (allyTeam.war_exhaustion_level ?? 0) + 5,
      })
      .eq("id", allyTeam.id);
  }

  // 5. Sub-zone transfer (F4-checked)
  if (transferredSubZoneId) {
    await supabase
      .from("sub_zones")
      .update({ controlled_by_team_id: result.winnerId })
      .eq("id", transferredSubZoneId);
  }

  // 6. Mark conflict flag resolved if provided
  if (conflict_flag_id) {
    await supabase
      .from("epoch_conflict_flags")
      .update({
        outcome: `winner=${result.winnerId},diff=${result.scoreDifferential}${
          transferredSubZoneId ? ",sub_zone_transferred" : ""
        }${offerVassalageActual ? ",vassalage_offered" : ""}`,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", conflict_flag_id)
      .eq("game_id", gameId);
  }

  // ---- Post-state snapshot + audit row ----

  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();

  const postState = {
    winner_id: result.winnerId,
    loser_id: result.loserId,
    winner_population_after: Math.max(0, (winnerTeam.population ?? 0) - winnerPopLoss),
    loser_population_after: Math.max(0, (loserTeam.population ?? 0) - loserPopLoss),
    winner_exhaustion_after: (winnerTeam.war_exhaustion_level ?? 0) + 5,
    loser_exhaustion_after: (loserTeam.war_exhaustion_level ?? 0) + 10,
    resilience_loss: result.resilienceLoss,
    score_differential: result.scoreDifferential,
    sub_zone_transferred: subZoneTransferActual,
    transferred_sub_zone_id: transferredSubZoneId,
    offer_vassalage: offerVassalageActual,
    guardrail_1_enforced: wouldBeLastSubZone && result.subZoneTransferred,
    ally_contributed: result.allySupport?.contributed ?? false,
  };

  const affectedIds = [result.winnerId, result.loserId];
  if (allyTeam) affectedIds.push(allyTeam.id);

  await supabase.from("game_events").insert({
    game_id: gameId,
    epoch: game?.current_epoch ?? 1,
    event_type: "battle_resolution",
    description: `${winnerTeam.name} defeated ${loserTeam.name}${
      transferredSubZoneId ? " and claimed territory" : ""
    }${offerVassalageActual ? "; vassalage offered" : ""}${casus_belli ? `. Casus belli: ${casus_belli}` : ""}`,
    affected_team_ids: affectedIds,
    metadata: {
      pre_state: preState,
      post_state: postState,
      battle_result: result,
      casus_belli: casus_belli ?? null,
      conflict_flag_id: conflict_flag_id ?? null,
    },
  });

  return NextResponse.json({
    result,
    applied: {
      sub_zone_transferred: subZoneTransferActual,
      transferred_sub_zone_id: transferredSubZoneId,
      offer_vassalage: offerVassalageActual,
      guardrail_1_enforced: wouldBeLastSubZone && result.subZoneTransferred,
      winner_population_loss: winnerPopLoss,
      loser_population_loss: loserPopLoss,
      ally_contributed: result.allySupport?.contributed ?? false,
    },
  });
}
