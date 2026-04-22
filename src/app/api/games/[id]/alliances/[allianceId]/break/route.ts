// ============================================================
// POST /api/games/[id]/alliances/[allianceId]/break
// ============================================================
// Realms v1.5 Pass 3 — break an active alliance (betrayal).
// Costs: −15 resilience + −10 reputation to the breaker. Target gains a
// casus_belli_grants row valid for 2 epochs (free-war-declaration token).
// Public projector event fires with full drama treatment (§4.5.2).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string; allianceId: string }> };

const BREAK_RESILIENCE_COST = 15;
const BREAK_REPUTATION_COST = 10;
const CASUS_BELLI_VALID_EPOCHS = 2;

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: gameId, allianceId } = await params;
  const userId = await getClerkUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { break_justification } = body ?? {};

  if (typeof break_justification !== "string" || break_justification.trim().length < 10) {
    return NextResponse.json(
      { error: "break_justification required (at least 10 characters — the world will see it)" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: alliance } = await supabase
    .from("alliances")
    .select("*")
    .eq("id", allianceId)
    .eq("game_id", gameId)
    .maybeSingle();
  if (!alliance) return NextResponse.json({ error: "Alliance not found" }, { status: 404 });
  if (alliance.status !== "active") {
    return NextResponse.json(
      { error: `Alliance is ${alliance.status}, only active alliances can be broken` },
      { status: 409 }
    );
  }

  // Caller must be a member of EITHER party. Determine which side is breaking.
  const { data: myMemberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("clerk_user_id", userId)
    .in("team_id", [alliance.proposer_team_id, alliance.target_team_id]);
  if (!myMemberships || myMemberships.length === 0) {
    return NextResponse.json(
      { error: "Only a member of the allied civilizations can break this treaty" },
      { status: 403 }
    );
  }
  const breakerTeamId = myMemberships[0].team_id;
  const victimTeamId =
    breakerTeamId === alliance.proposer_team_id
      ? alliance.target_team_id
      : alliance.proposer_team_id;

  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const now = new Date().toISOString();

  // 1. Mark alliance broken
  const { error: brkErr } = await supabase
    .from("alliances")
    .update({ status: "broken", broken_epoch: game.current_epoch, broken_at: now })
    .eq("id", allianceId);
  if (brkErr) return NextResponse.json({ error: brkErr.message }, { status: 500 });

  // 2. Apply resilience cost to breaker
  const { data: breakerResilience } = await supabase
    .from("team_resources")
    .select("id, amount")
    .eq("team_id", breakerTeamId)
    .eq("resource_type", "resilience")
    .maybeSingle();
  if (breakerResilience) {
    await supabase
      .from("team_resources")
      .update({
        amount: Math.max(0, (breakerResilience.amount ?? 0) - BREAK_RESILIENCE_COST),
        updated_at: now,
      })
      .eq("id", breakerResilience.id);
  }

  // 3. Decrement reputation on breaker, increment aggression
  const { data: breakerTeam } = await supabase
    .from("teams")
    .select("reputation_score, aggression_score")
    .eq("id", breakerTeamId)
    .single();
  await supabase
    .from("teams")
    .update({
      reputation_score: (breakerTeam?.reputation_score ?? 0) - BREAK_REPUTATION_COST,
      aggression_score: (breakerTeam?.aggression_score ?? 0) + BREAK_REPUTATION_COST,
    })
    .eq("id", breakerTeamId);

  // 4. Grant casus belli to victim (F6 — child table supports multiple grants)
  await supabase.from("casus_belli_grants").insert({
    holder_team_id: victimTeamId,
    grantor_team_id: breakerTeamId,
    granted_epoch: game.current_epoch,
    expires_epoch: game.current_epoch + CASUS_BELLI_VALID_EPOCHS,
  });

  // 5. Public projector event — full drama treatment (§4.5.2)
  await supabase.from("game_events").insert({
    game_id: gameId,
    epoch: game.current_epoch,
    event_type: "alliance_broken",
    description: `⚔ BETRAYAL ⚔ — Alliance broken by breaker team.`,
    affected_team_ids: [breakerTeamId, victimTeamId],
    metadata: {
      alliance_id: allianceId,
      breaker_team_id: breakerTeamId,
      victim_team_id: victimTeamId,
      treaty_text: alliance.treaty_text,
      break_justification: break_justification.trim(),
      resilience_cost: BREAK_RESILIENCE_COST,
      reputation_cost: BREAK_REPUTATION_COST,
      casus_belli_expires_epoch: game.current_epoch + CASUS_BELLI_VALID_EPOCHS,
      projector_copy: {
        headline: "⚔ BETRAYAL ⚔",
        treaty_was: alliance.treaty_text,
        reason: break_justification.trim(),
        epilogue: "The world will remember.",
      },
    },
  });

  return NextResponse.json({
    alliance_id: allianceId,
    status: "broken",
    breaker_team_id: breakerTeamId,
    victim_team_id: victimTeamId,
    casus_belli_granted_to: victimTeamId,
    casus_belli_expires_epoch: game.current_epoch + CASUS_BELLI_VALID_EPOCHS,
  });
}
