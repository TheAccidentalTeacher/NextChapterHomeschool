// ============================================
// GET /api/games — list all games for this teacher
// POST /api/games — create a new game
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/roles";

export async function GET() {
  try {
    const teacherId = await requireTeacher();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ games: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const teacherId = await requireTeacher();
    const supabase = await createClient();
    const body = await request.json();

    const {
      name,
      class_period = "6th",
      round_timer_minutes = class_period === "6th" ? 8 : 5,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Game name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("games")
      .insert({
        name: name.trim(),
        teacher_id: teacherId,
        current_epoch: 0,
        current_round: "EXPAND",
        epoch_phase: "active",
        math_gate_enabled: false,
        math_gate_difficulty: "multiply",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Store class_period and round_timer in game metadata
    // These aren't in the games table schema, so we store as a related config
    // For now they're part of the response but the core game row is created
    return NextResponse.json({
      game: data,
      config: { class_period, round_timer_minutes },
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
