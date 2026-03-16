// POST /api/games/[id]/rotate-roles
// Cycles every team member's role forward by one position.
// Rotation order: architect → merchant → diplomat → lorekeeper → warlord → architect
// Works for any team size — members beyond 5 just share roles (same as initial setup).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth/roles";

const ROLE_ORDER = ["architect", "merchant", "diplomat", "lorekeeper", "warlord"] as const;

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacher();
    const { id } = await params;
    const supabase = await createClient();

    // Verify game ownership
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("id", id)
      .eq("teacher_id", teacherId)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Fetch all team members for this game
    const { data: teams } = await supabase
      .from("teams")
      .select("id")
      .eq("game_id", id);

    if (!teams?.length) {
      return NextResponse.json({ rotated: 0 });
    }

    const teamIds = teams.map((t) => t.id);

    // Fetch members — try with secondary_role; fall back without it if column doesn't exist yet
    type MemberRow = { id: string; assigned_role: string; secondary_role: string | null; is_absent: boolean };
    let members: MemberRow[] | null = null;
    {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, assigned_role, secondary_role, is_absent")
        .in("team_id", teamIds);

      if (!error && data) {
        members = data.map((m) => ({ ...m, secondary_role: (m as unknown as { secondary_role?: string | null }).secondary_role ?? null }));
      } else {
        // secondary_role column may not exist yet (migration 008) — rotate primary roles only
        const { data: fallback, error: fallbackErr } = await supabase
          .from("team_members")
          .select("id, assigned_role, is_absent")
          .in("team_id", teamIds);
        if (fallbackErr || !fallback?.length) {
          return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
        }
        members = fallback.map((m) => ({ ...m, secondary_role: null }));
      }
    }

    if (!members?.length) {
      return NextResponse.json({ rotated: 0 });
    }

    // Rotate each member's primary role (and secondary role if they have one) forward by 1.
    // Both slots shift +1 independently, maintaining the invariant that all 5 roles are
    // covered exactly once across the team each epoch.
    const updates = members.map((m) => {
      const pIdx = ROLE_ORDER.indexOf(m.assigned_role as typeof ROLE_ORDER[number]);
      const nextPrimary = ROLE_ORDER[(pIdx + 1) % ROLE_ORDER.length];
      const nextSecondary = m.secondary_role
        ? ROLE_ORDER[(ROLE_ORDER.indexOf(m.secondary_role as typeof ROLE_ORDER[number]) + 1) % ROLE_ORDER.length]
        : null;
      return { id: m.id, assigned_role: nextPrimary, secondary_role: nextSecondary };
    });

    // Batch update — Supabase doesn't support bulk update with different values per row,
    // so we build individual updates in parallel (35 students max, fine to parallelize)
    const results = await Promise.all(
      updates.map(({ id: memberId, assigned_role, secondary_role }) =>
        supabase
          .from("team_members")
          .update({ assigned_role, secondary_role })
          .eq("id", memberId)
      )
    );

    const errors = results.filter((r) => r.error);
    if (errors.length) {
      return NextResponse.json(
        { error: `${errors.length} update(s) failed`, rotated: updates.length - errors.length },
        { status: 500 }
      );
    }

    return NextResponse.json({ rotated: updates.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
