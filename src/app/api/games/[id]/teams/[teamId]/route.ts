// DELETE /api/games/[id]/teams/[teamId] — teacher removes a team
// PATCH  /api/games/[id]/teams/[teamId] — Architect claims a starting region

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher, getClerkUserId } from "@/lib/auth/roles";

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

/**
 * PATCH /api/games/[id]/teams/[teamId]
 * Body: { region_id: number }
 * Architect-only: claim a starting region during the login/region-select phase.
 * Region 0 = "unassigned". Any region already taken by another team is rejected.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameId, teamId } = await params;
  const body = await req.json();
  const { region_id } = body as { region_id: number };

  if (!region_id || region_id < 1 || region_id > 12) {
    return NextResponse.json({ error: "region_id must be 1–12" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify the caller is the Architect of this team (or a teacher)
  const { data: member } = await supabase
    .from("team_members")
    .select("assigned_role, secondary_role")
    .eq("team_id", teamId)
    .eq("clerk_user_id", userId)
    .single();

  // Also check if teacher
  const { data: game } = await supabase
    .from("games")
    .select("id, teacher_id, current_round, current_epoch")
    .eq("id", gameId)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const isTeacherUser = game.teacher_id === userId;
  let isArchitect =
    member?.assigned_role === "architect" || member?.secondary_role === "architect";

  // Check epoch_role_assignments for covering roles (absent student substitutes)
  if (!isArchitect && member) {
    const { data: coverAssignment } = await supabase
      .from("epoch_role_assignments")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .eq("covering_role", "architect")
      .eq("is_substitute", true)
      .eq("epoch", game.current_epoch ?? 1)
      .limit(1)
      .maybeSingle();

    if (coverAssignment) {
      isArchitect = true;
    }
  }

  if (!isTeacherUser && !isArchitect) {
    return NextResponse.json(
      { error: "Only the Architect or teacher can pick the starting region" },
      { status: 403 }
    );
  }

  // Check no other team has already claimed this region
  const { data: conflict } = await supabase
    .from("teams")
    .select("id, name")
    .eq("game_id", gameId)
    .eq("region_id", region_id)
    .neq("id", teamId)
    .single();

  if (conflict) {
    return NextResponse.json(
      { error: `Region already claimed by ${(conflict as { name: string }).name}` },
      { status: 409 }
    );
  }

  // Claim the region
  const { error: updateErr } = await supabase
    .from("teams")
    .update({ region_id })
    .eq("id", teamId)
    .eq("game_id", gameId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, region_id });
}
