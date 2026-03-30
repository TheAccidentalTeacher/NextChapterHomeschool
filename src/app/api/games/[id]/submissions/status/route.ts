import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClerkUserId } from "@/lib/auth/roles";
import { STEP_TO_ROUND } from "@/lib/game/epoch-machine";

/**
 * DELETE /api/games/[id]/submissions/status
 * DM only: wipe all submissions for the current epoch via a
 * security-definer RPC so RLS cannot interfere.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pick the best available client
  let supabase: ReturnType<typeof createAdminClient> | Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = createAdminClient();
  } catch {
    supabase = await createClient();
  }

  // Get current epoch
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch, current_round")
    .eq("id", gameId)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Count before delete (debug)
  const { count: existingCount } = await supabase
    .from("epoch_submissions")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId)
    .eq("epoch", game.current_epoch);

  // Use security-definer RPC — guaranteed to bypass RLS
  const { data: deletedCount, error: rpcError } = await supabase.rpc(
    "clear_epoch_submissions",
    { p_game_id: gameId, p_epoch: game.current_epoch }
  );

  if (rpcError) {
    // RPC not yet created — fall back to direct delete
    const { error: delError, count } = await supabase
      .from("epoch_submissions")
      .delete({ count: "exact" })
      .eq("game_id", gameId)
      .eq("epoch", game.current_epoch);

    if (delError) {
      return NextResponse.json(
        { error: delError.message, hint: "Run migration 010 in Supabase SQL editor to create the clear_epoch_submissions function." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deleted: count ?? 0,
      existingBeforeDelete: existingCount ?? 0,
      epoch: game.current_epoch,
      method: "direct_delete_fallback",
    });
  }

  return NextResponse.json({
    deleted: deletedCount ?? 0,
    existingBeforeDelete: existingCount ?? 0,
    epoch: game.current_epoch,
    method: "rpc_security_definer",
  });
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
