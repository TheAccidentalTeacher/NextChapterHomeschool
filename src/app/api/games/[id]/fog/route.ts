import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

/**
 * GET /api/games/[id]/fog
 * Returns fog state for current user's team.
 * DM/projector: returns all revealed (no fog).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Look up user's team
  const { data: member } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("clerk_user_id", userId)
    .single();

  // If not on a team (DM/projector), return all sub-zones visible
  if (!member) {
    const { data: subZones } = await supabase
      .from("sub_zones")
      .select("id")
      .eq("game_id", gameId);

    return NextResponse.json(
      (subZones ?? []).map((sz) => ({
        sub_zone_id: sz.id,
        state: "revealed",
      }))
    );
  }

  // Get team fog state
  const { data: fogState, error } = await supabase
    .from("team_fog_state")
    .select("sub_zone_id, is_visible, revealed_at")
    .eq("team_id", member.team_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (fogState ?? []).map((f) => ({
      sub_zone_id: f.sub_zone_id,
      state: f.is_visible ? "revealed" : "hidden",
      revealed_at: f.revealed_at,
    }))
  );
}
