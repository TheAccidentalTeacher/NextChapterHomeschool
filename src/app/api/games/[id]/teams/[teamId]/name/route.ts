// ============================================
// POST /api/games/[id]/teams/[teamId]/name — submit civ name (student-facing)
// GET  /api/games/[id]/teams/[teamId]/name — get current civ name status
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string; teamId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { teamId } = await params;
    const supabase = await createClient();

    const { data: team, error } = await supabase
      .from("teams")
      .select("id, civilization_name")
      .eq("id", teamId)
      .single();

    if (error || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check for pending name submissions in civilization_names table
    const { data: pending } = await supabase
      .from("civilization_names")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(1);

    return NextResponse.json({
      approved_name: team.civilization_name,
      pending_submission: pending?.[0] ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await requireAuth();
    const { teamId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { name } = body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Civilization name is required" },
        { status: 400 }
      );
    }

    if (name.trim().length > 40) {
      return NextResponse.json(
        { error: "Name must be 40 characters or less" },
        { status: 400 }
      );
    }

    // Verify the user is a member of this team
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("clerk_user_id", userId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    // Insert or update pending name
    const { data, error } = await supabase
      .from("civilization_names")
      .upsert(
        {
          team_id: teamId,
          name: name.trim(),
          approved_by_teacher: false,
          submitted_by: userId,
        },
        { onConflict: "team_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submission: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
