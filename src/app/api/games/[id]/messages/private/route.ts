import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeacher } from "@/lib/auth/roles";

/**
 * POST /api/games/[id]/messages/private
 * DM sends a private intel drop to a specific team.
 *
 * Body: { to_team_id, message }
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
  const { to_team_id, message } = body;

  if (!to_team_id || !message) {
    return NextResponse.json(
      { error: "Missing to_team_id or message" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("private_messages")
    .insert({
      game_id: gameId,
      from_team_id: null, // null = from DM
      to_team_id,
      message,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * GET /api/games/[id]/messages/private
 * Get private messages for a team.
 * Query: ?team_id=
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();
  const url = new URL(req.url);
  const teamId = url.searchParams.get("team_id");

  if (!teamId) {
    return NextResponse.json({ error: "team_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("private_messages")
    .select("*")
    .eq("game_id", gameId)
    .eq("to_team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
