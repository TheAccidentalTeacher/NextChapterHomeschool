import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/games/[id]/replay
 * Returns all epoch resolve snapshots + student submission decisions.
 * Used by the /replay page to load the full game history for playback.
 *
 * Response shape:
 * {
 *   gameId: string,
 *   gameName: string,
 *   totalEpochs: number,
 *   snapshots: Array<{
 *     epoch: number,
 *     teams: SnapshotTeam[],
 *     teamSubmissions: TeamSubmissions[]
 *   }>
 * }
 */

interface StudentSubmission {
  studentName: string;
  role: string;
  roundType: string;
  optionSelected: string;
  justification: string;
}

interface TeamSubmissions {
  teamId: string;
  submissions: StudentSubmission[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;

  const supabase = await createClient();

  // Fetch game metadata
  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id, name, current_epoch")
    .eq("id", gameId)
    .single();

  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Run all fetches in parallel for performance
  const [eventsResult, teamsResult, subsResult] = await Promise.all([
    supabase
      .from("game_events")
      .select("epoch, metadata, created_at")
      .eq("game_id", gameId)
      .eq("event_type", "epoch_resolve_snapshot")
      .order("epoch", { ascending: true }),
    supabase
      .from("teams")
      .select("id")
      .eq("game_id", gameId),
    supabase
      .from("epoch_submissions")
      .select("epoch, team_id, role, round_type, content, submitted_by")
      .eq("game_id", gameId)
      .order("epoch", { ascending: true }),
  ]);

  if (eventsResult.error) {
    return NextResponse.json({ error: eventsResult.error.message }, { status: 500 });
  }

  const teamIds = (teamsResult.data ?? []).map((t: { id: string }) => t.id);

  // Load team members for display names (keyed by clerk_user_id)
  let memberLookup = new Map<string, { display_name: string; assigned_role: string }>();
  if (teamIds.length) {
    const { data: members } = await supabase
      .from("team_members")
      .select("clerk_user_id, display_name, assigned_role, team_id")
      .in("team_id", teamIds);
    for (const m of (members ?? [])) {
      memberLookup.set(m.clerk_user_id, { display_name: m.display_name, assigned_role: m.assigned_role });
    }
  }

  // Group submissions by epoch → by team_id
  const subsByEpoch = new Map<number, Map<string, StudentSubmission[]>>();
  for (const sub of (subsResult.data ?? [])) {
    let parsedContent: { option_selected?: string; justification_text?: string } = {};
    try { parsedContent = JSON.parse(sub.content ?? "{}"); } catch { /* ignore */ }

    const member = memberLookup.get(sub.submitted_by);
    const submission: StudentSubmission = {
      studentName: member?.display_name ?? "Student",
      role: sub.role,
      roundType: sub.round_type,
      optionSelected: parsedContent.option_selected ?? "?",
      justification: parsedContent.justification_text ?? "",
    };

    if (!subsByEpoch.has(sub.epoch)) subsByEpoch.set(sub.epoch, new Map());
    const teamMap = subsByEpoch.get(sub.epoch)!;
    if (!teamMap.has(sub.team_id)) teamMap.set(sub.team_id, []);
    teamMap.get(sub.team_id)!.push(submission);
  }

  // Build snapshot array, merging in submissions
  const snapshots = (eventsResult.data ?? []).flatMap((row) => {
    if (!row.metadata || typeof row.metadata !== "object") return [];
    const snap = row.metadata as Record<string, unknown>;
    const epoch = snap.epoch as number;
    const teamMap = subsByEpoch.get(epoch);
    const teamSubmissions: TeamSubmissions[] = teamMap
      ? Array.from(teamMap.entries()).map(([teamId, submissions]) => ({ teamId, submissions }))
      : [];
    return [{ ...snap, teamSubmissions }];
  });

  return NextResponse.json({
    gameId,
    gameName: game.name,
    totalEpochs: game.current_epoch ?? snapshots.length,
    snapshots,
  });
}
