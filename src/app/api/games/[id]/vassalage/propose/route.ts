// ============================================================
// POST /api/games/[id]/vassalage/propose
// ============================================================
// Realms v1.5 Pass 3 — diplomatic vassalage proposal (NOT battle-triggered).
// Epoch gate: E6+ (same as wars).
// Tribute percent negotiable 10–30% (Q7 locked). Target responds via
// /api/games/[id]/vassalage/[vassalageId]/respond. Auto-created on
// BATTLE loss when differential >= 20 is a SEPARATE path — this route is
// for volunteer / strategic vassalage.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

const VASSALAGE_UNLOCK_EPOCH = 6;
const TRIBUTE_MIN = 10;
const TRIBUTE_MAX = 30;
const MINIMUM_DURATION_EPOCHS = 3;

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    overlord_team_id,
    vassal_team_id,
    tribute_percent,
    duration_epochs, // nullable — null = open-ended (revolt after 3)
    terms_text,
  } = body ?? {};

  if (!overlord_team_id || !vassal_team_id) {
    return NextResponse.json(
      { error: "Missing overlord_team_id or vassal_team_id" },
      { status: 400 }
    );
  }
  if (overlord_team_id === vassal_team_id) {
    return NextResponse.json({ error: "A civilization cannot vassalize itself" }, { status: 400 });
  }
  if (typeof tribute_percent !== "number" || tribute_percent < TRIBUTE_MIN || tribute_percent > TRIBUTE_MAX) {
    return NextResponse.json(
      { error: `tribute_percent must be an integer between ${TRIBUTE_MIN} and ${TRIBUTE_MAX}` },
      { status: 400 }
    );
  }
  if (duration_epochs !== null && duration_epochs !== undefined) {
    if (typeof duration_epochs !== "number" || duration_epochs < MINIMUM_DURATION_EPOCHS) {
      return NextResponse.json(
        { error: `duration_epochs, if specified, must be at least ${MINIMUM_DURATION_EPOCHS} (F11 minimum)` },
        { status: 400 }
      );
    }
  }

  const supabase = await createClient();

  // Caller should be a member of either team — proposals can go either direction
  // (a dominant civ proposes to vassalize; a weakened civ proposes to submit).
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("clerk_user_id", userId)
    .in("team_id", [overlord_team_id, vassal_team_id])
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "Caller must be member of one of the parties" }, { status: 403 });
  }

  // Teams in this game
  const { data: teams } = await supabase
    .from("teams")
    .select("id, game_id")
    .in("id", [overlord_team_id, vassal_team_id]);
  if (!teams || teams.length !== 2 || teams.some((t) => t.game_id !== gameId)) {
    return NextResponse.json({ error: "Teams not in this game" }, { status: 403 });
  }

  // Epoch gate
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch, game_mode")
    .eq("id", gameId)
    .single();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.game_mode === "realms" && game.current_epoch < VASSALAGE_UNLOCK_EPOCH) {
    return NextResponse.json(
      { error: `Vassalage unlocks at Epoch ${VASSALAGE_UNLOCK_EPOCH}` },
      { status: 403 }
    );
  }

  // Prevent duplicate proposal / active relationship
  const { data: existing } = await supabase
    .from("vassal_relationships")
    .select("id")
    .eq("game_id", gameId)
    .or(
      `and(overlord_team_id.eq.${overlord_team_id},vassal_team_id.eq.${vassal_team_id}),and(overlord_team_id.eq.${vassal_team_id},vassal_team_id.eq.${overlord_team_id})`
    )
    .eq("is_active", true)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "An active vassalage already exists between these two civilizations" },
      { status: 409 }
    );
  }

  // Log proposal as a game event — the actual vassal_relationships row is
  // inserted on the respond/accept endpoint (not built here; teacher may also
  // manually accept via DM panel).
  const { data: evt, error } = await supabase
    .from("game_events")
    .insert({
      game_id: gameId,
      epoch: game.current_epoch,
      event_type: "vassalage_proposed",
      description: `Vassalage proposed: ${vassal_team_id} under ${overlord_team_id}`,
      affected_team_ids: [overlord_team_id, vassal_team_id],
      metadata: {
        overlord_team_id,
        vassal_team_id,
        tribute_percent,
        duration_epochs: duration_epochs ?? null,
        terms_text: terms_text ?? null,
        proposer_team_id: membership.team_id,
        resolved: false,
      },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(evt, { status: 201 });
}
