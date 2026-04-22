// ============================================================
// POST /api/games/[id]/vassalage/respond
// ============================================================
// Realms v1.5 Pass 5 — accept or reject a vassalage proposal.
// On accept: inserts a vassal_relationships row. On reject: marks the
// proposal event resolved without state change.
// Body: { proposal_event_id, decision: 'accept' | 'reject' }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { proposal_event_id, decision } = body ?? {};

  if (!proposal_event_id || (decision !== "accept" && decision !== "reject")) {
    return NextResponse.json(
      { error: "Missing proposal_event_id or decision must be 'accept' | 'reject'" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Load the proposal event
  const { data: evt } = await supabase
    .from("game_events")
    .select("*")
    .eq("id", proposal_event_id)
    .eq("game_id", gameId)
    .eq("event_type", "vassalage_proposed")
    .maybeSingle();
  if (!evt) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  if (evt.metadata?.resolved) {
    return NextResponse.json({ error: "Proposal already resolved" }, { status: 409 });
  }

  const overlordId: string = evt.metadata.overlord_team_id;
  const vassalId: string = evt.metadata.vassal_team_id;
  const proposerId: string = evt.metadata.proposer_team_id;
  // The responder must be a member of the OTHER party (not the proposer)
  const responderTeamId = proposerId === overlordId ? vassalId : overlordId;

  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("clerk_user_id", userId)
    .eq("team_id", responderTeamId)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json(
      { error: "Only a member of the responding civilization can accept or reject" },
      { status: 403 }
    );
  }

  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const now = new Date().toISOString();

  if (decision === "reject") {
    // Mark proposal resolved (update metadata.resolved), emit event
    await supabase
      .from("game_events")
      .update({
        metadata: { ...evt.metadata, resolved: true, resolution: "rejected", resolved_at: now },
      })
      .eq("id", proposal_event_id);

    await supabase.from("game_events").insert({
      game_id: gameId,
      epoch: game.current_epoch,
      event_type: "vassalage_rejected",
      description: `Vassalage rejected between ${overlordId} and ${vassalId}`,
      affected_team_ids: [overlordId, vassalId],
      metadata: { proposal_event_id, resolved_at: now },
    });

    return NextResponse.json({ status: "rejected" });
  }

  // Accept — insert vassal_relationships row
  const tributePercent = evt.metadata.tribute_percent ?? 20;
  const durationEpochs = evt.metadata.duration_epochs ?? null;
  const startEpoch = game.current_epoch;
  const endEpoch = durationEpochs !== null ? startEpoch + durationEpochs : null;

  const { data: relationship, error: relErr } = await supabase
    .from("vassal_relationships")
    .insert({
      game_id: gameId,
      overlord_team_id: overlordId,
      vassal_team_id: vassalId,
      tribute_percent: tributePercent,
      start_epoch: startEpoch,
      end_epoch: endEpoch,
      is_active: true,
    })
    .select()
    .single();

  if (relErr) return NextResponse.json({ error: relErr.message }, { status: 500 });

  // Mark proposal resolved
  await supabase
    .from("game_events")
    .update({
      metadata: {
        ...evt.metadata,
        resolved: true,
        resolution: "accepted",
        resolved_at: now,
        relationship_id: relationship.id,
      },
    })
    .eq("id", proposal_event_id);

  // Emit accepted event
  await supabase.from("game_events").insert({
    game_id: gameId,
    epoch: game.current_epoch,
    event_type: "vassalage_accepted",
    description: `Vassalage accepted: ${vassalId} under ${overlordId} at ${tributePercent}% tribute`,
    affected_team_ids: [overlordId, vassalId],
    metadata: {
      relationship_id: relationship.id,
      tribute_percent: tributePercent,
      start_epoch: startEpoch,
      end_epoch: endEpoch,
    },
  });

  return NextResponse.json(relationship, { status: 201 });
}
