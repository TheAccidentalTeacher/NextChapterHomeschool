import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

/**
 * GET /api/games/[id]/codex — Fetch codex for a team
 * Query params: ?team_id=xxx
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = req.nextUrl.searchParams.get("team_id");
  if (!teamId) {
    return NextResponse.json({ error: "Missing team_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("civilization_codex")
    .select("*")
    .eq("team_id", teamId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ codex: data ?? null });
}

/**
 * POST /api/games/[id]/codex — Create or update codex (Decision 91)
 * Body: {
 *   team_id: string,
 *   language_name: string | null,
 *   deity_name: string | null,
 *   core_belief: string | null,
 * }
 *
 * Grants +5 Legacy one-time bonus when all three fields complete.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { team_id, language_name, deity_name, core_belief } = body;

  if (!team_id) {
    return NextResponse.json({ error: "Missing team_id" }, { status: 400 });
  }

  const supabase = await createClient();

  // Get current epoch
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();

  const currentEpoch = game?.current_epoch ?? 1;

  // Check if codex already exists
  const { data: existing } = await supabase
    .from("civilization_codex")
    .select("*")
    .eq("team_id", team_id)
    .single();

  const allFieldsComplete =
    (language_name?.trim()?.length ?? 0) > 0 &&
    (deity_name?.trim()?.length ?? 0) > 0 &&
    (core_belief?.trim()?.length ?? 0) > 0;

  if (existing) {
    // Update existing
    const wasAlreadyComplete = existing.legacy_bonus_applied;
    const shouldApplyBonus = allFieldsComplete && !wasAlreadyComplete;

    const { error } = await supabase
      .from("civilization_codex")
      .update({
        language_name: language_name?.trim() || null,
        deity_name: deity_name?.trim() || null,
        core_belief: core_belief?.trim() || null,
        legacy_bonus_applied: wasAlreadyComplete || allFieldsComplete,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Apply +5 Legacy bonus if newly complete
    if (shouldApplyBonus) {
      await applyLegacyBonus(supabase, team_id);
    }

    return NextResponse.json({
      codex: { ...existing, language_name, deity_name, core_belief },
      bonusApplied: shouldApplyBonus,
    });
  } else {
    // Create new codex
    const { data: newCodex, error } = await supabase
      .from("civilization_codex")
      .insert({
        team_id,
        language_name: language_name?.trim() || null,
        deity_name: deity_name?.trim() || null,
        core_belief: core_belief?.trim() || null,
        legacy_bonus_applied: allFieldsComplete,
        created_epoch: currentEpoch,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (allFieldsComplete) {
      await applyLegacyBonus(supabase, team_id);
    }

    return NextResponse.json({
      codex: newCodex,
      bonusApplied: allFieldsComplete,
    });
  }
}

/**
 * Apply +5 Legacy one-time bonus to a team's Legacy resource
 */
async function applyLegacyBonus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string
) {
  const { data: legacyRes } = await supabase
    .from("team_resources")
    .select("amount")
    .eq("team_id", teamId)
    .eq("resource_type", "legacy")
    .single();

  const current = legacyRes?.amount ?? 0;
  await supabase
    .from("team_resources")
    .upsert(
      {
        team_id: teamId,
        resource_type: "legacy",
        amount: current + 5,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_id,resource_type" }
    );
}
