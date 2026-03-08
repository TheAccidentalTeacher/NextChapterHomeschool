import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";

/**
 * POST /api/solo/create
 * Creates a new solo game: 6 teams (team 1 = player, 2–6 = CPU).
 * No Clerk auth required — solo mode uses its own identity model.
 */

const SOLO_CIVS = [
  { name: "Your Team", civName: "The Ember Dominion", regionId: 1 },
  { name: "CPU — Stormhold", civName: "Stormhold Republic", regionId: 2 },
  { name: "CPU — Ironveil", civName: "Ironveil Confederacy", regionId: 3 },
  { name: "CPU — Tidecrest", civName: "Tidecrest Alliance", regionId: 4 },
  { name: "CPU — Shadowpeak", civName: "Shadowpeak Kingdom", regionId: 5 },
  { name: "CPU — Sunforge", civName: "Sunforge Empire", regionId: 6 },
];

const STARTING_RESOURCES = [
  { resource_type: "production", amount: 10 },
  { resource_type: "reach", amount: 10 },
  { resource_type: "legacy", amount: 5 },
  { resource_type: "resilience", amount: 5 },
  { resource_type: "food", amount: 15 },
];

export async function POST(_req: NextRequest) {
  const supabase = createDirectClient();

  // 1. Create the game
  const { data: game, error: gameErr } = await supabase
    .from("games")
    .insert({
      name: `Solo Adventure — ${new Date().toLocaleDateString()}`,
      teacher_id: "solo_mode",
      current_epoch: 1,
      current_round: "login",
      epoch_phase: "active",
    })
    .select("id")
    .single();

  if (gameErr || !game) {
    console.error("[solo/create] game insert error:", gameErr);
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
  }

  const gameId = game.id;

  // 2. Create 6 teams
  const teamInserts = SOLO_CIVS.map((civ) => ({
    game_id: gameId,
    name: civ.name,
    civilization_name: civ.civName,
    region_id: civ.regionId,
    population: 10,
  }));

  const { data: teams, error: teamsErr } = await supabase
    .from("teams")
    .insert(teamInserts)
    .select("id, name, civilization_name, region_id");

  if (teamsErr || !teams || teams.length < 6) {
    console.error("[solo/create] teams insert error:", teamsErr);
    return NextResponse.json({ error: "Failed to create teams" }, { status: 500 });
  }

  // 3. Initialize team_resources for all 6 teams
  const resourceInserts = teams.flatMap((team) =>
    STARTING_RESOURCES.map((r) => ({
      team_id: team.id,
      resource_type: r.resource_type,
      amount: r.amount,
    }))
  );

  const { error: resErr } = await supabase
    .from("team_resources")
    .insert(resourceInserts);

  if (resErr) {
    console.error("[solo/create] resources insert error:", resErr);
    return NextResponse.json({ error: "Failed to initialize resources" }, { status: 500 });
  }

  const playerTeam = teams[0];
  const cpuTeams = teams.slice(1);

  return NextResponse.json({
    gameId,
    playerTeamId: playerTeam.id,
    playerTeamName: playerTeam.name,
    playerCivName: playerTeam.civilization_name,
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      civName: t.civilization_name,
      regionId: t.region_id,
      isCpu: t.id !== playerTeam.id,
    })),
    cpuTeamIds: cpuTeams.map((t) => t.id),
  });
}
