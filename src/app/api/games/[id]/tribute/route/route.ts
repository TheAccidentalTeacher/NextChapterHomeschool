// ============================================================
// POST /api/games/[id]/tribute/route
// ============================================================
// Realms v1.5 — vassal tribute routing for an epoch.
// Called by the DM (or automatically by the epoch advancement hook)
// at end-of-epoch. For each active vassal_relationship, transfers
// tribute_percent of the vassal's recent yields from the vassal's
// team_resources to the liege's team_resources.
//
// Body: { epoch?: number }  (defaults to games.current_epoch)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeacher } from "@/lib/auth/roles";
import { calculateTribute } from "@/lib/game/vassal-engine";

type RouteParams = { params: Promise<{ id: string }> };

// Trackable resources the engine routes
const TRIBUTED_RESOURCES = ["production", "reach", "legacy", "resilience", "food"] as const;
type TributedResource = (typeof TRIBUTED_RESOURCES)[number];

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: gameId } = await params;

  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Teacher only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const epoch: number = typeof body.epoch === "number" ? body.epoch : game.current_epoch;

  // Load active vassal relationships for this game
  const { data: relationships } = await supabase
    .from("vassal_relationships")
    .select("id, overlord_team_id, vassal_team_id, tribute_percent, start_epoch, end_epoch, is_active")
    .eq("game_id", gameId)
    .eq("is_active", true);

  if (!relationships || relationships.length === 0) {
    return NextResponse.json({ routed: 0, transfers: [], note: "No active vassal relationships" });
  }

  const transfers: Array<{
    relationship_id: string;
    overlord_team_id: string;
    vassal_team_id: string;
    tribute_percent: number;
    resources: Partial<Record<TributedResource, number>>;
  }> = [];

  for (const rel of relationships) {
    // Auto-dissolve expired relationships rather than routing tribute
    if (rel.end_epoch !== null && epoch > rel.end_epoch) {
      await supabase
        .from("vassal_relationships")
        .update({ is_active: false })
        .eq("id", rel.id);
      await supabase.from("game_events").insert({
        game_id: gameId,
        epoch,
        event_type: "vassalage_expired",
        description: `Vassalage expired: ${rel.vassal_team_id} under ${rel.overlord_team_id}`,
        affected_team_ids: [rel.overlord_team_id, rel.vassal_team_id],
        metadata: { relationship_id: rel.id, end_epoch: rel.end_epoch },
      });
      continue;
    }

    const tributeRate = (rel.tribute_percent ?? 20) / 100;

    // Snapshot vassal's current resources (the "earned" side we tribute from)
    const { data: vassalRows } = await supabase
      .from("team_resources")
      .select("id, resource_type, amount")
      .eq("team_id", rel.vassal_team_id);

    const vassalMap: Record<string, number> = {};
    for (const row of vassalRows ?? []) {
      vassalMap[row.resource_type] = row.amount ?? 0;
    }

    const { tribute } = calculateTribute(vassalMap, tributeRate);

    // Apply: vassal loses tribute, liege gains it — for each resource type
    const applied: Partial<Record<TributedResource, number>> = {};
    for (const resource of TRIBUTED_RESOURCES) {
      const amt = tribute[resource] ?? 0;
      if (amt <= 0) continue;
      applied[resource] = amt;

      const vassalRow = (vassalRows ?? []).find((r) => r.resource_type === resource);
      if (vassalRow) {
        await supabase
          .from("team_resources")
          .update({
            amount: Math.max(0, (vassalRow.amount ?? 0) - amt),
            updated_at: new Date().toISOString(),
          })
          .eq("id", vassalRow.id);
      }

      const { data: liegeRow } = await supabase
        .from("team_resources")
        .select("id, amount")
        .eq("team_id", rel.overlord_team_id)
        .eq("resource_type", resource)
        .maybeSingle();
      if (liegeRow) {
        await supabase
          .from("team_resources")
          .update({
            amount: (liegeRow.amount ?? 0) + amt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", liegeRow.id);
      } else {
        await supabase.from("team_resources").insert({
          team_id: rel.overlord_team_id,
          resource_type: resource,
          amount: amt,
        });
      }
    }

    transfers.push({
      relationship_id: rel.id,
      overlord_team_id: rel.overlord_team_id,
      vassal_team_id: rel.vassal_team_id,
      tribute_percent: rel.tribute_percent ?? 20,
      resources: applied,
    });

    // Audit event per transfer (enables post-game replay + Guardrail 2 verification)
    await supabase.from("game_events").insert({
      game_id: gameId,
      epoch,
      event_type: "tribute_routed",
      description: `Tribute routed: ${rel.vassal_team_id} → ${rel.overlord_team_id} at ${rel.tribute_percent}%`,
      affected_team_ids: [rel.overlord_team_id, rel.vassal_team_id],
      metadata: { relationship_id: rel.id, tribute_percent: rel.tribute_percent, resources_routed: applied },
    });
  }

  return NextResponse.json({ routed: transfers.length, transfers });
}
