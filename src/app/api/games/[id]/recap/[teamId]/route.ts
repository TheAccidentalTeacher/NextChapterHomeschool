import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/games/[id]/recap/[teamId]
 * Returns the most recent daily recap for a team.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  const { id: gameId, teamId } = await params;
  const supabase = await createClient();

  // Get the latest recap for this game
  const { data, error } = await supabase
    .from("daily_recaps")
    .select("*")
    .eq("game_id", gameId)
    .order("epoch", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // No recap yet — return placeholder
    return NextResponse.json({
      epoch: 0,
      recap_text:
        "The world is new. Your civilization stands at the edge of history. What will you build?",
      narration_video_url: null,
    });
  }

  return NextResponse.json(data);
}
