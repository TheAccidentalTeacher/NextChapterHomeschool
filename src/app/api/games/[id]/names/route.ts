// ============================================
// GET /api/games/[id]/names — list all pending civ name submissions for a game
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id } = await params;
    const supabase = await createClient();

    // Verify game belongs to teacher
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("id", id)
      .eq("teacher_id", teacherId)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get all teams for this game
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name, civilization_name")
      .eq("game_id", id);

    if (!teams || teams.length === 0) {
      return NextResponse.json({ pending: [] });
    }

    const teamIds = teams.map((t) => t.id);

    // Get all pending (unapproved) name submissions
    const { data: submissions } = await supabase
      .from("civilization_names")
      .select("*")
      .in("team_id", teamIds)
      .eq("approved_by_teacher", false);

    const pending = (submissions ?? []).map((sub) => {
      const team = teams.find((t) => t.id === sub.team_id);
      return {
        team_id: sub.team_id,
        team_name: team?.name ?? "Unknown Team",
        submitted_name: sub.name,
        submission_id: sub.id,
      };
    });

    return NextResponse.json({ pending });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
