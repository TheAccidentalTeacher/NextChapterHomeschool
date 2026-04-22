// ============================================================
// POST /api/games/[id]/ultimatums/issue
// ============================================================
// Realms v1.5 Pass 3 — issue ultimatum (E4+).
// Records an ultimatum in game_events with metadata for the target civ to
// see on their dashboard. If unresolved by the following epoch, at E6+ it
// auto-escalates to war with zero extra exhaustion (caller performs the
// escalation via the submissions endpoint when the timer expires).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

const ULTIMATUM_UNLOCK_EPOCH = 4;

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { issuer_team_id, target_team_id, demand_text, threat_text } = body ?? {};

  if (!issuer_team_id || !target_team_id || !demand_text || !threat_text) {
    return NextResponse.json(
      { error: "Missing issuer_team_id, target_team_id, demand_text, or threat_text" },
      { status: 400 }
    );
  }
  if (issuer_team_id === target_team_id) {
    return NextResponse.json({ error: "Cannot issue ultimatum to self" }, { status: 400 });
  }
  if (typeof demand_text !== "string" || demand_text.trim().length < 5) {
    return NextResponse.json({ error: "demand_text too short" }, { status: 400 });
  }
  if (typeof threat_text !== "string" || threat_text.trim().length < 5) {
    return NextResponse.json({ error: "threat_text too short" }, { status: 400 });
  }

  const supabase = await createClient();

  // Caller must be a member of the issuer
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("clerk_user_id", userId)
    .eq("team_id", issuer_team_id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json(
      { error: "Only a member of the issuing civilization can issue this ultimatum" },
      { status: 403 }
    );
  }

  // Teams in game
  const { data: teams } = await supabase
    .from("teams")
    .select("id, game_id")
    .in("id", [issuer_team_id, target_team_id]);
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
  if (game.game_mode === "realms" && game.current_epoch < ULTIMATUM_UNLOCK_EPOCH) {
    return NextResponse.json(
      { error: `Ultimatums unlock at Epoch ${ULTIMATUM_UNLOCK_EPOCH}` },
      { status: 403 }
    );
  }

  // Record as game event (not a separate table — epochs are short, state lives in metadata)
  const { data: evt, error } = await supabase
    .from("game_events")
    .insert({
      game_id: gameId,
      epoch: game.current_epoch,
      event_type: "ultimatum_issued",
      description: `Ultimatum issued by ${issuer_team_id} to ${target_team_id}`,
      affected_team_ids: [issuer_team_id, target_team_id],
      metadata: {
        issuer_team_id,
        target_team_id,
        demand_text: demand_text.trim(),
        threat_text: threat_text.trim(),
        expires_epoch: game.current_epoch + 1,
        resolved: false,
      },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(evt, { status: 201 });
}
