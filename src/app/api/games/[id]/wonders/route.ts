import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";
import {
  getWonder,
  resourceToTrack,
  getContributionAmount,
  getOverallProgress,
  canCompleteWonder,
  checkMilestones,
  createEmptyProgress,
  type WonderProgress,
} from "@/lib/game/wonders";

// ============================================
// Wonder API — Progress, contributions, completion
// Decision 36, 37, 40: 12 wonders, 4-track, milestones
// ============================================

/**
 * GET /api/games/[id]/wonders
 * Query: ?team_id=xxx
 * Returns: active wonder, completed wonders, all progress
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = req.nextUrl.searchParams.get("team_id");
  if (!teamId) {
    return NextResponse.json({ error: "team_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch all wonder progress for this team
  const { data: progressRows, error } = await supabase
    .from("wonder_progress")
    .select("*")
    .eq("team_id", teamId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const wonders = (progressRows ?? []).map((row: Record<string, unknown>) => ({
    wonderId: row.wonder_id as string,
    teamId: row.team_id as string,
    constructionTrack: (row.construction_track as number) ?? 0,
    foundationTrack: (row.foundation_track as number) ?? 0,
    cultureTrack: (row.culture_track as number) ?? 0,
    fortificationTrack: (row.fortification_track as number) ?? 0,
    isComplete: (row.is_complete as boolean) ?? false,
    milestones25: (row.milestones_25 as boolean) ?? false,
    milestones50: (row.milestones_50 as boolean) ?? false,
    milestones75: (row.milestones_75 as boolean) ?? false,
  }));

  const activeWonder = wonders.find((w: WonderProgress) => !w.isComplete) ?? null;
  const completedWonders = wonders
    .filter((w: WonderProgress) => w.isComplete)
    .map((w: WonderProgress) => w.wonderId);

  return NextResponse.json({
    activeWonder,
    completedWonders,
    allProgress: wonders,
  });
}

/**
 * POST /api/games/[id]/wonders
 * Body: { action, team_id, wonder_id?, resource_type?, amount? }
 * Actions:
 *   - "select"     — choose which wonder to build
 *   - "contribute"  — add resources to a track
 *   - "complete"    — check + complete if eligible
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
  const { action, team_id, wonder_id, resource_type, amount } = body as {
    action: string;
    team_id: string;
    wonder_id?: string;
    resource_type?: string;
    amount?: number;
  };

  if (!team_id) {
    return NextResponse.json({ error: "team_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  // ---- ACTION: SELECT ----
  if (action === "select") {
    if (!wonder_id) {
      return NextResponse.json({ error: "wonder_id required" }, { status: 400 });
    }

    const wonder = getWonder(wonder_id);
    if (!wonder) {
      return NextResponse.json({ error: "Unknown wonder" }, { status: 400 });
    }

    // Check not already building or completed
    const { data: existing } = await supabase
      .from("wonder_progress")
      .select("wonder_id, is_complete")
      .eq("team_id", team_id);

    const activeCount = (existing ?? []).filter((r: Record<string, unknown>) => !r.is_complete).length;
    if (activeCount > 0) {
      return NextResponse.json(
        { error: "Already building a wonder — complete it first" },
        { status: 400 }
      );
    }

    const alreadyCompleted = (existing ?? []).some(
      (r: Record<string, unknown>) => r.wonder_id === wonder_id && r.is_complete
    );
    if (alreadyCompleted) {
      return NextResponse.json(
        { error: "Already completed this wonder" },
        { status: 400 }
      );
    }

    // Insert new wonder progress
    const { error: insertErr } = await supabase.from("wonder_progress").insert({
      team_id,
      wonder_id,
      game_id: gameId,
      construction_track: 0,
      foundation_track: 0,
      culture_track: 0,
      fortification_track: 0,
      is_complete: false,
      milestones_25: false,
      milestones_50: false,
      milestones_75: false,
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, wonderName: wonder.name });
  }

  // ---- ACTION: CONTRIBUTE ----
  if (action === "contribute") {
    if (!resource_type || !amount || amount <= 0) {
      return NextResponse.json({ error: "resource_type and positive amount required" }, { status: 400 });
    }

    const track = resourceToTrack(resource_type);
    if (!track) {
      return NextResponse.json({ error: `Invalid resource for wonder: ${resource_type}` }, { status: 400 });
    }

    const trackColumn = {
      constructionTrack: "construction_track",
      foundationTrack: "foundation_track",
      cultureTrack: "culture_track",
      fortificationTrack: "fortification_track",
    }[track];

    // Get current active wonder progress
    const { data: progressRow, error: fetchErr } = await supabase
      .from("wonder_progress")
      .select("*")
      .eq("team_id", team_id)
      .eq("is_complete", false)
      .single();

    if (fetchErr || !progressRow) {
      return NextResponse.json({ error: "No active wonder" }, { status: 400 });
    }

    // Check team has enough resources
    const { data: resData } = await supabase
      .from("team_resources")
      .select("*")
      .eq("team_id", team_id)
      .single();

    const currentAmount = (resData as Record<string, number> | null)?.[resource_type] ?? 0;
    if (currentAmount < amount) {
      return NextResponse.json({ error: `Not enough ${resource_type}` }, { status: 400 });
    }

    // Check Great Pyramid bonus
    const { data: completedWonders } = await supabase
      .from("wonder_progress")
      .select("wonder_id")
      .eq("team_id", team_id)
      .eq("is_complete", true);

    const hasGreatPyramid = (completedWonders ?? []).some(
      (r: Record<string, unknown>) => r.wonder_id === "great_pyramid"
    );

    const effectiveAmount = getContributionAmount(amount, hasGreatPyramid);

    // Deduct resources
    const { error: deductErr } = await supabase
      .from("team_resources")
      .update({ [resource_type]: currentAmount - amount })
      .eq("team_id", team_id);

    if (deductErr) {
      return NextResponse.json({ error: deductErr.message }, { status: 500 });
    }

    // Add to wonder track (cap at 100)
    const currentTrackValue = (progressRow as Record<string, number>)[trackColumn] ?? 0;
    const newTrackValue = Math.min(100, currentTrackValue + effectiveAmount);

    const updateData: Record<string, unknown> = {
      [trackColumn]: newTrackValue,
    };

    // Build a progress object for milestone checking
    const progress: WonderProgress = {
      wonderId: (progressRow as Record<string, string>).wonder_id,
      teamId: team_id,
      constructionTrack: trackColumn === "construction_track" ? newTrackValue : ((progressRow as Record<string, number>).construction_track ?? 0),
      foundationTrack: trackColumn === "foundation_track" ? newTrackValue : ((progressRow as Record<string, number>).foundation_track ?? 0),
      cultureTrack: trackColumn === "culture_track" ? newTrackValue : ((progressRow as Record<string, number>).culture_track ?? 0),
      fortificationTrack: trackColumn === "fortification_track" ? newTrackValue : ((progressRow as Record<string, number>).fortification_track ?? 0),
      isComplete: false,
      milestones25: (progressRow as Record<string, boolean>).milestones_25 ?? false,
      milestones50: (progressRow as Record<string, boolean>).milestones_50 ?? false,
      milestones75: (progressRow as Record<string, boolean>).milestones_75 ?? false,
    };

    // Check milestones
    const newMilestones = checkMilestones(progress);
    if (newMilestones.milestone25) updateData.milestones_25 = true;
    if (newMilestones.milestone50) updateData.milestones_50 = true;
    if (newMilestones.milestone75) updateData.milestones_75 = true;

    // Check for auto-completion
    let completed = false;
    if (canCompleteWonder(progress)) {
      updateData.is_complete = true;
      completed = true;
    }

    // Update wonder progress
    const { error: updateErr } = await supabase
      .from("wonder_progress")
      .update(updateData)
      .eq("id", (progressRow as Record<string, string>).id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Log events for milestones and completion
    const wonder = getWonder(progress.wonderId);

    if (completed && wonder) {
      const { data: gameData } = await supabase
        .from("games")
        .select("current_epoch")
        .eq("id", gameId)
        .single();

      const currentEpoch = (gameData as { current_epoch?: number } | null)?.current_epoch ?? 1;

      await supabase.from("game_events").insert({
        game_id: gameId,
        epoch: currentEpoch,
        event_type: "wonder_completed",
        payload: {
          team_id,
          wonder_id: progress.wonderId,
          wonder_name: wonder.name,
          bonus: wonder.completionBonus,
          bonus_key: wonder.bonusKey,
        },
      });
    }

    return NextResponse.json({
      success: true,
      trackUpdated: track,
      newValue: newTrackValue,
      overallProgress: getOverallProgress(progress),
      milestonesReached: newMilestones,
      completed,
    });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
