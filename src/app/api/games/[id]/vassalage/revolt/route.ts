// ============================================================
// POST /api/games/[id]/vassalage/revolt
// ============================================================
// Realms v1.5 Pass 5 — vassal breaks free from their liege.
// Cost: -30 resilience to the vassal. Requires at least 3 epochs of
// vassalage to have elapsed (F11 minimum duration). Fires a casus-belli
// grant to the former liege (they can retaliate with free-war-declaration).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

const REVOLT_RESILIENCE_COST = 30;
const MIN_VASSALAGE_EPOCHS = 3;
const CASUS_BELLI_VALID_EPOCHS = 2;

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { relationship_id, revolt_justification } = body ?? {};

  if (!relationship_id) {
    return NextResponse.json({ error: "Missing relationship_id" }, { status: 400 });
  }
  if (typeof revolt_justification !== "string" || revolt_justification.trim().length < 10) {
    return NextResponse.json(
      { error: "revolt_justification required (at least 10 characters)" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: rel } = await supabase
    .from("vassal_relationships")
    .select("*")
    .eq("id", relationship_id)
    .eq("game_id", gameId)
    .maybeSingle();
  if (!rel) return NextResponse.json({ error: "Vassalage not found" }, { status: 404 });
  if (!rel.is_active) {
    return NextResponse.json({ error: "Vassalage already ended" }, { status: 409 });
  }

  // Caller must be a member of the vassal
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("clerk_user_id", userId)
    .eq("team_id", rel.vassal_team_id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json(
      { error: "Only a member of the vassal civilization can revolt" },
      { status: 403 }
    );
  }

  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const epochsElapsed = game.current_epoch - rel.start_epoch;
  if (epochsElapsed < MIN_VASSALAGE_EPOCHS) {
    return NextResponse.json(
      {
        error: `Vassalage must last at least ${MIN_VASSALAGE_EPOCHS} epochs before revolt. ${epochsElapsed} elapsed.`,
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();

  // 1. End the relationship
  await supabase
    .from("vassal_relationships")
    .update({ is_active: false, end_epoch: game.current_epoch })
    .eq("id", relationship_id);

  // 2. Apply -30 resilience to the vassal
  const { data: res } = await supabase
    .from("team_resources")
    .select("id, amount")
    .eq("team_id", rel.vassal_team_id)
    .eq("resource_type", "resilience")
    .maybeSingle();
  if (res) {
    await supabase
      .from("team_resources")
      .update({
        amount: Math.max(0, (res.amount ?? 0) - REVOLT_RESILIENCE_COST),
        updated_at: now,
      })
      .eq("id", res.id);
  }

  // 3. Grant the liege a casus belli
  await supabase.from("casus_belli_grants").insert({
    holder_team_id: rel.overlord_team_id,
    grantor_team_id: rel.vassal_team_id,
    granted_epoch: game.current_epoch,
    expires_epoch: game.current_epoch + CASUS_BELLI_VALID_EPOCHS,
  });

  // 4. Audit event
  await supabase.from("game_events").insert({
    game_id: gameId,
    epoch: game.current_epoch,
    event_type: "vassalage_revolt",
    description: `${rel.vassal_team_id} threw off ${rel.overlord_team_id}'s yoke`,
    affected_team_ids: [rel.overlord_team_id, rel.vassal_team_id],
    metadata: {
      relationship_id,
      revolt_justification: revolt_justification.trim(),
      resilience_cost: REVOLT_RESILIENCE_COST,
      casus_belli_granted_to: rel.overlord_team_id,
      casus_belli_expires_epoch: game.current_epoch + CASUS_BELLI_VALID_EPOCHS,
    },
  });

  return NextResponse.json({
    status: "revolt",
    relationship_id,
    resilience_cost: REVOLT_RESILIENCE_COST,
    casus_belli_granted_to: rel.overlord_team_id,
  });
}
