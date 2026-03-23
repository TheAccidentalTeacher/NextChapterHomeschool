// ============================================
// GET /api/me/team — get the current student's team + game info
// Returns cover_info if this student is substituting for an absent teammate.
// ============================================

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/roles";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const user = await currentUser();
    const supabase = await createClient();

    async function findMembership() {
      const candidateNames = Array.from(new Set([
        user?.firstName?.trim(),
        user?.firstName?.trim()?.split(/\s+/)[0],
        user?.username?.trim(),
        user?.username?.trim()?.split(/[._\-\s]+/)[0],
      ].filter(Boolean) as string[]));

      const byId = await supabase
        .from("team_members")
        .select(`
          id,
          team_id,
          display_name,
          assigned_role,
          is_absent,
          teams:team_id (
            id,
            name,
            civilization_name,
            region_id,
            population,
            game_id
          )
        `)
        .eq("clerk_user_id", userId)
        .order("joined_at", { ascending: false })
        .limit(1)
        .single();

      if (byId.data) {
        return { data: byId.data, error: byId.error };
      }

      for (const candidate of candidateNames) {
        const byName = await supabase
          .from("team_members")
          .select(`
            id,
            team_id,
            display_name,
            assigned_role,
            is_absent,
            teams:team_id (
              id,
              name,
              civilization_name,
              region_id,
              population,
              game_id
            )
          `)
          .ilike("display_name", candidate)
          .order("joined_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (byName.data) {
          return { data: byName.data, error: byName.error };
        }
      }

      return { data: null, error: byId.error };
    }

    // Find this user's team membership
    const { data: membership, error } = await findMembership();

    if (error || !membership) {
      return NextResponse.json(
        { error: "No team assignment found" },
        { status: 404 }
      );
    }

    const team = membership.teams as unknown as {
      id: string;
      name: string;
      civilization_name: string | null;
      region_id: number;
      population: number;
      game_id: string;
    };

    // Check for substitute assignments this epoch
    let coverAssignments: Array<{
      covering_role: string;
      original_role: string;
    }> = [];

    // Fetch secondary_role separately (fault-tolerant: column may not exist until migration 008 runs)
    let selfSecondaryRole: string | null = null;
    try {
      const { data: extra } = await supabase
        .from("team_members")
        .select("id, secondary_role")
        .eq("id", membership.id)
        .single();
      selfSecondaryRole = (extra as unknown as { secondary_role?: string | null })?.secondary_role ?? null;
    } catch {
      // migration 008 not yet applied — gracefully continue without secondary_role
    }

    // Fetch all teammates on this team (for the student to see who's who)
    let teammates: Array<{
      id: string;
      display_name: string;
      assigned_role: string;
      secondary_role: string | null;
      is_absent: boolean;
      is_self: boolean;
    }> = [];
    try {
      // Try with secondary_role first; fall back without it if the column doesn't exist yet
      let allMembers: Array<{ id: string; clerk_user_id: string; display_name: string; assigned_role: string; secondary_role?: string | null; is_absent: boolean | null }> | null = null;
      try {
        const { data } = await supabase
          .from("team_members")
          .select("id, clerk_user_id, display_name, assigned_role, secondary_role, is_absent")
          .eq("team_id", team.id)
          .order("joined_at", { ascending: true });
        allMembers = data ?? [];
      } catch {
        // secondary_role column may not exist yet — try without it
        const { data } = await supabase
          .from("team_members")
          .select("id, clerk_user_id, display_name, assigned_role, is_absent")
          .eq("team_id", team.id)
          .order("joined_at", { ascending: true });
        allMembers = (data ?? []).map((m) => ({ ...m, secondary_role: null }));
      }
      teammates = (allMembers ?? []).map((m) => ({
        id: m.id,
        display_name: m.display_name,
        assigned_role: m.assigned_role,
        secondary_role: m.secondary_role ?? null,
        is_absent: m.is_absent ?? false,
        is_self: m.clerk_user_id === userId,
      }));
    } catch {
      // non-critical
    }

    try {
      // Get current epoch for this game
      const { data: gameRow } = await supabase
        .from("games")
        .select("current_epoch")
        .eq("id", team.game_id)
        .single();

      if (gameRow) {
        const { data: subAssignments } = await supabase
          .from("epoch_role_assignments")
          .select("role, original_role")
          .eq("team_id", team.id)
          .eq("epoch", gameRow.current_epoch)
          .eq("clerk_user_id", userId)
          .eq("is_substitute", true)
          .order("role");

        if (subAssignments?.length) {
          coverAssignments = subAssignments.map((subAssignment) => ({
            covering_role: subAssignment.role,
            original_role: subAssignment.original_role ?? membership.assigned_role,
          }));
        }
      }
    } catch {
      // cover check is non-critical — proceed without it
    }

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        civilization_name: team.civilization_name,
        region_id: team.region_id,
        population: team.population,
        game_id: team.game_id,
        is_in_dark_age: false,
        war_exhaustion_level: 0,
      },
      member: {
        id: membership.id,
        display_name: membership.display_name,
        assigned_role: membership.assigned_role,
        secondary_role: selfSecondaryRole,
        is_absent: membership.is_absent,
        cover_info: coverAssignments[0]
          ? {
              is_substitute: true,
              covering_role: coverAssignments[0].covering_role,
              original_role: coverAssignments[0].original_role,
            }
          : null,
        cover_assignments: coverAssignments,
      },
      teammates,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
