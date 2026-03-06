// ============================================
// GET /api/games/[id]/teams — list teams for a game
// POST /api/games/[id]/teams — create a team
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

    // Verify game belongs to teacher
    const { data: game, error: gameErr } = await supabase
      .from("games")
      .select("id")
      .eq("id", id)
      .eq("teacher_id", teacherId)
      .single();

    if (gameErr || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const { data: teams, error } = await supabase
      .from("teams")
      .select(`
        *,
        team_members (*)
      `)
      .eq("game_id", id)
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ teams: teams ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Verify game belongs to teacher
    const { data: game, error: gameErr } = await supabase
      .from("games")
      .select("id")
      .eq("id", id)
      .eq("teacher_id", teacherId)
      .single();

    if (gameErr || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const { team_number, region_id, name } = body;

    if (!team_number || !region_id) {
      return NextResponse.json(
        { error: "team_number and region_id are required" },
        { status: 400 }
      );
    }

    // Create team
    const teamName = name || `Team ${team_number}`;
    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        game_id: id,
        name: teamName,
        region_id,
        population: 5,
        government_type: "chiefdom",
        is_in_dark_age: false,
        war_exhaustion_level: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-create starting resources for this team (epoch 0)
    const resourceTypes = ["production", "reach", "legacy", "resilience", "food"];
    const resourceInserts = resourceTypes.map((rt) => ({
      team_id: team.id,
      resource_type: rt,
      amount: rt === "food" ? 10 : 0, // Start with 10 food, 0 of everything else
    }));

    await supabase.from("team_resources").insert(resourceInserts);

    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
