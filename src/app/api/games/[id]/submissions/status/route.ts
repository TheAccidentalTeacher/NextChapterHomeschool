import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/games/[id]/submissions/status
 * Returns submission status for all teams in current epoch.
 * Response: { team_id, round, roles_submitted[], roles_pending[] }[]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();

  // Get current game state
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch, current_round")
    .eq("id", gameId)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Get all teams
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, civilization_name")
    .eq("game_id", gameId);

  if (!teams) {
    return NextResponse.json([]);
  }

  // Get current epoch submissions
  const { data: submissions } = await supabase
    .from("epoch_submissions")
    .select("team_id, role, round_type")
    .eq("game_id", gameId)
    .eq("epoch", game.current_epoch);

  // Get active role assignments from team_members (not the non-existent epoch_role_assignments table)
  const { data: members } = await supabase
    .from("team_members")
    .select("team_id, assigned_role")
    .in("team_id", teams.map((t) => t.id))
    .eq("is_absent", false);

  // All roles
  const ALL_ROLES = ["architect", "merchant", "diplomat", "lorekeeper", "warlord"];

  const statusByTeam = teams.map((team) => {
    // Determine active roles for this team from actual team members
    const teamMembers = members?.filter((m) => m.team_id === team.id);
    const activeRoles =
      teamMembers && teamMembers.length > 0
        ? teamMembers.map((m) => m.assigned_role).filter(Boolean) as string[]
        : ALL_ROLES;

    // Get submitted roles for current round
    const teamSubs = (submissions ?? []).filter(
      (s) => s.team_id === team.id && s.round_type === game.current_round
    );
    const rolesSubmitted = teamSubs.map((s) => s.role);
    const rolesPending = activeRoles.filter((r) => !rolesSubmitted.includes(r));

    return {
      team_id: team.id,
      team_name: team.name,
      civilization_name: team.civilization_name,
      round: game.current_round,
      roles_submitted: rolesSubmitted,
      roles_pending: rolesPending,
      all_submitted: rolesPending.length === 0,
    };
  });

  return NextResponse.json({ teams: statusByTeam });
}
