// ============================================
// GET /api/games/[id]/roster
// Teacher-only — returns all teams with members, online/absence status,
// and current epoch cover assignments so the DM can see who is covering
// absent teammates' roles.
// A member is "online" if last_seen_at is within the last 2 minutes.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id: gameId } = await params;
    const supabase = await createClient();

    const { data: game } = await supabase
      .from("games")
      .select("id, current_epoch")
      .eq("id", gameId)
      .eq("teacher_id", teacherId)
      .single();

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const { data: teams } = await supabase
      .from("teams")
      .select("id, name, civilization_name, region_id")
      .eq("game_id", gameId)
      .order("name");

    if (!teams?.length) return NextResponse.json({ teams: [] });

    const teamIds = teams.map((t) => t.id);

    const [membersResult, coversResult] = await Promise.all([
      supabase
        .from("team_members")
        .select("id, team_id, clerk_user_id, display_name, assigned_role, secondary_role, is_absent, last_seen_at")
        .in("team_id", teamIds)
        .order("display_name"),
      supabase
        .from("epoch_role_assignments")
        .select("team_id, clerk_user_id, role, original_role")
        .in("team_id", teamIds)
        .eq("epoch", game.current_epoch)
        .eq("is_substitute", true),
    ]);

    const members = membersResult.data ?? [];
    const covers = coversResult.data ?? [];

    // Build: clerk_user_id → covering_roles[]
    const coversByUser = new Map<string, string[]>();
    for (const c of covers) {
      const arr = coversByUser.get(c.clerk_user_id) ?? [];
      arr.push(c.role);
      coversByUser.set(c.clerk_user_id, arr);
    }

    const now = Date.now();
    const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

    const enrichedTeams = teams.map((team) => ({
      ...team,
      members: members
        .filter((m) => m.team_id === team.id)
        .map((m) => {
          const lastSeen = m.last_seen_at ? new Date(m.last_seen_at).getTime() : 0;
          const secsAgo = lastSeen > 0 ? Math.floor((now - lastSeen) / 1000) : null;
          const isOnline = lastSeen > 0 && (now - lastSeen) < ONLINE_THRESHOLD_MS;
          return {
            id: m.id,
            team_id: m.team_id,
            clerk_user_id: m.clerk_user_id,
            display_name: m.display_name,
            assigned_role: m.assigned_role,
            secondary_role: m.secondary_role ?? null,
            is_absent: m.is_absent,
            last_seen_at: m.last_seen_at ?? null,
            is_online: isOnline,
            secs_ago: secsAgo,
            // roles this student is currently covering for absent teammates
            covering_roles: coversByUser.get(m.clerk_user_id) ?? [],
          };
        }),
    }));

    return NextResponse.json({ teams: enrichedTeams });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
