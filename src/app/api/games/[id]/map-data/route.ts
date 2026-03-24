// ============================================
// GET /api/games/[id]/map-data — public endpoint for map rendering
// Returns team region assignments without requiring auth.
// Used by student dashboard and projector to color team territories.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createDirectClient();

    const { data: teams, error } = await supabase
      .from("teams")
      .select("id, name, civilization_name, region_id, draft_order, population")
      .eq("game_id", id)
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ teams: teams ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
