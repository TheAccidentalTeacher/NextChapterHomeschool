import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId, isTeacher } from "@/lib/auth/roles";
import { rollForAllTeams, rollForTeam } from "@/lib/game/d20-roller";
import { EVENT_DECK, rollD20Event } from "@/lib/game/event-deck";
import { resolveEvent, clampResources } from "@/lib/game/event-resolver";

/**
 * GET /api/games/[id]/d20-events — Fetch d20 events for a game/epoch
 * Query params: ?epoch=2&team_id=xxx (optional)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const epoch = req.nextUrl.searchParams.get("epoch");
  const teamId = req.nextUrl.searchParams.get("team_id");
  const supabase = await createClient();

  let query = supabase
    .from("d20_events")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  if (epoch) query = query.eq("epoch", parseInt(epoch));
  if (teamId) query = query.eq("team_id", teamId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data });
}

/**
 * POST /api/games/[id]/d20-events — Fire d20 events
 * Body options:
 *   { action: "auto_roll_all" } — Roll d20 for all teams
 *   { action: "fire_event", event_id: string, team_ids: string[] } — Fire specific event at teams
 *   { action: "roll_single", team_id: string } — Roll d20 for single team
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only teachers can fire events
  const teacher = await isTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Teacher only" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  const supabase = await createClient();

  // Get game state
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const epoch = game.current_epoch;

  if (action === "auto_roll_all") {
    // Get all teams in this game
    const { data: teams } = await supabase
      .from("teams")
      .select("id, region_id")
      .eq("game_id", gameId);

    if (!teams || teams.length === 0) {
      return NextResponse.json({ error: "No teams found" }, { status: 404 });
    }

    // Determine which teams are coastal (for piracy events)
    // Coastal regions: 3 (Central America/Caribbean), 11 (Southeast Asia), 12 (Pacific)
    const COASTAL_REGIONS = [3, 5, 11, 12];
    const teamConfigs = teams.map((t) => ({
      id: t.id,
      isCoastal: COASTAL_REGIONS.includes(t.region_id),
    }));

    const rollResults = rollForAllTeams(teamConfigs);

    // Process each roll
    const results = [];
    for (const result of rollResults) {
      if (!result.event) continue;

      // Get team assets and resources for resolution
      const [assetsRes, resourcesRes] = await Promise.all([
        supabase
          .from("team_assets")
          .select("*")
          .eq("team_id", result.teamId)
          .eq("is_active", true),
        supabase
          .from("team_resources")
          .select("*")
          .eq("team_id", result.teamId),
      ]);

      const teamAssets = assetsRes.data ?? [];
      const resourceMap: Record<string, number> = {};
      for (const r of resourcesRes.data ?? []) {
        resourceMap[r.resource_type] = r.amount;
      }

      // Resolve event effects
      const resolution = resolveEvent(
        result.event,
        result.teamId,
        teamAssets,
        resourceMap
      );

      // Save d20 event record
      await supabase.from("d20_events").insert({
        game_id: gameId,
        epoch,
        team_id: result.teamId,
        roll: result.roll,
        event_key: result.event.id,
        event_description: resolution.summary,
        coastal_only: result.event.coastalOnly,
        resource_impact: resolution.resourceChanges,
        resolved: true,
      });

      // Apply resource changes
      const newResources = clampResources(resourceMap, resolution.resourceChanges);
      for (const [resType, amount] of Object.entries(newResources)) {
        await supabase
          .from("team_resources")
          .upsert(
            {
              team_id: result.teamId,
              resource_type: resType,
              amount,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "team_id,resource_type" }
          );
      }

      // Apply population changes
      if (resolution.populationDelta !== 0) {
        const { data: team } = await supabase
          .from("teams")
          .select("population")
          .eq("id", result.teamId)
          .single();

        const newPop = Math.max(1, (team?.population ?? 1) + resolution.populationDelta);
        await supabase
          .from("teams")
          .update({ population: newPop })
          .eq("id", result.teamId);
      }

      // Deactivate destroyed assets
      for (const destroyed of resolution.assetsDestroyed) {
        await supabase
          .from("team_assets")
          .update({ is_active: false })
          .eq("id", destroyed.assetId);
      }

      // Deactivate consumed supplies
      for (const consumed of resolution.suppliesConsumed) {
        await supabase
          .from("team_assets")
          .update({ is_active: false })
          .eq("id", consumed.assetId);
      }

      // Log to game_events
      await supabase.from("game_events").insert({
        game_id: gameId,
        epoch,
        event_type: "d20_event",
        description: resolution.summary,
        affected_team_ids: [result.teamId],
        metadata: {
          roll: result.roll,
          event_key: result.event.id,
          mitigated: resolution.wasMitigated,
        },
      });

      results.push({
        teamId: result.teamId,
        roll: result.roll,
        event: result.event.name,
        summary: resolution.summary,
        mitigated: resolution.wasMitigated,
      });
    }

    return NextResponse.json({ results });
  }

  if (action === "fire_event") {
    const { event_id, team_ids } = body;
    if (!event_id || !team_ids || team_ids.length === 0) {
      return NextResponse.json(
        { error: "Missing event_id or team_ids" },
        { status: 400 }
      );
    }

    const eventDef = EVENT_DECK.find((e) => e.id === event_id);
    if (!eventDef) {
      return NextResponse.json(
        { error: `Unknown event: ${event_id}` },
        { status: 400 }
      );
    }

    const results = [];
    for (const teamId of team_ids) {
      // Get team data
      const [assetsRes, resourcesRes] = await Promise.all([
        supabase
          .from("team_assets")
          .select("*")
          .eq("team_id", teamId)
          .eq("is_active", true),
        supabase
          .from("team_resources")
          .select("*")
          .eq("team_id", teamId),
      ]);

      const teamAssets = assetsRes.data ?? [];
      const resourceMap: Record<string, number> = {};
      for (const r of resourcesRes.data ?? []) {
        resourceMap[r.resource_type] = r.amount;
      }

      const resolution = resolveEvent(eventDef, teamId, teamAssets, resourceMap);

      // Save and apply (same as auto_roll_all logic)
      await supabase.from("d20_events").insert({
        game_id: gameId,
        epoch,
        team_id: teamId,
        roll: 0, // manual fire, no roll
        event_key: eventDef.id,
        event_description: resolution.summary,
        coastal_only: eventDef.coastalOnly,
        resource_impact: resolution.resourceChanges,
        resolved: true,
      });

      const newResources = clampResources(resourceMap, resolution.resourceChanges);
      for (const [resType, amount] of Object.entries(newResources)) {
        await supabase
          .from("team_resources")
          .upsert(
            {
              team_id: teamId,
              resource_type: resType,
              amount,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "team_id,resource_type" }
          );
      }

      if (resolution.populationDelta !== 0) {
        const { data: team } = await supabase
          .from("teams")
          .select("population")
          .eq("id", teamId)
          .single();

        const newPop = Math.max(1, (team?.population ?? 1) + resolution.populationDelta);
        await supabase.from("teams").update({ population: newPop }).eq("id", teamId);
      }

      for (const d of resolution.assetsDestroyed) {
        await supabase.from("team_assets").update({ is_active: false }).eq("id", d.assetId);
      }
      for (const c of resolution.suppliesConsumed) {
        await supabase.from("team_assets").update({ is_active: false }).eq("id", c.assetId);
      }

      await supabase.from("game_events").insert({
        game_id: gameId,
        epoch,
        event_type: "d20_event_manual",
        description: resolution.summary,
        affected_team_ids: [teamId],
        metadata: { event_key: eventDef.id, mitigated: resolution.wasMitigated },
      });

      results.push({
        teamId,
        event: eventDef.name,
        summary: resolution.summary,
        mitigated: resolution.wasMitigated,
      });
    }

    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
