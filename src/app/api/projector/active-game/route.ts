// ============================================
// GET /api/projector/active-game — public endpoint (no auth)
// Returns the most recently updated non-solo game that is active.
// Used by the projector screen to auto-discover the game without
// requiring teacher auth.
// ============================================

import { NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createDirectClient();

    // Find the most recently active game (not solo)
    const { data, error } = await supabase
      .from("games")
      .select("id, name")
      .neq("teacher_id", "solo_mode")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ gameId: null });
    }

    return NextResponse.json({ gameId: data.id, name: data.name });
  } catch {
    return NextResponse.json({ gameId: null });
  }
}
