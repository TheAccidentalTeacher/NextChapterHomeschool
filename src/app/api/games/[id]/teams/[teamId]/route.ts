// DELETE /api/games/[id]/teams/[teamId]
// Teacher-only: removes a team and all its members + resources.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string; teamId: string }> };

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id: gameId, teamId } = await params;
    const supabase = await createClient();

    // Verify game belongs to this teacher
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("id", gameId)
      .eq("teacher_id", teacherId)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Verify team belongs to this game
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", teamId)
      .eq("game_id", gameId)
      .single();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Cascade delete: members, resources, submissions first (FK may handle this,
    // but be explicit to avoid constraint errors)
    await supabase.from("team_members").delete().eq("team_id", teamId);
    await supabase.from("team_resources").delete().eq("team_id", teamId);
    await supabase.from("epoch_submissions").delete().eq("team_id", teamId);

    const { error } = await supabase.from("teams").delete().eq("id", teamId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
