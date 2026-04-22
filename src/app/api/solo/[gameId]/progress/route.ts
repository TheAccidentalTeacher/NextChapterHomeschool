// ============================================================
// GET /api/solo/[gameId]/progress
// ============================================================
// Returns solo-flow hydration data so the client can recover from a
// page refresh mid-epoch without getting stuck on an already-submitted
// round. Response:
//
//   {
//     current_epoch: number,
//     submitted_rounds: ['BUILD','EXPAND',...]   // uppercase round_types
//   }
//
// The client uses this to find the first unsubmitted round and skip to it.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ gameId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { gameId } = await params;
  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  // Solo games have exactly one player team. Find it.
  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("game_id", gameId)
    .limit(1);
  const teamId = teams?.[0]?.id;
  if (!teamId) return NextResponse.json({ current_epoch: game.current_epoch, submitted_rounds: [] });

  const { data: submissions } = await supabase
    .from("epoch_submissions")
    .select("round_type")
    .eq("game_id", gameId)
    .eq("team_id", teamId)
    .eq("epoch", game.current_epoch);

  const submittedRounds = Array.from(
    new Set((submissions ?? []).map((s) => String(s.round_type).toUpperCase()))
  );

  return NextResponse.json({
    current_epoch: game.current_epoch,
    submitted_rounds: submittedRounds,
  });
}
