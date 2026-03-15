import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeacher } from "@/lib/auth/roles";

/**
 * GET /api/games/[id]/epoch/state
 * Returns current epoch, round, timer, and phase for a game.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("id, current_epoch, current_round, epoch_phase, math_gate_enabled, math_gate_difficulty, class_period, round_timer_minutes, updated_at")
    .eq("id", gameId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Alias current_round as current_step so clients can read it consistently.
  // is_paused is derived from epoch_phase so clients don't need to know the enum.
  return NextResponse.json({
    ...data,
    current_step: data.current_round,
    is_paused: data.epoch_phase === "resolving",
  });
}
