// ============================================
// POST /api/games/[id]/reset
// Teacher-only: reset a game back to epoch 1 / login step,
// keeping teams and team_members intact.
//
// Clears:
//   - games: current_round → "login", current_epoch → 1
//   - epoch_submissions (all submissions for this game)
//   - epoch_role_assignments (cover assignments)
//   - sub_zones (all territory state — settlements, buildings via cascade delete team_assets)
//   - team_assets (buildings)
//   - team_resources (reset all to 0 except food which starts at 0)
//   - tech_research records for this game's teams
//   - trade_offers / trade_agreements / trade_embargoes
//   - wonder_progress
//   - teams: reset population → 5, civilization_name → null, war_exhaustion_level → 0
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";
import { requireTeacher } from "@/lib/auth/roles";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Teacher only" }, { status: 403 });
  }

  const { id: gameId } = await params;
  const supabase = createDirectClient();

  // Verify the game exists
  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id, teacher_id")
    .eq("id", gameId)
    .single();

  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Get all team IDs for this game (needed for targeted deletes)
  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("game_id", gameId);

  const teamIds = (teams ?? []).map((t: { id: string }) => t.id);

  const errors: string[] = [];

  // 1. Reset game state
  const { error: e1 } = await supabase
    .from("games")
    .update({ current_round: "login", current_epoch: 1 })
    .eq("id", gameId);
  if (e1) errors.push(`games: ${e1.message}`);

  // 2. Reset teams
  if (teamIds.length > 0) {
    const { error: e2 } = await supabase
      .from("teams")
      .update({
        population: 5,
        civilization_name: null,
        war_exhaustion_level: 0,
        is_in_dark_age: false,
        confederation_id: null,
      })
      .in("id", teamIds);
    if (e2) errors.push(`teams: ${e2.message}`);
  }

  // 3. Delete all submissions for this game
  const { error: e3 } = await supabase
    .from("epoch_submissions")
    .delete()
    .eq("game_id", gameId);
  if (e3) errors.push(`epoch_submissions: ${e3.message}`);

  // 4. Delete cover/role assignments for this game's teams
  if (teamIds.length > 0) {
    const { error: e4 } = await supabase
      .from("epoch_role_assignments")
      .delete()
      .in("team_id", teamIds);
    if (e4) errors.push(`epoch_role_assignments: ${e4.message}`);
  }

  // 5. Delete sub_zones for this game (settlement names, founding, depletion)
  const { error: e5 } = await supabase
    .from("sub_zones")
    .delete()
    .eq("game_id", gameId);
  if (e5) errors.push(`sub_zones: ${e5.message}`);

  // 6. Delete team_assets (buildings) for this game
  const { error: e6 } = await supabase
    .from("team_assets")
    .delete()
    .eq("game_id", gameId);
  if (e6) errors.push(`team_assets: ${e6.message}`);

  // 7. Reset team_resources to 0
  if (teamIds.length > 0) {
    const { error: e7 } = await supabase
      .from("team_resources")
      .update({ amount: 0 })
      .in("team_id", teamIds);
    if (e7) errors.push(`team_resources: ${e7.message}`);
  }

  // 8. Delete tech research
  if (teamIds.length > 0) {
    const { error: e8 } = await supabase
      .from("tech_research")
      .delete()
      .in("team_id", teamIds);
    if (e8) errors.push(`tech_research: ${e8.message}`);
  }

  // 9. Delete trade records
  const { error: e9a } = await supabase
    .from("trade_offers")
    .delete()
    .eq("game_id", gameId);
  if (e9a) errors.push(`trade_offers: ${e9a.message}`);

  const { error: e9b } = await supabase
    .from("trade_agreements")
    .delete()
    .eq("game_id", gameId);
  if (e9b) errors.push(`trade_agreements: ${e9b.message}`);

  const { error: e9c } = await supabase
    .from("embargoes")
    .delete()
    .eq("game_id", gameId);
  if (e9c) errors.push(`embargoes: ${e9c.message}`);

  // 10. Delete wonder progress
  if (teamIds.length > 0) {
    const { error: e10 } = await supabase
      .from("wonder_progress")
      .delete()
      .in("team_id", teamIds);
    if (e10) errors.push(`wonder_progress: ${e10.message}`);
  }

  // 11. Un-absent all team members
  if (teamIds.length > 0) {
    const { error: e11 } = await supabase
      .from("team_members")
      .update({ is_absent: false })
      .in("team_id", teamIds);
    if (e11) errors.push(`team_members: ${e11.message}`);
  }

  if (errors.length > 0) {
    // Log details but still return success if the core tables (games, teams, submissions) reset
    const coreFailures = errors.filter(e =>
      e.startsWith("games:") || e.startsWith("epoch_submissions:") || e.startsWith("teams:")
    );
    if (coreFailures.length > 0) {
      return NextResponse.json(
        { error: "Core reset failed", details: errors },
        { status: 500 }
      );
    }
    // Non-critical tables failed (e.g. trade/wonder tables may be empty) — still OK
    console.warn("Reset: non-critical table errors", errors);
  }

  return NextResponse.json({ ok: true, message: "Game reset to epoch 1 / login" });
}
