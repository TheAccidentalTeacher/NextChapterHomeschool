// ============================================================
// POST /api/games/[id]/alliances/propose
// ============================================================
// Realms v1.5 Pass 3 — alliance proposal.
// Creates a 'pending' row in the alliances table.
// Epoch gate: E4+. Alliance cluster cap: max 2 active outbound per civ (Decision I).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

const ALLIANCE_UNLOCK_EPOCH = 4;
const MAX_ACTIVE_OUTBOUND_ALLIANCES = 2; // Decision I

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { proposer_team_id, target_team_id, treaty_text } = body ?? {};

  if (!proposer_team_id || !target_team_id || !treaty_text) {
    return NextResponse.json(
      { error: "Missing proposer_team_id, target_team_id, or treaty_text" },
      { status: 400 }
    );
  }
  if (proposer_team_id === target_team_id) {
    return NextResponse.json({ error: "A civilization cannot ally with itself" }, { status: 400 });
  }
  if (typeof treaty_text !== "string" || treaty_text.trim().length < 10) {
    return NextResponse.json(
      { error: "Treaty text must be at least 10 characters (meaningful intent required)" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Verify proposer is submitted by a member of that team
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("clerk_user_id", userId)
    .eq("team_id", proposer_team_id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "You are not a member of the proposing team" }, { status: 403 });
  }

  // Verify both teams are in this game
  const { data: teams } = await supabase
    .from("teams")
    .select("id, game_id")
    .in("id", [proposer_team_id, target_team_id]);
  if (!teams || teams.length !== 2 || teams.some((t) => t.game_id !== gameId)) {
    return NextResponse.json({ error: "One or both teams not in this game" }, { status: 403 });
  }

  // Epoch gate
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

  // Alliance cluster cap — max 2 active outbound OR pending alliances per civ
  const { count: activeCount } = await supabase
    .from("alliances")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId)
    .eq("proposer_team_id", proposer_team_id)
    .in("status", ["pending", "active"]);
  if ((activeCount ?? 0) >= MAX_ACTIVE_OUTBOUND_ALLIANCES) {
    return NextResponse.json(
      {
        error: `Alliance cluster cap reached — max ${MAX_ACTIVE_OUTBOUND_ALLIANCES} active or pending outbound alliances per civilization (Decision I)`,
      },
      { status: 409 }
    );
  }

  // Prevent duplicate proposal between same two teams while one is already active/pending
  const { data: existing } = await supabase
    .from("alliances")
    .select("id")
    .eq("game_id", gameId)
    .in("status", ["pending", "active"])
    .or(
      `and(proposer_team_id.eq.${proposer_team_id},target_team_id.eq.${target_team_id}),and(proposer_team_id.eq.${target_team_id},target_team_id.eq.${proposer_team_id})`
    )
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "An alliance already exists or is pending between these two civilizations" },
      { status: 409 }
    );
  }

  // Insert pending alliance
  const { data: inserted, error } = await supabase
    .from("alliances")
    .insert({
      game_id: gameId,
      proposer_team_id,
      target_team_id,
      status: "pending",
      treaty_text: treaty_text.trim(),
      proposed_epoch: game.current_epoch,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit event
  await supabase.from("game_events").insert({
    game_id: gameId,
    epoch: game.current_epoch,
    event_type: "alliance_proposed",
    description: `Alliance proposed by ${proposer_team_id} to ${target_team_id}`,
    affected_team_ids: [proposer_team_id, target_team_id],
    metadata: { alliance_id: inserted.id, treaty_text: treaty_text.trim() },
  });

  return NextResponse.json(inserted, { status: 201 });
}
