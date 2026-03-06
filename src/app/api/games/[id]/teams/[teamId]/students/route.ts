// ============================================
// GET  /api/games/[id]/teams/[teamId]/students — list students on a team
// POST /api/games/[id]/teams/[teamId]/students — assign student to team
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string; teamId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id, teamId } = await params;
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

    const { data: members, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .order("display_name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: members ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id, teamId } = await params;
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

    const { clerk_user_id, display_name, assigned_role = "architect" } = body;

    if (!clerk_user_id || !display_name) {
      return NextResponse.json(
        { error: "clerk_user_id and display_name are required" },
        { status: 400 }
      );
    }

    // Check team exists and belongs to this game
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", teamId)
      .eq("game_id", id)
      .single();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const { data: member, error } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        clerk_user_id,
        display_name,
        assigned_role,
        is_absent: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
