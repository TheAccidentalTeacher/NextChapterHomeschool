import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";

/**
 * POST /api/solo/[gameId]/submit
 * Player submits a round decision. Auto-scored immediately.
 *
 * Body: {
 *   teamId: string,
 *   step: 'build' | 'expand' | 'define' | 'defend',
 *   optionSelected: string,         // e.g. "a" | "b" | "c"
 *   justificationText: string,
 *   questionId: string,             // for record-keeping
 * }
 *
 * Returns: { score, feedback, earned, roundType }
 */

const STEP_TO_ROUND: Record<string, string> = {
  build: "BUILD",
  expand: "EXPAND",
  define: "DEFINE",
  defend: "DEFEND",
};

const STEP_TO_ROLE: Record<string, string> = {
  build: "architect",
  expand: "merchant",
  define: "diplomat",
  defend: "warlord",
};

interface ScoreResult {
  score: number;       // 1–5
  multiplier: number;  // 0.5 | 0.75 | 1.0 | 1.5 | 2.0
  feedback: string;
}

function scoreJustification(text: string): ScoreResult {
  const len = text.trim().length;
  const sentences = (text.match(/[.!?]+/g) || []).length;

  if (len < 40 || sentences < 1) {
    return {
      score: 1, multiplier: 0.5,
      feedback: "Too brief — a real DM wants at least 2 sentences. Try connecting your choice to a specific civilization or historical example.",
    };
  }
  if (len < 100 || sentences < 2) {
    return {
      score: 2, multiplier: 0.75,
      feedback: "A start! You've shown basic reasoning. Adding a historical example (\"The Romans showed us that...\") would push this to a 3.",
    };
  }
  if (len < 200) {
    return {
      score: 3, multiplier: 1.0,
      feedback: "Solid reasoning. You've connected your choice to the game's logic. One specific historical parallel would elevate this further.",
    };
  }
  if (len < 350) {
    return {
      score: 4, multiplier: 1.5,
      feedback: "Strong analysis! Your historical reasoning shows you understand civilizational trade-offs. Nearly full credit.",
    };
  }
  return {
    score: 5, multiplier: 2.0,
    feedback: "Excellent! Sophisticated historical thinking with strong causal reasoning. Full DM credit — your civilization earns maximum yield.",
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const body = await req.json();
  const { teamId, step, optionSelected, justificationText, questionId } = body;

  if (!teamId || !step || !justificationText) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const roundType = STEP_TO_ROUND[step];
  const role = STEP_TO_ROLE[step];
  if (!roundType || !role) {
    return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
  }

  const supabase = createDirectClient();

  // Get current epoch
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from("epoch_submissions")
    .select("id")
    .eq("game_id", gameId)
    .eq("team_id", teamId)
    .eq("epoch", game.current_epoch)
    .eq("round_type", roundType)
    .eq("role", role)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Already submitted this round" }, { status: 409 });
  }

  // Score the submission
  const { score, multiplier, feedback } = scoreJustification(justificationText);
  const earned = Math.max(2, Math.round(score * 5 * multiplier));

  // Save submission record
  const content = JSON.stringify({
    option_selected: optionSelected || null,
    justification_text: justificationText,
    question_id: questionId || null,
    solo_mode: true,
  });

  const { error: subErr } = await supabase.from("epoch_submissions").insert({
    game_id: gameId,
    team_id: teamId,
    epoch: game.current_epoch,
    round_type: roundType,
    role,
    submitted_by: "solo_player",
    content,
    dm_score: score,
    dm_feedback: feedback,
    scored_at: new Date().toISOString(),
  });

  if (subErr) {
    console.error("[solo/submit] insert error:", subErr);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }

  return NextResponse.json({
    score,
    multiplier,
    feedback,
    earned,
    roundType,
    role,
  });
}
