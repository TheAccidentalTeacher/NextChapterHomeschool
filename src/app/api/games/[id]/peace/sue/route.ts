// ============================================================
// POST /api/games/[id]/peace/sue
// ============================================================
// Realms v1.5 Pass 3 — sue for peace.
// Either side of an active war may offer peace. On mutual agreement,
// the conflict flag is marked 'peace'. Both sides gain +5 resilience.
// Epoch gate: E6+ (same as war declarations).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

const PEACE_UNLOCK_EPOCH = 6;
const PEACE_RESILIENCE_BONUS = 5;

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { conflict_flag_id, proposed_reparations, accepting } = body ?? {};

  if (!conflict_flag_id) {
    return NextResponse.json({ error: "Missing conflict_flag_id" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: flag } = await supabase
    .from("epoch_conflict_flags")
    .select("*")
    .eq("id", conflict_flag_id)
    .eq("game_id", gameId)
    .maybeSingle();
  if (!flag) return NextResponse.json({ error: "Conflict not found" }, { status: 404 });
  if (flag.resolved_at) {
    return NextResponse.json({ error: "Conflict already resolved" }, { status: 409 });
  }

  // Verify caller is a member of one of the belligerents
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("clerk_user_id", userId)
    .in("team_id", [flag.aggressor_team_id, flag.defender_team_id])
    .maybeSingle();
  if (!membership) {
    return NextResponse.json(
      { error: "Only a belligerent civilization's member can sue for peace" },
      { status: 403 }
    );
  }

  const { data: game } = await supabase
    .from("games")
    .select("current_epoch, game_mode")
    .eq("id", gameId)
    .single();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.game_mode === "realms" && game.current_epoch < PEACE_UNLOCK_EPOCH) {
    return NextResponse.json(
      { error: `Peace offers unlock at Epoch ${PEACE_UNLOCK_EPOCH}` },
      { status: 403 }
    );
  }

  if (!accepting) {
    // Proposal step — capture the offer. DM resolves by calling this endpoint
    // again with accepting=true OR the other side calls with accepting=true.
    await supabase.from("game_events").insert({
      game_id: gameId,
      epoch: game.current_epoch,
      event_type: "peace_offered",
      description: `Peace offered in conflict ${conflict_flag_id}`,
      affected_team_ids: [flag.aggressor_team_id, flag.defender_team_id],
      metadata: {
        conflict_flag_id,
        offered_by_team_id: membership.team_id,
        proposed_reparations: proposed_reparations ?? null,
      },
    });
    return NextResponse.json({ status: "offered", conflict_flag_id });
  }

  // Accept — resolve the flag + apply +5 resilience to both sides
  const now = new Date().toISOString();
  await supabase
    .from("epoch_conflict_flags")
    .update({ outcome: "peace", resolved_at: now })
    .eq("id", conflict_flag_id);

  for (const teamId of [flag.aggressor_team_id, flag.defender_team_id]) {
    const { data: res } = await supabase
      .from("team_resources")
      .select("id, amount")
      .eq("team_id", teamId)
      .eq("resource_type", "resilience")
      .maybeSingle();
    if (res) {
      await supabase
        .from("team_resources")
        .update({ amount: (res.amount ?? 0) + PEACE_RESILIENCE_BONUS, updated_at: now })
        .eq("id", res.id);
    }
  }

  await supabase.from("game_events").insert({
    game_id: gameId,
    epoch: game.current_epoch,
    event_type: "peace_accepted",
    description: `Peace concluded in conflict ${conflict_flag_id}`,
    affected_team_ids: [flag.aggressor_team_id, flag.defender_team_id],
    metadata: { conflict_flag_id, resilience_bonus: PEACE_RESILIENCE_BONUS },
  });

  return NextResponse.json({ status: "peace", conflict_flag_id });
}
