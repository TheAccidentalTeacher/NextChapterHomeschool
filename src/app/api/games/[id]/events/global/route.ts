import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeacher } from "@/lib/auth/roles";

/**
 * POST /api/games/[id]/events/global
 * DM fires a global event that broadcasts to all devices + projector.
 *
 * Body: { event_type, description, metadata? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;

  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Teacher only" }, { status: 403 });
  }

  const body = await req.json();
  const { event_type, description, metadata } = body;

  if (!event_type || !description) {
    return NextResponse.json(
      { error: "Missing event_type or description" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get current epoch
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();

  // Get all team IDs for this game
  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("game_id", gameId);

  const affectedTeamIds = (teams ?? []).map((t) => t.id);

  const { data, error } = await supabase
    .from("game_events")
    .insert({
      game_id: gameId,
      epoch: game?.current_epoch ?? 1,
      event_type,
      description,
      affected_team_ids: affectedTeamIds,
      metadata: metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * GET /api/games/[id]/events/global
 * Get recent global events.
 * Query: ?epoch=
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();
  const url = new URL(req.url);
  const epochFilter = url.searchParams.get("epoch");

  let query = supabase
    .from("game_events")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (epochFilter) {
    query = query.eq("epoch", parseInt(epochFilter));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
