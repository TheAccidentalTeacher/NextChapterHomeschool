// ============================================
// PUT /api/games/[id]/teams/[teamId]/name/approve — DM approves/rejects civ name
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string; teamId: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id, teamId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { approved } = body;

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

    // Get the pending name submission
    const { data: submission } = await supabase
      .from("civilization_names")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!submission) {
      return NextResponse.json(
        { error: "No name submission found" },
        { status: 404 }
      );
    }

    if (approved) {
      // Approve: update the submission record
      await supabase
        .from("civilization_names")
        .update({
          approved_by_teacher: true,
          approved_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      // Also set the name on the team itself
      await supabase
        .from("teams")
        .update({ civilization_name: submission.name })
        .eq("id", teamId);

      return NextResponse.json({
        success: true,
        name: submission.name,
        status: "approved",
      });
    } else {
      // Reject: delete the submission so student can resubmit
      await supabase
        .from("civilization_names")
        .delete()
        .eq("id", submission.id);

      return NextResponse.json({
        success: true,
        status: "rejected",
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
