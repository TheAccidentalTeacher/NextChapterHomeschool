import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================
// NPC API — CRUD + actions for NPC system
// Decision 64: 5 archetypes, lifecycle, DM controls
// ============================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();

  // Get all NPCs for this game
  const { data: npcs, error } = await supabase
    .from("game_npcs")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get reputation data
  const { data: reputations } = await supabase
    .from("npc_reputations")
    .select("*, teams(name)")
    .eq("game_id", gameId);

  // Group reputations by NPC
  const repsByNPC: Record<
    string,
    { teamId: string; teamName: string; reputation: number }[]
  > = {};

  for (const rep of reputations ?? []) {
    const npcId = rep.npc_id as string;
    if (!repsByNPC[npcId]) repsByNPC[npcId] = [];
    repsByNPC[npcId].push({
      teamId: rep.team_id as string,
      teamName: (rep.teams as { name: string } | null)?.name ?? "Unknown",
      reputation: rep.reputation as number,
    });
  }

  return NextResponse.json({
    npcs: (npcs ?? []).map((n) => ({
      id: n.id,
      archetype: n.archetype,
      name: n.name,
      stage: n.stage,
      subZoneIds: n.sub_zone_ids ?? [],
      route: n.route ?? [],
      lastAction: n.last_action,
      activatedAtEpoch: n.activated_at_epoch,
      metadata: n.metadata ?? {},
    })),
    reputations: repsByNPC,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const { action } = body as { action: string };

  switch (action) {
    // ---- SPAWN ----
    case "spawn": {
      const { archetype, name, subZoneIds, route } = body as {
        archetype: string;
        name: string;
        subZoneIds: string[];
        route: string[];
      };

      const { data, error } = await supabase
        .from("game_npcs")
        .insert({
          game_id: gameId,
          archetype,
          name,
          stage: "dormant",
          sub_zone_ids: subZoneIds,
          route: route.length > 0 ? route : null,
          metadata: {},
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Initialize reputation for all teams
      const { data: teams } = await supabase
        .from("teams")
        .select("id")
        .eq("game_id", gameId);

      if (teams && data) {
        const repInserts = teams.map((t) => ({
          game_id: gameId,
          npc_id: data.id,
          team_id: t.id,
          reputation: 50,
        }));

        await supabase.from("npc_reputations").insert(repInserts);
      }

      // Log event
      await supabase.from("game_events").insert({
        game_id: gameId,
        event_type: "npc_spawned",
        payload: { npcId: data?.id, archetype, name },
      });

      return NextResponse.json({ success: true, npc: data });
    }

    // ---- WAKE ROME ----
    case "wake_rome": {
      const { npcId } = body as { npcId: string };

      const { error } = await supabase
        .from("game_npcs")
        .update({
          stage: "imperial",
          activated_at_epoch: 0, // will be set to current epoch by caller
          last_action: "WAKE ROME triggered by DM",
        })
        .eq("id", npcId)
        .eq("game_id", gameId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await supabase.from("game_events").insert({
        game_id: gameId,
        event_type: "rome_awakened",
        payload: { npcId },
      });

      return NextResponse.json({ success: true });
    }

    // ---- ACTIVATE ----
    case "activate": {
      const { npcId, epoch } = body as { npcId: string; epoch: number };

      await supabase
        .from("game_npcs")
        .update({
          stage: "active",
          activated_at_epoch: epoch,
          last_action: "Activated",
        })
        .eq("id", npcId)
        .eq("game_id", gameId);

      return NextResponse.json({ success: true });
    }

    // ---- OVERRIDE ----
    case "override": {
      const { npcId, overrideAction } = body as {
        npcId: string;
        overrideAction?: string;
      };

      await supabase
        .from("game_npcs")
        .update({
          last_action: overrideAction ?? "DM override — no auto-action this epoch",
          metadata: { overrideThisEpoch: true },
        })
        .eq("id", npcId)
        .eq("game_id", gameId);

      return NextResponse.json({ success: true });
    }

    // ---- GIVE ORDERS ----
    case "give_orders": {
      const { npcId, orders } = body as { npcId: string; orders?: string };

      await supabase
        .from("game_npcs")
        .update({
          last_action: orders ?? "DM issued orders",
          metadata: { dmOrders: orders },
        })
        .eq("id", npcId)
        .eq("game_id", gameId);

      return NextResponse.json({ success: true });
    }

    // ---- DISSOLVE ----
    case "dissolve": {
      const { npcId } = body as { npcId: string };

      await supabase
        .from("game_npcs")
        .update({
          stage: "dissolved",
          sub_zone_ids: [], // territory goes neutral
          last_action: "Dissolved by DM",
        })
        .eq("id", npcId)
        .eq("game_id", gameId);

      await supabase.from("game_events").insert({
        game_id: gameId,
        event_type: "npc_dissolved",
        payload: { npcId },
      });

      return NextResponse.json({ success: true });
    }

    // ---- UPDATE REPUTATION ----
    case "update_reputation": {
      const { npcId, teamId, delta } = body as {
        npcId: string;
        teamId: string;
        delta: number;
      };

      // Get current reputation
      const { data: repRow } = await supabase
        .from("npc_reputations")
        .select("reputation")
        .eq("npc_id", npcId)
        .eq("team_id", teamId)
        .eq("game_id", gameId)
        .single();

      const current = (repRow?.reputation as number) ?? 50;
      const newRep = Math.max(0, Math.min(100, current + delta));

      await supabase
        .from("npc_reputations")
        .upsert({
          game_id: gameId,
          npc_id: npcId,
          team_id: teamId,
          reputation: newRep,
        });

      return NextResponse.json({ success: true, reputation: newRep });
    }

    // ---- ADVANCE LIFECYCLE ----
    case "advance_lifecycle": {
      const { npcId, newStage, territoryChange } = body as {
        npcId: string;
        newStage: string;
        territoryChange: number;
      };

      // Get current sub-zones
      const { data: npc } = await supabase
        .from("game_npcs")
        .select("sub_zone_ids")
        .eq("id", npcId)
        .single();

      let subZones = (npc?.sub_zone_ids as string[]) ?? [];

      if (territoryChange < 0) {
        // Lose sub-zones from the end
        subZones = subZones.slice(0, Math.max(0, subZones.length + territoryChange));
      }
      // For expansion (+1), territory assignment handled separately by DM

      await supabase
        .from("game_npcs")
        .update({
          stage: newStage,
          sub_zone_ids: subZones,
          last_action: `Lifecycle → ${newStage}`,
        })
        .eq("id", npcId)
        .eq("game_id", gameId);

      if (newStage === "fallen") {
        await supabase.from("game_events").insert({
          game_id: gameId,
          event_type: "npc_fallen",
          payload: { npcId },
        });
      }

      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
