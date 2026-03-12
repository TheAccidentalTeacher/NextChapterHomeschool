// ============================================
// GET /api/games/[id]/leaderboard — public projector endpoint
// Decision 102: Projector defaults to civilization standings board.
// Returns all teams with their current resource totals, ranked by total.
// No auth required — uses admin direct client for classroom projector display.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";

interface TeamRow {
  id: string;
  name: string;
  civilization_name: string | null;
  region_id: number;
  population: number;
}

interface ResourceRow {
  team_id: string;
  resource_type: string;
  amount: number;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  civName: string;
  regionId: number;
  population: number;
  resources: {
    production: number;
    reach: number;
    legacy: number;
    resilience: number;
  };
  total: number;
  rank: number;
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id: gameId } = await params;
    const supabase = createDirectClient();

    // Fetch teams first so we have IDs to filter resources
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, civilization_name, region_id, population")
      .eq("game_id", gameId)
      .order("name");

    const teams = (teamData ?? []) as unknown as TeamRow[];
    const teamIds = teams.map((t) => t.id);

    const { data: resRows } = teamIds.length
      ? await supabase
          .from("team_resources")
          .select("team_id, resource_type, amount")
          .in("team_id", teamIds)
      : { data: [] };

    const resources = (resRows ?? []) as unknown as ResourceRow[];

    // Build resource map keyed by team_id
    const resMap: Record<string, Record<string, number>> = {};
    for (const row of resources) {
      if (!resMap[row.team_id]) resMap[row.team_id] = {};
      resMap[row.team_id][row.resource_type] = row.amount;
    }

    // Build leaderboard entries
    const entries: Omit<LeaderboardEntry, "rank">[] = teams.map((team) => {
      const tr = resMap[team.id] ?? {};
      const production = tr.production ?? 0;
      const reach = tr.reach ?? 0;
      const legacy = tr.legacy ?? 0;
      const resilience = tr.resilience ?? 0;
      const total = production + reach + legacy + resilience;
      return {
        teamId: team.id,
        teamName: team.name,
        civName: team.civilization_name ?? team.name,
        regionId: team.region_id,
        population: team.population,
        resources: { production, reach, legacy, resilience },
        total,
      };
    });

    // Sort by total desc, then population desc as tiebreaker
    entries.sort((a, b) => b.total - a.total || b.population - a.population);

    const ranked: LeaderboardEntry[] = entries.map((e, i) => ({ ...e, rank: i + 1 }));

    return NextResponse.json({ leaderboard: ranked, epoch: null, gameId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
