// ============================================================
// POST /api/games/[id]/auto-covers
// ============================================================
// Auto-distributes absent students' roles to present teammates
// using round-robin (fewest-extra-roles-first).
//
// Safe to call repeatedly — clears all existing substitute
// assignments for the current epoch then re-builds fresh.
//
// Called automatically when a student is marked absent,
// and via the "New Epoch" button after rotating roles.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id: gameId } = await params;
    const supabase = await createClient();

    // Verify teacher owns this game
    const { data: game } = await supabase
      .from("games")
      .select("id, current_epoch")
      .eq("id", gameId)
      .eq("teacher_id", teacherId)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Fetch all teams for this game
    const { data: teams } = await supabase
      .from("teams")
      .select("id")
      .eq("game_id", gameId);

    if (!teams?.length) {
      return NextResponse.json({ assigned: 0, message: "No teams found" });
    }

    const teamIds = teams.map((t) => t.id);

    // Clear all existing substitute assignments for this epoch
    await supabase
      .from("epoch_role_assignments")
      .delete()
      .in("team_id", teamIds)
      .eq("epoch", game.current_epoch)
      .eq("is_substitute", true);

    // Fetch all members for all teams
    const { data: members } = await supabase
      .from("team_members")
      .select("id, team_id, clerk_user_id, assigned_role, is_absent, display_name")
      .in("team_id", teamIds);

    if (!members?.length) {
      return NextResponse.json({ assigned: 0, message: "No members found" });
    }

    // Group members by team
    const byTeam = new Map<string, typeof members>();
    for (const m of members) {
      const arr = byTeam.get(m.team_id) ?? [];
      arr.push(m);
      byTeam.set(m.team_id, arr);
    }

    // Build cover assignments
    const inserts: Array<{
      team_id: string;
      epoch: number;
      clerk_user_id: string;
      role: string;
      is_substitute: boolean;
      original_role: string;
    }> = [];

    const coverLog: string[] = [];

    for (const [teamId, teamMembers] of byTeam) {
      const absent = teamMembers.filter((m) => m.is_absent);
      const present = teamMembers.filter((m) => !m.is_absent);

      if (absent.length === 0) continue;
      if (present.length === 0) {
        coverLog.push(`Team ${teamId}: entire team absent — no covers possible`);
        continue;
      }

      // Track extra cover load per present student (fewest-first round-robin)
      const coverLoad = new Map<string, number>(
        present.map((m) => [m.id, 0])
      );

      for (const absentMember of absent) {
        // Pick the present student with the fewest covers assigned so far
        let bestId = present[0].id;
        let minLoad = coverLoad.get(present[0].id) ?? 0;

        for (const pm of present) {
          const load = coverLoad.get(pm.id) ?? 0;
          if (load < minLoad) {
            bestId = pm.id;
            minLoad = load;
          }
        }

        const coveringMember = present.find((m) => m.id === bestId)!;
        coverLoad.set(bestId, (coverLoad.get(bestId) ?? 0) + 1);

        inserts.push({
          team_id: teamId,
          epoch: game.current_epoch,
          clerk_user_id: coveringMember.clerk_user_id,
          role: absentMember.assigned_role,
          is_substitute: true,
          original_role: coveringMember.assigned_role,
        });

        coverLog.push(
          `${coveringMember.display_name} covers ${absentMember.display_name}'s ${absentMember.assigned_role}`
        );
      }
    }

    if (inserts.length > 0) {
      const { error } = await supabase
        .from("epoch_role_assignments")
        .insert(inserts);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      assigned: inserts.length,
      epoch: game.current_epoch,
      covers: coverLog,
      message:
        inserts.length === 0
          ? "No absences to cover"
          : `${inserts.length} absent role(s) auto-assigned`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
