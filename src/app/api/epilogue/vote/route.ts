import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================
// Epilogue Vote API — records superlative votes
// Decision 68: Each student votes once, no self-voting
// ============================================

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const gameId = url.searchParams.get("game_id");
  const studentId = url.searchParams.get("student_id");

  if (!gameId) {
    return NextResponse.json({ error: "game_id required" }, { status: 400 });
  }

  // Check if student already voted
  if (studentId) {
    const { data } = await supabase
      .from("superlative_votes")
      .select("id")
      .eq("game_id", gameId)
      .eq("student_id", studentId)
      .limit(1);

    return NextResponse.json({ hasVoted: (data?.length ?? 0) > 0 });
  }

  return NextResponse.json({ hasVoted: false });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { gameId, votes, studentId } = body as {
    gameId: string;
    votes: Record<string, string>; // category → teamId
    studentId?: string;
  };

  if (!gameId || !votes) {
    return NextResponse.json(
      { error: "gameId and votes required" },
      { status: 400 }
    );
  }

  // Check if already voted
  if (studentId) {
    const { data: existing } = await supabase
      .from("superlative_votes")
      .select("id")
      .eq("game_id", gameId)
      .eq("student_id", studentId)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Already voted" },
        { status: 400 }
      );
    }
  }

  // Insert all votes
  const inserts = Object.entries(votes).map(([category, votedForTeamId]) => ({
    game_id: gameId,
    student_id: studentId ?? "anonymous",
    category,
    voted_for_team_id: votedForTeamId,
  }));

  const { error } = await supabase.from("superlative_votes").insert(inserts);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
