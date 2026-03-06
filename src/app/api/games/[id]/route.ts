// ============================================
// GET /api/games/[id] — get full game state
// PUT /api/games/[id] — update game settings
// DELETE /api/games/[id] — delete a game
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id } = await params;
    const supabase = await createClient();

    const { data: game, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .eq("teacher_id", teacherId)
      .single();

    if (error || !game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Also fetch teams for this game
    const { data: teams } = await supabase
      .from("teams")
      .select(`
        *,
        team_members (*)
      `)
      .eq("game_id", id)
      .order("name");

    return NextResponse.json({ game, teams: teams ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields: Record<string, unknown> = {};
    if (body.name) allowedFields.name = body.name;
    if (body.current_epoch !== undefined) allowedFields.current_epoch = body.current_epoch;
    if (body.current_round) allowedFields.current_round = body.current_round;
    if (body.epoch_phase) allowedFields.epoch_phase = body.epoch_phase;
    if (body.math_gate_enabled !== undefined) allowedFields.math_gate_enabled = body.math_gate_enabled;
    if (body.math_gate_difficulty) allowedFields.math_gate_difficulty = body.math_gate_difficulty;
    allowedFields.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("games")
      .update(allowedFields)
      .eq("id", id)
      .eq("teacher_id", teacherId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ game: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("games")
      .delete()
      .eq("id", id)
      .eq("teacher_id", teacherId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
