// ============================================
// GET /api/me/team — get the current student's team + game info
// Returns cover_info if this student is substituting for an absent teammate.
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/roles";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const supabase = await createClient();

    // Find this user's team membership
    const { data: membership, error } = await supabase
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

    // Check for substitute assignment this epoch
    let coverInfo: {
      is_substitute: true;
      covering_role: string;
      original_role: string;
    } | null = null;

    try {
      // Get current epoch for this game
      const { data: gameRow } = await supabase
        .from("games")
        .select("current_epoch")
        .eq("id", team.game_id)
        .single();

      if (gameRow) {
        const { data: subAssignment } = await supabase
          .from("epoch_role_assignments")
          .select("role, original_role")
          .eq("team_id", team.id)
          .eq("epoch", gameRow.current_epoch)
          .eq("clerk_user_id", userId)
          .eq("is_substitute", true)
          .maybeSingle();

        if (subAssignment) {
          coverInfo = {
            is_substitute: true,
            covering_role: subAssignment.role,
            original_role: subAssignment.original_role ?? membership.assigned_role,
          };
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
        is_absent: membership.is_absent,
        cover_info: coverInfo,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
