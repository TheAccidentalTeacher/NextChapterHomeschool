import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/games/[id]/replay
 * Returns all epoch resolve snapshots for a completed simulation.
 * Used by the /replay page to load the full game history for playback.
 *
 * Response shape:
 * {
 *   gameId: string,
 *   totalEpochs: number,
 *   snapshots: Array<{
 *     epoch: number,
 *     teams: SnapshotTeam[]
 *   }>
 * }
 */
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

  // Fetch all epoch resolve snapshots ordered by epoch
  const { data: events, error: eventsErr } = await supabase
    .from("game_events")
    .select("epoch, narrative_text, created_at")
    .eq("game_id", gameId)
    .eq("event_type", "epoch_resolve_snapshot")
    .order("epoch", { ascending: true });

  if (eventsErr) {
    return NextResponse.json({ error: eventsErr.message }, { status: 500 });
  }

  const snapshots = (events ?? []).flatMap((row) => {
    try {
      const payload = JSON.parse(row.narrative_text ?? "{}");
      return [payload];
    } catch {
      return [];
    }
  });

  return NextResponse.json({
    gameId,
    gameName: game.name,
    totalEpochs: game.current_epoch ?? snapshots.length,
    snapshots,
  });
}
