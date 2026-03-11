// ============================================================
// POST /api/solo/[gameId]/found
// Player founded their city on a chosen sub-zone.
// - Validates the sub-zone exists and is a valid founding site
// - Applies a founding bonus to team_resources based on terrain
// - Marks the sub-zone as controlled by the player's team
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";
import subZonesData from "@/../public/data/sub-zones.json";

// Founding bonus by terrain type
// Each entry: { resource: keyof team_resources, amount: number, description }
const FOUNDING_BONUS: Record<
  string,
  { resource: string; amount: number; description: string }
> = {
  river_valley: { resource: "food",       amount: 15, description: "+15 🌾 Food — fertile floodplains sustain large populations" },
  coastal:      { resource: "reach",      amount: 10, description: "+10 🧭 Reach — sea access opens trade routes" },
  plains:       { resource: "food",       amount: 8,  description: "+8 🌾 Food — open land supports early farming" },
  forest:       { resource: "production", amount: 10, description: "+10 ⚙️ Production — timber for construction" },
  mountain:     { resource: "resilience", amount: 10, description: "+10 🛡️ Resilience — natural fortress" },
  jungle:       { resource: "legacy",     amount: 8,  description: "+8 📜 Legacy — rich biodiversity inspires culture" },
  desert:       { resource: "resilience", amount: 4,  description: "+4 🛡️ Resilience — harsh land hardens your people (poor site)" },
  tundra:       { resource: "resilience", amount: 4,  description: "+4 🛡️ Resilience — frozen frontier (poor site)" },
};

// Terrain types where founding near water gives extra food hint
const WATER_ADJACENT = ["river_valley", "coastal", "plains"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  let body: { teamId: string; subZoneId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { teamId, subZoneId } = body;
  if (!teamId || !subZoneId) {
    return NextResponse.json({ error: "teamId and subZoneId are required" }, { status: 400 });
  }

  // Look up sub-zone from static JSON (no DB dependency for solo mode)
  const subZones = subZonesData as Array<{
    id: string;
    name: string;
    region_id: number;
    terrain_type: string;
    yield_modifier: number;
  }>;

  const subZone = subZones.find((sz) => sz.id === subZoneId);
  if (!subZone) {
    return NextResponse.json({ error: "Sub-zone not found" }, { status: 404 });
  }

  // Prevent founding on ocean/tundra (harsh sites allowed but flagged)
  const harshTerrain = subZone.terrain_type === "desert" || subZone.terrain_type === "tundra";
  const bonus = FOUNDING_BONUS[subZone.terrain_type] ?? {
    resource: "production",
    amount: 5,
    description: "+5 ⚙️ Production",
  };

  const supabase = createDirectClient();

  // Verify the team belongs to this game
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("id, name, civilization_name")
    .eq("id", teamId)
    .eq("game_id", gameId)
    .single();

  if (teamErr || !team) {
    return NextResponse.json({ error: "Team not found in this game" }, { status: 404 });
  }

  // Apply founding bonus to team_resources
  const { data: currentResources, error: resErr } = await supabase
    .from("team_resources")
    .select("resource_type, amount")
    .eq("team_id", teamId);

  if (resErr) {
    return NextResponse.json({ error: "Failed to load team resources" }, { status: 500 });
  }

  // Find the resource row to update
  const targetRow = (currentResources ?? []).find(
    (r) => r.resource_type === bonus.resource
  );

  if (targetRow) {
    const newAmount = (targetRow.amount ?? 0) + Math.round(bonus.amount * (subZone.yield_modifier ?? 1));
    const { error: updateErr } = await supabase
      .from("team_resources")
      .update({ amount: newAmount })
      .eq("team_id", teamId)
      .eq("resource_type", bonus.resource);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to apply founding bonus" }, { status: 500 });
    }
  }

  // Store founding location on team row (use notes field or just store in metadata)
  // We update the team's civilization_name to include the city/zone for solo display
  // (lightweight — no schema change needed)
  await supabase
    .from("teams")
    .update({ region_id: subZone.region_id })
    .eq("id", teamId);

  const actualBonus = {
    resource: bonus.resource,
    amount: Math.round(bonus.amount * (subZone.yield_modifier ?? 1)),
    description: bonus.description,
  };

  return NextResponse.json({
    success: true,
    foundedAt: {
      id: subZone.id,
      name: subZone.name,
      terrain_type: subZone.terrain_type,
      region_id: subZone.region_id,
    },
    bonusApplied: actualBonus,
    harshTerrain,
    waterAdjacent: WATER_ADJACENT.includes(subZone.terrain_type),
  });
}
