// ============================================
// GET /api/games/[id]/questions
// Decision 27: Contextual question selection for multiplayer classroom
//
// Selects the best-matching question from the static bank for
// a team's current game state. Returns the full question with
// scaffolding so RoundSubmissionCard can display it.
//
// Query params:
//   team_id   — required
//   round     — round type: BUILD | EXPAND | DEFINE | DEFEND
//
// The question bank lives in public/data/question-bank.json.
// Selection uses the same scoring logic as the solo mode selector.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";
import { selectQuestion } from "@/lib/questions/selector";
import type { TeamStateSnapshot } from "@/lib/questions/types";
import { getHighestTier } from "@/lib/game/research-engine";
import { promises as fs } from "fs";
import path from "path";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: gameId } = await params;
    const teamId = req.nextUrl.searchParams.get("team_id");
    const roundType = req.nextUrl.searchParams.get("round") ?? "BUILD";

    if (!teamId) {
      return NextResponse.json({ error: "team_id required" }, { status: 400 });
    }

    const supabase = createDirectClient();

    // Fetch team + resources + techs + sub-zones in parallel
    const [teamResult, resourcesResult, techsResult, subZonesResult] =
      await Promise.all([
        supabase
          .from("teams")
          .select("id, region_id, population, is_in_dark_age, war_exhaustion_level")
          .eq("id", teamId)
          .single(),
        supabase
          .from("team_resources")
          .select("resource_type, amount")
          .eq("team_id", teamId),
        supabase
          .from("tech_research")
          .select("tech_key")
          .eq("team_id", teamId),
        supabase
          .from("sub_zones")
          .select("terrain_type, controlled_by_team_id")
          .eq("game_id", gameId),
      ]);

    const team = teamResult.data as unknown as {
      id: string;
      region_id: number;
      population: number;
      is_in_dark_age: boolean;
      war_exhaustion_level: number;
    } | null;

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Build resource levels map
    const resourceRows = (resourcesResult.data ?? []) as unknown as Array<{
      resource_type: string;
      amount: number;
    }>;
    const resourceLevels: Record<string, number> = {};
    for (const r of resourceRows) {
      resourceLevels[r.resource_type] = r.amount;
    }

    // Build completed tech IDs + tech tier
    const techRows = (techsResult.data ?? []) as unknown as Array<{
      tech_key: string;
    }>;
    const completedTechIds = techRows.map((t) => t.tech_key);
    const techTier = getHighestTier(completedTechIds);

    // Derive terrain types of sub-zones controlled by this team
    const subZoneRows = (subZonesResult.data ?? []) as unknown as Array<{
      terrain_type: string;
      controlled_by_team_id: string | null;
    }>;
    const ownedSubZones = subZoneRows.filter(
      (sz) => sz.controlled_by_team_id === teamId
    );
    const terrainTypes = [...new Set(ownedSubZones.map((sz) => sz.terrain_type))];

    // Buildings owned by this team (from team_assets)
    const { data: buildingRows } = await supabase
      .from("team_assets")
      .select("asset_key")
      .eq("team_id", teamId)
      .eq("game_id", gameId)
      .eq("is_active", true);

    const buildingKeys = (buildingRows ?? []).map(
      (b: { asset_key: string }) => b.asset_key
    );

    // Role from team members — pick the lead role for this round type
    // (the caller passes `round` which maps to a lead role via the question bank)
    // We still need the role to filter questions. Read from the request or
    // fall back to looking up the submitting member's role.
    const roleParam = req.nextUrl.searchParams.get("role");

    // Build team state snapshot
    const snapshot: TeamStateSnapshot = {
      epoch: 1, // will be overridden by epoch from caller — read from game
      round: roundType,
      role: roleParam ?? "architect",
      territoryCount: ownedSubZones.length,
      techTier,
      terrainTypes,
      resourceLevels,
      isInDarkAge: team.is_in_dark_age,
      warExhaustionLevel: team.war_exhaustion_level,
      isContactOpen: false, // TODO: check active agreements
      population: team.population,
      hasSpecificBuildings: buildingKeys,
    };

    // Pull epoch from game record
    const { data: gameRow } = await supabase
      .from("games")
      .select("current_epoch")
      .eq("id", gameId)
      .single();

    snapshot.epoch = (gameRow as unknown as { current_epoch: number })?.current_epoch ?? 1;

    // Load question bank from public/data/
    const bankPath = path.join(process.cwd(), "public", "data", "question-bank.json");
    const bankRaw = await fs.readFile(bankPath, "utf-8");
    const bank = JSON.parse(bankRaw);

    const question = selectQuestion(bank, snapshot);

    if (!question) {
      // Fallback: generic placeholder so the UI always has something to show
      return NextResponse.json({
        question: {
          id: "fallback",
          promptText: `As ${roleParam ?? "your role"}, what is your civilization's priority this ${roundType} round?`,
          options: [
            { id: "a", label: "Expand and grow" },
            { id: "b", label: "Consolidate and strengthen" },
            { id: "c", label: "Invest in knowledge" },
          ],
          allowFreeText: true,
          historicalContext:
            "Every great civilization has faced moments that defined their legacy.",
          scaffolding6th: "I believe our civilization should [choice] because...",
          scaffolding78: "What factors make this the best strategy for your civilization right now?",
        },
        fallback: true,
      });
    }

    return NextResponse.json({ question, fallback: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
