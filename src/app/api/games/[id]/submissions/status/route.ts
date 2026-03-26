import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeacher } from "@/lib/auth/roles";
import { STEP_TO_ROUND } from "@/lib/game/epoch-machine";

/**
 * DELETE /api/games/[id]/submissions/status
 * DM only: wipe all submissions for the current epoch+round.
 * Used to clear stale data from a previous session or test run.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const teacher = await isTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select("current_epoch, current_round")
    .eq("id", gameId)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const currentRoundType = STEP_TO_ROUND[game.current_round as keyof typeof STEP_TO_ROUND] ?? game.current_round?.toUpperCase?.() ?? "BUILD";

  const { error, count } = await supabase
    .from("epoch_submissions")
    .delete({ count: "exact" })
    .eq("game_id", gameId)
    .eq("epoch", game.current_epoch)
    .eq("round_type", currentRoundType);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: count ?? 0 });
}

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

  const currentRoundType = STEP_TO_ROUND[game.current_round as keyof typeof STEP_TO_ROUND] ?? game.current_round?.toUpperCase?.() ?? "BUILD";

  // Get current epoch submissions
  const { data: submissions } = await supabase
    .from("epoch_submissions")
    .select("team_id, role, round_type")
    .eq("game_id", gameId)
    .eq("epoch", game.current_epoch)
    .eq("round_type", currentRoundType);

  // Get active role assignments from team_members.
  // Include both primary and secondary roles for small teams.
  const { data: members } = await supabase
    .from("team_members")
    .select("team_id, assigned_role, secondary_role")
    .in("team_id", teams.map((t) => t.id))
    .eq("is_absent", false);

  // Get substitute assignments for absent students being covered this epoch.
  const { data: covers } = await supabase
    .from("epoch_role_assignments")
    .select("team_id, role")
    .in("team_id", teams.map((t) => t.id))
    .eq("epoch", game.current_epoch)
    .eq("is_substitute", true);

  // All roles
  const ALL_ROLES = ["architect", "merchant", "diplomat", "lorekeeper", "warlord"];

  const statusByTeam = teams.map((team) => {
    // Determine active roles for this team from actual team members
    const teamMembers = members?.filter((m) => m.team_id === team.id);
    const coveredRoles = (covers ?? []).filter((c) => c.team_id === team.id).map((c) => c.role);
    const activeRoles = teamMembers && teamMembers.length > 0
      ? Array.from(new Set([
          ...teamMembers.map((m) => m.assigned_role).filter(Boolean),
          ...teamMembers.map((m) => m.secondary_role).filter(Boolean),
          ...coveredRoles,
        ])) as string[]
      : ALL_ROLES;

    // Get submitted roles for current round
    const teamSubs = (submissions ?? []).filter(
      (s) => s.team_id === team.id && s.round_type === currentRoundType
    );
    const rolesSubmitted = teamSubs.map((s) => s.role);
    const rolesPending = activeRoles.filter((r) => !rolesSubmitted.includes(r));

    return {
      team_id: team.id,
      team_name: team.name,
      civilization_name: team.civilization_name,
      round: currentRoundType,
      roles_submitted: rolesSubmitted,
      roles_pending: rolesPending,
      all_submitted: rolesPending.length === 0,
    };
  });

  return NextResponse.json({ teams: statusByTeam });
}
