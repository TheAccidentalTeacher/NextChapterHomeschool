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
    .select("id, current_epoch, current_round, epoch_phase, math_gate_enabled, updated_at")
    .eq("id", gameId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
