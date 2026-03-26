// ============================================
// POST /api/games/[id]/presence
// Student heartbeat — call every 30 s to mark yourself as online.
// Updates team_members.last_seen_at for the current Clerk user in this game.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getClerkUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: gameId } = await params;
    const supabase = await createClient();

    // Find this user's team_member row in this game
    const { data: teams } = await supabase
      .from("teams")
      .select("id")
      .eq("game_id", gameId);

    if (!teams?.length) return NextResponse.json({ ok: true });

    const teamIds = teams.map((t) => t.id);

    await supabase
      .from("team_members")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("clerk_user_id", userId)
      .in("team_id", teamIds);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
