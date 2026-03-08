import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";

/**
 * POST /api/solo/[gameId]/cpu-advance
 * AI DM resolves the epoch:
 * - CPU teams auto-score all 4 rounds
 * - Apply resource yields for all CPU teams
 * - Apply 10% bank decay to all teams
 * - Apply population growth / famine
 * - Advance game to next epoch
 */

const RESOURCE_TYPES = ["production", "reach", "legacy", "resilience", "food"] as const;
const DECAY_TYPES = ["production", "reach", "legacy", "resilience"] as const;

const ROUND_TO_PRIMARY: Record<string, string> = {
  BUILD: "production",
  EXPAND: "reach",
  DEFINE: "legacy",
  DEFEND: "resilience",
};

function cpuScore(): number {
  const roll = Math.random();
  if (roll < 0.10) return 2;
  if (roll < 0.35) return 3;
  if (roll < 0.70) return 4;
  return 5;
}

function cpuMultiplier(score: number): number {
  const table: Record<number, number> = { 2: 0.75, 3: 1.0, 4: 1.5, 5: 2.0 };
  return table[score] ?? 1.0;
}

interface TeamResourceMap { [teamId: string]: Record<string, number> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAllResources(supabase: any, teamIds: string[]): Promise<TeamResourceMap> {
  const { data } = await supabase
    .from("team_resources")
    .select("team_id, resource_type, amount")
    .in("team_id", teamIds);
  const map: TeamResourceMap = {};
  for (const r of (data ?? []) as Array<{ team_id: string; resource_type: string; amount: number }>) {
    if (!map[r.team_id]) map[r.team_id] = {};
    map[r.team_id][r.resource_type] = r.amount ?? 0;
  }
  return map;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateResource(supabase: any, teamId: string, resourceType: string, newAmount: number) {
  await supabase
    .from("team_resources")
    .update({ amount: Math.max(0, newAmount) })
    .eq("team_id", teamId)
    .eq("resource_type", resourceType);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const body = await req.json();
  const { playerTeamId } = body;

  if (!playerTeamId) {
    return NextResponse.json({ error: "Missing playerTeamId" }, { status: 400 });
  }

  const supabase = createDirectClient();

  // Get game
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const currentEpoch = game.current_epoch;

  // Get all teams
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, civilization_name, population")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (!teams?.length) {
    return NextResponse.json({ error: "No teams found" }, { status: 404 });
  }

  const cpuTeams = teams.filter((t) => t.id !== playerTeamId);
  const allTeamIds = teams.map((t) => t.id);

  // Fetch all current resources
  let resources = await fetchAllResources(supabase, allTeamIds);

  // === CPU TEAMS: generate and apply yields for all 4 rounds ===
  const cpuGains: Record<string, { production: number; reach: number; legacy: number; resilience: number }> = {};

  for (const team of cpuTeams) {
    const gains = { production: 0, reach: 0, legacy: 0, resilience: 0 };

    for (const round of ["BUILD", "EXPAND", "DEFINE", "DEFEND"]) {
      const score = cpuScore();
      const mult = cpuMultiplier(score);
      const earned = Math.round(score * 5 * mult);

      // Routing: 60% primary, 20% food, 20% resilience
      const primary = ROUND_TO_PRIMARY[round];
      const storeAmt = Math.round(earned * 0.6);
      const foodAmt = Math.round(earned * 0.2);
      const defAmt = earned - storeAmt - foodAmt;

      if (!resources[team.id]) resources[team.id] = {};
      resources[team.id][primary] = (resources[team.id][primary] ?? 0) + storeAmt;
      resources[team.id]["food"] = (resources[team.id]["food"] ?? 0) + foodAmt;
      if (primary !== "resilience") {
        resources[team.id]["resilience"] = (resources[team.id]["resilience"] ?? 0) + defAmt;
      } else {
        resources[team.id]["resilience"] = (resources[team.id]["resilience"] ?? 0) + defAmt;
      }

      if (primary === "production") gains.production += storeAmt;
      if (primary === "reach") gains.reach += storeAmt;
      if (primary === "legacy") gains.legacy += storeAmt;
      if (primary === "resilience") gains.resilience += storeAmt;
    }

    cpuGains[team.id] = gains;
  }

  // === ALL TEAMS: apply 10% bank decay ===
  for (const teamId of allTeamIds) {
    if (!resources[teamId]) continue;
    for (const rt of DECAY_TYPES) {
      const current = resources[teamId][rt] ?? 0;
      const decayed = Math.floor(current * 0.9);
      resources[teamId][rt] = decayed;
    }
  }

  // === ALL TEAMS: population update ===
  const populationUpdates: Array<{ id: string; newPop: number }> = [];
  for (const team of teams) {
    const food = resources[team.id]?.food ?? 0;
    let newPop = team.population;
    if (food >= 5) {
      newPop = Math.min(team.population + 1, 50); // cap at 50
      resources[team.id]["food"] = food - 2; // consume food for growth
    } else if (food <= 0 && team.population > 5) {
      newPop = team.population - 1; // famine
    }
    if (newPop !== team.population) {
      populationUpdates.push({ id: team.id, newPop });
    }
  }

  // === WRITE ALL RESOURCE UPDATES TO DB ===
  const resourceUpdates: Promise<void>[] = [];
  for (const teamId of allTeamIds) {
    if (!resources[teamId]) continue;
    for (const rt of RESOURCE_TYPES) {
      const amount = resources[teamId][rt] ?? 0;
      resourceUpdates.push(updateResource(supabase, teamId, rt, amount));
    }
  }
  await Promise.all(resourceUpdates);

  // Update populations
  for (const { id, newPop } of populationUpdates) {
    await supabase.from("teams").update({ population: newPop }).eq("id", id);
  }

  // === ADVANCE EPOCH ===
  const newEpoch = currentEpoch + 1;
  await supabase
    .from("games")
    .update({
      current_epoch: newEpoch,
      current_round: "login",
    })
    .eq("id", gameId);

  // === BUILD STANDINGS ===
  // Re-fetch updated resources for standings
  const updatedResources = await fetchAllResources(supabase, allTeamIds);
  const { data: updatedTeams } = await supabase
    .from("teams")
    .select("id, name, civilization_name, population")
    .eq("game_id", gameId);

  const standings = (updatedTeams ?? [])
    .map((t) => {
      const res = updatedResources[t.id] ?? {};
      const total = (res.production ?? 0) + (res.reach ?? 0) + (res.legacy ?? 0) + (res.resilience ?? 0);
      return {
        teamId: t.id,
        name: t.name,
        civName: t.civilization_name,
        population: t.population,
        resources: res,
        total,
        isPlayer: t.id === playerTeamId,
      };
    })
    .sort((a, b) => b.total - a.total)
    .map((t, i) => ({ ...t, rank: i + 1 }));

  return NextResponse.json({
    newEpoch,
    completedEpoch: currentEpoch,
    standings,
    cpuGains,
  });
}
