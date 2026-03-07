import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================
// Export All Portfolios API
// Generates portfolio HTML for all teams in a game
// Returns JSON with HTML per team (client zips)
// ============================================

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { gameId } = body as { gameId: string };

  if (!gameId) {
    return NextResponse.json({ error: "gameId required" }, { status: 400 });
  }

  // Get all teams
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, name")
    .eq("game_id", gameId);

  if (error || !teams) {
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }

  // Generate portfolio for each team by calling the per-team endpoint internally
  const baseUrl = req.nextUrl.origin;
  const portfolios: { teamId: string; teamName: string; html: string }[] = [];

  for (const team of teams) {
    try {
      const res = await fetch(`${baseUrl}/api/epilogue/export/${team.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ gameId }),
      });

      if (res.ok) {
        const html = await res.text();
        portfolios.push({
          teamId: team.id,
          teamName: team.name,
          html,
        });
      }
    } catch (err) {
      console.error(`Portfolio error for team ${team.id}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    count: portfolios.length,
    portfolios,
  });
}
