import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId, isTeacher } from "@/lib/auth/roles";
import { STEP_TO_ROUND, getNextStep, type EpochStep } from "@/lib/game/epoch-machine";

/**
 * POST /api/games/[id]/submissions
 * Student submits a round decision with justification.
 *
 * Body: {
 *   team_id, role, round_type, option_selected, justification_text,
 *   free_text_action? (if "propose your own")
 * }
 *
 * GET /api/games/[id]/submissions
 * DM view: all submissions for the current epoch (filterable).
 * Query: ?epoch=&team_id=&round_type=&role=
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { team_id, role, round_type, option_selected, justification_text, free_text_action } = body;

  if (!team_id || !role || !round_type || !justification_text) {
    return NextResponse.json(
      { error: "Missing required fields: team_id, role, round_type, justification_text" },
      { status: 400 }
    );
  }

  // Check justification meets minimum (2 sentences ~ 2 periods)
  const sentenceCount = (justification_text.match(/[.!?]+/g) || []).length;
  if (sentenceCount < 2) {
    return NextResponse.json(
      { error: "Justification must be at least 2 sentences" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Validate that team_id belongs to this game (prevents IDOR)
  const { data: teamCheck } = await supabase
    .from("teams")
    .select("id")
    .eq("id", team_id)
    .eq("game_id", gameId)
    .single();
  if (!teamCheck) {
    return NextResponse.json({ error: "Team not found in this game" }, { status: 403 });
  }

  // Get current game state
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch, current_round, game_mode")
    .eq("id", gameId)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Realms v2 diplomacy epoch gates (§4.5 ship plan).
  // Alliances unlock E4; wars + vassalage + peace unlock E6. Team v1 mode
  // has diplomacy open from Epoch 1 — gates only apply when game_mode='realms'.
  if (game.game_mode === "realms" && round_type === "DEFINE" && option_selected) {
    const REALMS_EPOCH_GATES: Record<string, number> = {
      propose_alliance: 4,
      accept_alliance: 4,
      reject_alliance: 4,
      break_alliance: 4,
      issue_ultimatum: 4,
      declare_war: 6,
      sue_for_peace: 6,
      propose_vassalage: 6,
    };
    const requiredEpoch = REALMS_EPOCH_GATES[option_selected as string];
    if (requiredEpoch && game.current_epoch < requiredEpoch) {
      return NextResponse.json(
        { error: `${option_selected} unlocks at Epoch ${requiredEpoch}` },
        { status: 403 }
      );
    }
  }

  // Build content JSON
  const content = JSON.stringify({
    option_selected,
    justification_text,
    free_text_action: free_text_action || null,
  });

  // Check for duplicate submission
  const { data: existing } = await supabase
    .from("epoch_submissions")
    .select("id")
    .eq("game_id", gameId)
    .eq("team_id", team_id)
    .eq("epoch", game.current_epoch)
    .eq("round_type", round_type)
    .eq("role", role)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Already submitted for this round" },
      { status: 409 }
    );
  }

  // Insert submission
  const { data: submission, error } = await supabase
    .from("epoch_submissions")
    .insert({
      game_id: gameId,
      team_id,
      epoch: game.current_epoch,
      round_type,
      role,
      submitted_by: userId,
      content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-advance from action round -> routing when every team has all active roles submitted.
  const currentStep = (game.current_round ?? "login") as EpochStep;
  const currentRoundType = STEP_TO_ROUND[currentStep] ?? game.current_round?.toUpperCase?.() ?? round_type;

  if (currentRoundType === round_type) {
    const { data: teams } = await supabase
      .from("teams")
      .select("id")
      .eq("game_id", gameId);

    if (teams?.length) {
      const teamIds = teams.map((t) => t.id);
      const { data: members } = await supabase
        .from("team_members")
        .select("team_id, assigned_role, secondary_role")
        .in("team_id", teamIds)
        .eq("is_absent", false);

      const { data: covers } = await supabase
        .from("epoch_role_assignments")
        .select("team_id, role")
        .in("team_id", teamIds)
        .eq("epoch", game.current_epoch)
        .eq("is_substitute", true);

      const { data: allSubs } = await supabase
        .from("epoch_submissions")
        .select("team_id, role")
        .eq("game_id", gameId)
        .eq("epoch", game.current_epoch)
        .eq("round_type", currentRoundType);

      const allTeamsDone = teamIds.every((teamId) => {
        const teamMembers = (members ?? []).filter((m) => m.team_id === teamId);
        const coveredRoles = (covers ?? []).filter((c) => c.team_id === teamId).map((c) => c.role);
        const activeRoles = Array.from(new Set([
          ...teamMembers.map((m) => m.assigned_role).filter(Boolean),
          ...teamMembers.map((m) => m.secondary_role).filter(Boolean),
          ...coveredRoles,
        ]));
        const submittedRoles = (allSubs ?? []).filter((s) => s.team_id === teamId).map((s) => s.role);
        return activeRoles.length > 0 && activeRoles.every((r) => submittedRoles.includes(r));
      });

      if (allTeamsDone) {
        const nextStep = getNextStep(currentStep);
        if (nextStep && nextStep !== currentStep) {
          await supabase
            .from("games")
            .update({ current_round: nextStep, updated_at: new Date().toISOString() })
            .eq("id", gameId)
            .eq("current_round", currentStep);
        }
      }
    }
  }

  return NextResponse.json(submission, { status: 201 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const teacher = await isTeacher();

  const supabase = await createClient();
  const url = new URL(req.url);
  const epochFilter = url.searchParams.get("epoch");
  const teamFilter = url.searchParams.get("team_id");
  const roundFilter = url.searchParams.get("round_type");
  const roleFilter = url.searchParams.get("role");

  let query = supabase
    .from("epoch_submissions")
    .select("*")
    .eq("game_id", gameId)
    .order("submitted_at", { ascending: false });

  if (epochFilter) query = query.eq("epoch", parseInt(epochFilter));
  if (teamFilter) query = query.eq("team_id", teamFilter);
  if (roundFilter) query = query.eq("round_type", roundFilter);
  if (roleFilter) query = query.eq("role", roleFilter);

  // Non-teachers can only see their own team's submissions
  if (!teacher) {
    const userId = await getClerkUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Look up their team
    const { data: member } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("clerk_user_id", userId)
      .single();

    if (member) {
      query = query.eq("team_id", member.team_id);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
