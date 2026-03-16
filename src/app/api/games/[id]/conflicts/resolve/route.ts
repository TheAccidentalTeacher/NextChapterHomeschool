import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeacher } from "@/lib/auth/roles";

/**
 * POST /api/games/[id]/conflicts/resolve
 * DM resolves a conflict flag with override decision.
 *
 * Body: { conflict_id, outcome, teacher_override? }
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
  const { conflict_id, outcome, teacher_override } = body;

  if (!conflict_id || !outcome) {
    return NextResponse.json(
      { error: "Missing conflict_id or outcome" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("epoch_conflict_flags")
    .update({
      outcome: teacher_override ?? outcome,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", conflict_id)
    .eq("game_id", gameId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * GET /api/games/[id]/conflicts
 * Get conflict flags for the current epoch.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();

  // Get current epoch
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();

  const { data, error } = await supabase
    .from("epoch_conflict_flags")
    .select("*")
    .eq("game_id", gameId)
    .eq("epoch", game?.current_epoch ?? 1)
    .order("created_at", { ascending: false });

  if (error) {
    // Table may not exist yet — return empty rather than 500
    return NextResponse.json({ conflicts: [] });
  }

  return NextResponse.json({ conflicts: data ?? [] });
}
