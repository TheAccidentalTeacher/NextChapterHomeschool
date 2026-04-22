// ============================================================
// POST /api/games/[id]/alliances/[allianceId]/respond
// ============================================================
// Realms v1.5 Pass 3 — alliance acceptance or rejection.
// Target civ decides. On accept: status='active', projector event fires.
// On reject: status='rejected', no reputation cost.
// Epoch gate: E4+ (inherited from proposal — but also re-checked here).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string; allianceId: string }> };

const ALLIANCE_UNLOCK_EPOCH = 4;

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: gameId, allianceId } = await params;
  const userId = await getClerkUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { decision, reply_text } = body ?? {};

  if (decision !== "accept" && decision !== "reject") {
    return NextResponse.json({ error: "decision must be 'accept' or 'reject'" }, { status: 400 });
  }

  const supabase = await createClient();

  // Load the pending alliance
  const { data: alliance } = await supabase
    .from("alliances")
    .select("*")
    .eq("id", allianceId)
    .eq("game_id", gameId)
    .maybeSingle();
  if (!alliance) return NextResponse.json({ error: "Alliance not found" }, { status: 404 });
  if (alliance.status !== "pending") {
    return NextResponse.json(
      { error: `Alliance is ${alliance.status}, cannot respond` },
      { status: 409 }
    );
  }

  // Caller must be member of the TARGET team (not the proposer)
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("clerk_user_id", userId)
    .eq("team_id", alliance.target_team_id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json(
      { error: "Only a member of the target civilization can respond to this proposal" },
      { status: 403 }
    );
  }

  // Epoch gate re-check
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch, game_mode")
    .eq("id", gameId)
    .single();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.game_mode === "realms" && game.current_epoch < ALLIANCE_UNLOCK_EPOCH) {
    return NextResponse.json(
      { error: `Alliances unlock at Epoch ${ALLIANCE_UNLOCK_EPOCH}` },
      { status: 403 }
    );
  }

  const now = new Date().toISOString();
  const updatePatch: Record<string, unknown> =
    decision === "accept"
      ? { status: "active", accepted_epoch: game.current_epoch, accepted_at: now }
      : { status: "rejected", rejected_epoch: game.current_epoch, rejected_at: now };

  const { data: updated, error } = await supabase
    .from("alliances")
    .update(updatePatch)
    .eq("id", allianceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit event
  await supabase.from("game_events").insert({
    game_id: gameId,
    epoch: game.current_epoch,
    event_type: decision === "accept" ? "alliance_accepted" : "alliance_rejected",
    description:
      decision === "accept"
        ? `Alliance between ${alliance.proposer_team_id} and ${alliance.target_team_id} accepted`
        : `Alliance between ${alliance.proposer_team_id} and ${alliance.target_team_id} rejected`,
    affected_team_ids: [alliance.proposer_team_id, alliance.target_team_id],
    metadata: { alliance_id: allianceId, reply_text: reply_text ?? null },
  });

  return NextResponse.json(updated);
}
