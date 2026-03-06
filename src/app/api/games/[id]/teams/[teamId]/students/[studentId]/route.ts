// ============================================
// PUT /api/games/[id]/teams/[teamId]/students/[studentId] — update student role/absence
// DELETE /api/games/[id]/teams/[teamId]/students/[studentId] — remove student from team
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/roles";

type RouteParams = {
  params: Promise<{ id: string; teamId: string; studentId: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id, teamId, studentId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Verify game ownership
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("id", id)
      .eq("teacher_id", teacherId)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Build update payload
    const update: Record<string, unknown> = {};
    if (body.assigned_role) update.assigned_role = body.assigned_role;
    if (body.is_absent !== undefined) update.is_absent = body.is_absent;
    if (body.display_name) update.display_name = body.display_name;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data: member, error } = await supabase
      .from("team_members")
      .update(update)
      .eq("id", studentId)
      .eq("team_id", teamId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id, teamId, studentId } = await params;
    const supabase = await createClient();

    // Verify game ownership
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("id", id)
      .eq("teacher_id", teacherId)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", studentId)
      .eq("team_id", teamId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
