import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/games/[id]/epoch/[epoch]/resolve-snapshot
 * Returns the epoch resolve snapshot stored by the simulation engine.
 * Used by ResolveSequence (live projector) and the /replay page to display
 * real per-team resolve data instead of mock numbers.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; epoch: string }> }
) {
  const { id: gameId, epoch: epochStr } = await params;
  const epoch = parseInt(epochStr, 10);

  if (isNaN(epoch)) {
    return NextResponse.json({ error: "Invalid epoch" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("game_events")
    .select("narrative_text, created_at")
    .eq("game_id", gameId)
    .eq("epoch", epoch)
    .eq("event_type", "epoch_resolve_snapshot")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // Not yet available (sim still running) — return 404 so caller falls back to mock
    return NextResponse.json({ error: "Snapshot not yet available" }, { status: 404 });
  }

  try {
    const payload = JSON.parse(data.narrative_text ?? "{}");
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Malformed snapshot data" }, { status: 500 });
  }
}
