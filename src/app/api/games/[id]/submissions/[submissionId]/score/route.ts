import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const CONFLICT_KEYWORDS = [
  "attack", "invad", "raid", "war", "siege", "conquer", "assault", "aggress",
  "strike", "offensive", "militia", "territorial", "border clash",
];

function hasConflictIntent(content: string): boolean {
  const lower = content.toLowerCase();
  return CONFLICT_KEYWORDS.some((kw) => lower.includes(kw));
}

/** PUT — DM scores a submission (sets dm_score + dm_feedback) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  const role = await getUserRole();
  if (role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: gameId, submissionId } = await params;
  const body = await request.json();
  const { dm_score, dm_feedback } = body;

  if (typeof dm_score !== "number" || dm_score < 1 || dm_score > 5) {
    return NextResponse.json(
      { error: "dm_score must be 1-5" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Fetch the submission before scoring so we can inspect it
  const { data: submission } = await supabase
    .from("epoch_submissions")
    .select("id, game_id, team_id, epoch, round_type, role, content")
    .eq("id", submissionId)
    .single();

  const { error } = await supabase
    .from("epoch_submissions")
    .update({
      dm_score,
      dm_feedback: dm_feedback ?? null,
      scored_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-detect conflict: if WARLORD scores a DEFEND submission with aggressive intent,
  // create an epoch_conflict_flags row for the DM to review.
  let flagCreated = false;
  if (
    submission &&
    submission.role === "warlord" &&
    submission.round_type === "DEFEND" &&
    dm_score >= 3
  ) {
    let parsedContent: Record<string, string> = {};
    try {
      parsedContent = JSON.parse(submission.content ?? "{}");
    } catch { /* ignore */ }

    const textToCheck = [
      parsedContent.option_selected ?? "",
      parsedContent.justification_text ?? "",
      parsedContent.free_text_action ?? "",
    ].join(" ");

    if (hasConflictIntent(textToCheck)) {
      // Find other teams in this game to mark as potential defenders
      const { data: otherTeams } = await supabase
        .from("teams")
        .select("id, name")
        .eq("game_id", gameId)
        .neq("id", submission.team_id)
        .limit(1); // flag the nearest/first other team as default defender

      if (otherTeams && otherTeams.length > 0) {
        const { data: aggressorTeam } = await supabase
          .from("teams")
          .select("name")
          .eq("id", submission.team_id)
          .single();

        await supabase.from("epoch_conflict_flags").insert({
          game_id: gameId,
          epoch: submission.epoch,
          aggressor_team_id: submission.team_id,
          aggressor_name: aggressorTeam?.name ?? "Unknown",
          defender_team_id: otherTeams[0].id,
          defender_name: otherTeams[0].name,
          conflict_type: "territorial",
          justification: parsedContent.justification_text ?? null,
        });
        flagCreated = true;
      }
    }
  }

  return NextResponse.json({ success: true, conflict_flag_created: flagCreated });
}
