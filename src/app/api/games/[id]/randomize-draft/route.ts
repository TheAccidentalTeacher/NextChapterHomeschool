// ============================================
// POST /api/games/[id]/randomize-draft — teacher only
// Assigns a random draft_order (1..N) to all teams in the game.
// Called by the DM panel "🎲 Randomize Order" button and also
// invoked automatically during game reset.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";
import { requireTeacher } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Teacher only" }, { status: 403 });
  }

  const { id: gameId } = await params;
  const supabase = createDirectClient();

  const { data: teams, error: teamsErr } = await supabase
    .from("teams")
    .select("id, name")
    .eq("game_id", gameId);

  if (teamsErr || !teams || teams.length === 0) {
    return NextResponse.json({ error: "Game or teams not found" }, { status: 404 });
  }

  // Fisher-Yates shuffle
  const shuffled = [...teams];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Assign 1-indexed draft_order to each team
  for (let i = 0; i < shuffled.length; i++) {
    await supabase
      .from("teams")
      .update({ draft_order: i + 1 })
      .eq("id", shuffled[i].id);
  }

  return NextResponse.json({
    ok: true,
    order: shuffled.map((t, i) => ({ teamId: t.id, name: t.name, draft_order: i + 1 })),
  });
}
