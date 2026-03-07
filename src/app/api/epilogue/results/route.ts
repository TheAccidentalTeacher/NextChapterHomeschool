import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================
// Epilogue Results API — tallies superlative votes
// Decision 68: Results for Scott to reveal on projector
// ============================================

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const gameId = url.searchParams.get("game_id");

  if (!gameId) {
    return NextResponse.json({ error: "game_id required" }, { status: 400 });
  }

  // Get all votes
  const { data: votes, error } = await supabase
    .from("superlative_votes")
    .select("category, voted_for_team_id")
    .eq("game_id", gameId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get team names
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("game_id", gameId);

  const teamNames: Record<string, string> = {};
  for (const t of teams ?? []) {
    teamNames[t.id] = t.name;
  }

  // Tally votes per category
  const tallies: Record<
    string,
    { teamId: string; teamName: string; votes: number }[]
  > = {};

  for (const vote of votes ?? []) {
    const category = vote.category as string;
    const teamId = vote.voted_for_team_id as string;

    if (!tallies[category]) tallies[category] = [];

    const existing = tallies[category].find((t) => t.teamId === teamId);
    if (existing) {
      existing.votes++;
    } else {
      tallies[category].push({
        teamId,
        teamName: teamNames[teamId] ?? "Unknown",
        votes: 1,
      });
    }
  }

  // Sort each category by votes (descending)
  const results: Record<
    string,
    {
      winner: { teamId: string; teamName: string; votes: number } | null;
      standings: { teamId: string; teamName: string; votes: number }[];
    }
  > = {};

  for (const [category, teams_list] of Object.entries(tallies)) {
    teams_list.sort((a, b) => b.votes - a.votes);
    results[category] = {
      winner: teams_list[0] ?? null,
      standings: teams_list,
    };
  }

  // Total vote count
  const totalVoters = new Set((votes ?? []).map((v) => v.category)).size > 0
    ? Math.floor((votes ?? []).length / new Set((votes ?? []).map((v) => v.category)).size)
    : 0;

  return NextResponse.json({
    results,
    totalVoters,
    totalVotes: (votes ?? []).length,
  });
}
