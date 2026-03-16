// ============================================================
// GET  /api/games/[id]/covers — current epoch's substitute assignments
// POST /api/games/[id]/covers — assign a present student to cover an absent one
// DELETE /api/games/[id]/covers — clear a cover (if student returns mid-day)
// ============================================================
// epoch_role_assignments row when covering:
//   clerk_user_id = the covering (present) student
//   role          = the absent student's role (what they're covering)
//   is_substitute = true
//   original_role = the covering student's own assigned_role
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

// ── GET — fetch all current-epoch cover assignments for this game ─────────
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const teacherId = await requireTeacher();
    const { id: gameId } = await params;
    const supabase = await createClient();

    // Verify teacher owns this game
    const { data: game } = await supabase
      .from("games")
      .select("current_epoch")
      .eq("id", gameId)
      .eq("teacher_id", teacherId)
      .single();

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const { data: teams } = await supabase
      .from("teams")
      .select("id")
      .eq("game_id", gameId);

    if (!teams?.length) return NextResponse.json({ covers: [] });

    const { data: covers } = await supabase
      .from("epoch_role_assignments")
      .select("id, team_id, clerk_user_id, role, original_role, is_substitute")
      .in("team_id", teams.map((t) => t.id))
      .eq("epoch", game.current_epoch)
      .eq("is_substitute", true);

    // Resolve covering student display names from team_members
    const coveringIds = (covers ?? []).map((c) => c.clerk_user_id);
    let nameMap: Record<string, string> = {};
    if (coveringIds.length > 0) {
      const { data: coveringMembers } = await supabase
        .from("team_members")
        .select("clerk_user_id, display_name")
        .in("clerk_user_id", coveringIds)
        .in("team_id", teams.map((t) => t.id));
      for (const cm of coveringMembers ?? []) {
        nameMap[cm.clerk_user_id] = cm.display_name;
      }
    }

    return NextResponse.json({
      epoch: game.current_epoch,
      covers: (covers ?? []).map((c) => ({ ...c, covering_name: nameMap[c.clerk_user_id] ?? null })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

// ── POST — assign a cover ────────────────────────────────────────────────
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id: gameId } = await params;
    const supabase = await createClient();

    const { absent_member_id, covering_member_id } = await request.json() as {
      absent_member_id: string;   // team_members.id of the absent student
      covering_member_id: string; // team_members.id of the covering student
    };

    if (!absent_member_id || !covering_member_id) {
      return NextResponse.json(
        { error: "absent_member_id and covering_member_id are required" },
        { status: 400 }
      );
    }

    // Verify teacher owns this game
    const { data: game } = await supabase
      .from("games")
      .select("id, current_epoch")
      .eq("id", gameId)
      .eq("teacher_id", teacherId)
      .single();

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    // Fetch both members
    const { data: members } = await supabase
      .from("team_members")
      .select("id, team_id, clerk_user_id, assigned_role, is_absent, display_name")
      .in("id", [absent_member_id, covering_member_id]);

    const absent = members?.find((m) => m.id === absent_member_id);
    const covering = members?.find((m) => m.id === covering_member_id);

    if (!absent || !covering) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (!absent.is_absent) {
      return NextResponse.json({ error: "Absent member is not marked absent" }, { status: 400 });
    }
    if (covering.is_absent) {
      return NextResponse.json({ error: "Covering member is also absent" }, { status: 400 });
    }
    if (absent.team_id !== covering.team_id) {
      return NextResponse.json({ error: "Members must be on the same team" }, { status: 400 });
    }

    // Remove any existing cover for this absent role in this epoch on this team
    await supabase
      .from("epoch_role_assignments")
      .delete()
      .eq("team_id", absent.team_id)
      .eq("epoch", game.current_epoch)
      .eq("role", absent.assigned_role)
      .eq("is_substitute", true);

    // Also clear any existing assignment for the covering student this epoch
    // (they can only cover one absent role at a time)
    await supabase
      .from("epoch_role_assignments")
      .delete()
      .eq("team_id", covering.team_id)
      .eq("epoch", game.current_epoch)
      .eq("clerk_user_id", covering.clerk_user_id)
      .eq("is_substitute", true);

    // Insert the new cover assignment
    const { data: assignment, error } = await supabase
      .from("epoch_role_assignments")
      .insert({
        team_id: absent.team_id,
        epoch: game.current_epoch,
        clerk_user_id: covering.clerk_user_id,
        role: absent.assigned_role,
        is_substitute: true,
        original_role: covering.assigned_role,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      assignment,
      message: `${covering.display_name} will cover ${absent.display_name}'s ${absent.assigned_role} role this epoch`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

// ── DELETE — clear a cover (student returned / wrong assignment) ──────────
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id: gameId } = await params;
    const supabase = await createClient();

    const { absent_member_id } = await request.json() as { absent_member_id: string };

    const { data: game } = await supabase
      .from("games")
      .select("id, current_epoch")
      .eq("id", gameId)
      .eq("teacher_id", teacherId)
      .single();

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const { data: absent } = await supabase
      .from("team_members")
      .select("team_id, assigned_role")
      .eq("id", absent_member_id)
      .single();

    if (!absent) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    await supabase
      .from("epoch_role_assignments")
      .delete()
      .eq("team_id", absent.team_id)
      .eq("epoch", game.current_epoch)
      .eq("role", absent.assigned_role)
      .eq("is_substitute", true);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
