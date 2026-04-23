import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";
import questionBank from "@/../public/data/question-bank.json";

/**
 * GET /api/solo/[gameId]/state
 * Returns current game state for the solo player:
 * - epoch + round
 * - player team resources
 * - all teams resources (for leaderboard)
 * - one question per round type for this epoch
 */

const ROUND_LEAD_ROLES: Record<string, string> = {
  BUILD: "architect",
  EXPAND: "merchant",
  DEFINE: "diplomat",
  DEFEND: "warlord",
};

function loadQuestionBank() {
  return questionBank as Array<{
    id: string;
    round: string;
    leadRole: string;
    epochMin: number;
    epochMax: number;
    promptText: string;
    options: Array<{ id: string; label: string; description?: string }>;
    allowFreeText: boolean;
    historicalContext: string;
    scaffolding6th: string;
    scaffolding78: string;
  }>;
}

function pickQuestion(questions: ReturnType<typeof loadQuestionBank>, round: string, epoch: number) {
  const role = ROUND_LEAD_ROLES[round];
  const matching = questions.filter(
    (q) => q.round === round && q.leadRole === role && epoch >= q.epochMin && epoch <= q.epochMax
  );

  if (matching.length === 0) {
    // Fallback: any question for this round
    const fallback = questions.filter((q) => q.round === round && q.leadRole === role);
    if (fallback.length === 0) return null;
    return fallback[(epoch - 1) % fallback.length];
  }

  return matching[(epoch - 1) % matching.length];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const supabase = createDirectClient();

  // Get game
  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id, name, current_epoch, current_round")
    .eq("id", gameId)
    .single();

  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Get all teams + resources
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, civilization_name, region_id, population")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  const { data: resources } = await supabase
    .from("team_resources")
    .select("team_id, resource_type, amount")
    .in("team_id", (teams ?? []).map((t) => t.id));

  // Build resource map per team
  const resourcesByTeam: Record<string, Record<string, number>> = {};
  for (const r of resources ?? []) {
    if (!resourcesByTeam[r.team_id]) resourcesByTeam[r.team_id] = {};
    resourcesByTeam[r.team_id][r.resource_type] = r.amount;
  }

  const teamsWithResources = (teams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    civName: t.civilization_name,
    regionId: t.region_id,
    population: t.population,
    resources: resourcesByTeam[t.id] ?? {},
    totalResources: Object.values(resourcesByTeam[t.id] ?? {}).reduce((a, b) => a + b, 0),
  }));

  // Sub-zones for the per-round map-skill interaction (Phase 2 — RoundMapSelector)
  const { data: subZones } = await supabase
    .from("sub_zones")
    .select(
      "id, zone_number, region_id, terrain_type, geojson, yield_modifier, controlled_by_team_id, soil_fertility, wildlife_stock, settlement_name, founding_claim, founding_bonus_active"
    )
    .eq("game_id", gameId);

  // Pick questions for this epoch
  const questions = loadQuestionBank();
  const epochQuestions: Record<string, ReturnType<typeof pickQuestion>> = {};
  for (const round of ["BUILD", "EXPAND", "DEFINE", "DEFEND"]) {
    epochQuestions[round] = pickQuestion(questions, round, game.current_epoch);
  }

  return NextResponse.json({
    gameId,
    gameName: game.name,
    currentEpoch: game.current_epoch,
    currentRound: game.current_round,
    teams: teamsWithResources,
    questions: epochQuestions,
    subZones: (subZones ?? []).map((sz) => ({
      id: sz.id,
      name: `Zone ${sz.zone_number}`,
      zone_number: sz.zone_number,
      region_id: sz.region_id,
      terrain_type: sz.terrain_type,
      geojson: sz.geojson,
      yield_modifier: sz.yield_modifier,
      controlled_by_team_id: sz.controlled_by_team_id,
      soil_fertility: sz.soil_fertility,
      wildlife_stock: sz.wildlife_stock,
      settlement_name: sz.settlement_name,
      founding_claim: sz.founding_claim,
      founding_bonus_active: sz.founding_bonus_active,
    })),
  });
}
