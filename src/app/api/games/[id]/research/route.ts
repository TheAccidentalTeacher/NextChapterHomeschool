import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";
import { getTech, canResearch, TECH_TREE, getTechStates } from "@/lib/game/tech-tree";
import { canSelectResearch, investLegacy, type ResearchState } from "@/lib/game/research-engine";

// ============================================
// Research API — Tech tree selection & state
// Decision 62: One active research per team per epoch
// ============================================

/**
 * GET /api/games/[id]/research
 * Query: ?team_id=xxx
 * Returns: completed techs, active research, legacy invested, full tech states
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
    return NextResponse.json({ error: "team_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch completed techs
  const { data: completedRows, error: techErr } = await supabase
    .from("tech_research")
    .select("*")
    .eq("team_id", teamId);

  if (techErr) {
    return NextResponse.json({ error: techErr.message }, { status: 500 });
  }

  const completedTechIds = (completedRows ?? []).map((r: { tech_key: string }) => r.tech_key);

  // Fetch active research (from game_events or a dedicated tracker)
  // We store active research in the team_resources metadata or game_events
  // For simplicity, we use the "active_research" field in teams table
  const { data: teamData, error: teamErr } = await supabase
    .from("teams")
    .select("metadata")
    .eq("id", teamId)
    .single();

  if (teamErr && teamErr.code !== "PGRST116") {
    return NextResponse.json({ error: teamErr.message }, { status: 500 });
  }

  const metadata = (teamData?.metadata as Record<string, unknown>) ?? {};
  const activeResearchId = (metadata.active_research_id as string) ?? null;
  const legacyInvestedMap = (metadata.legacy_invested as Record<string, number>) ?? {};

  // Compute tech states
  const techStates = getTechStates(completedTechIds, activeResearchId, legacyInvestedMap);

  return NextResponse.json({
    completedTechIds,
    completedTechs: completedRows ?? [],
    activeResearchId,
    legacyInvested: legacyInvestedMap,
    techStates,
    totalTechs: TECH_TREE.length,
    completedCount: completedTechIds.length,
  });
}

/**
 * POST /api/games/[id]/research
 * Body: { action, team_id, tech_id?, amount? }
 * Actions:
 *   - "select"  — choose active research
 *   - "invest"  — add Legacy to active research
 *   - "cancel"  — cancel current research (lose invested Legacy)
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
  const { action, team_id, tech_id, amount } = body as {
    action: string;
    team_id: string;
    tech_id?: string;
    amount?: number;
  };

  if (!team_id) {
    return NextResponse.json({ error: "team_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Get current team metadata
  const { data: teamData, error: teamErr } = await supabase
    .from("teams")
    .select("metadata")
    .eq("id", team_id)
    .single();

  if (teamErr) {
    return NextResponse.json({ error: teamErr.message }, { status: 500 });
  }

  const metadata = (teamData?.metadata as Record<string, unknown>) ?? {};
  const activeResearchId = (metadata.active_research_id as string) ?? null;
  const legacyInvestedMap = (metadata.legacy_invested as Record<string, number>) ?? {};

  // Get completed techs
  const { data: completedRows } = await supabase
    .from("tech_research")
    .select("tech_key")
    .eq("team_id", team_id);

  const completedTechIds = (completedRows ?? []).map((r: { tech_key: string }) => r.tech_key);

  // ---- ACTION: SELECT ----
  if (action === "select") {
    if (!tech_id) {
      return NextResponse.json({ error: "tech_id required" }, { status: 400 });
    }

    const check = canSelectResearch(tech_id, completedTechIds, activeResearchId);
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }

    const tech = getTech(tech_id);
    if (!tech) {
      return NextResponse.json({ error: "Unknown tech" }, { status: 400 });
    }

    // Set active research in metadata
    const newMetadata = {
      ...metadata,
      active_research_id: tech_id,
      legacy_invested: { ...legacyInvestedMap, [tech_id]: legacyInvestedMap[tech_id] ?? 0 },
    };

    const { error: updateErr } = await supabase
      .from("teams")
      .update({ metadata: newMetadata })
      .eq("id", team_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      activeResearchId: tech_id,
      techName: tech.name,
    });
  }

  // ---- ACTION: INVEST ----
  if (action === "invest") {
    if (!activeResearchId) {
      return NextResponse.json({ error: "No active research" }, { status: 400 });
    }

    const investAmount = amount ?? 0;
    if (investAmount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    const tech = getTech(activeResearchId);
    if (!tech) {
      return NextResponse.json({ error: "Unknown active tech" }, { status: 500 });
    }

    // Check team has enough Legacy
    const { data: resData } = await supabase
      .from("team_resources")
      .select("legacy")
      .eq("team_id", team_id)
      .single();

    const currentLegacy = (resData as { legacy?: number } | null)?.legacy ?? 0;
    if (currentLegacy < investAmount) {
      return NextResponse.json({ error: "Not enough Legacy" }, { status: 400 });
    }

    // Calculate investment result
    const state: ResearchState = {
      activeResearchId,
      legacyInvested: legacyInvestedMap[activeResearchId] ?? 0,
      legacyCostRequired: tech.legacyCost,
      completedTechIds,
      progressPercent: 0,
    };

    const result = investLegacy(state, investAmount);

    // Deduct Legacy
    const { error: deductErr } = await supabase
      .from("team_resources")
      .update({ legacy: currentLegacy - investAmount + result.overflow })
      .eq("team_id", team_id);

    if (deductErr) {
      return NextResponse.json({ error: deductErr.message }, { status: 500 });
    }

    // Update invested amount
    const newInvestedMap = {
      ...legacyInvestedMap,
      [activeResearchId]: result.newInvested,
    };

    const newMetadata: Record<string, unknown> = {
      ...metadata,
      legacy_invested: newInvestedMap,
    };

    if (result.completed) {
      // Tech completed! Clear active research
      newMetadata.active_research_id = null;

      // Get epoch for recording
      const { data: gameData } = await supabase
        .from("games")
        .select("current_epoch")
        .eq("id", gameId)
        .single();

      const currentEpoch = (gameData as { current_epoch?: number } | null)?.current_epoch ?? 1;

      // Insert completed tech
      const { error: insertErr } = await supabase
        .from("tech_research")
        .insert({
          team_id: team_id,
          tech_key: activeResearchId,
          tier: tech.tier,
          researched_epoch: currentEpoch,
        });

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      // Log event
      await supabase.from("game_events").insert({
        game_id: gameId,
        epoch: currentEpoch,
        event_type: "tech_completed",
        payload: {
          team_id,
          tech_id: activeResearchId,
          tech_name: tech.name,
          tier: tech.tier,
          unlocks: tech.unlocks,
        },
      });
    }

    // Update team metadata
    const { error: updateErr } = await supabase
      .from("teams")
      .update({ metadata: newMetadata })
      .eq("id", team_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invested: result.newInvested,
      completed: result.completed,
      overflow: result.overflow,
      techName: tech.name,
    });
  }

  // ---- ACTION: CANCEL ----
  if (action === "cancel") {
    if (!activeResearchId) {
      return NextResponse.json({ error: "No active research to cancel" }, { status: 400 });
    }

    // Clear research — invested Legacy is LOST
    const newInvestedMap = { ...legacyInvestedMap };
    delete newInvestedMap[activeResearchId];

    const newMetadata = {
      ...metadata,
      active_research_id: null,
      legacy_invested: newInvestedMap,
    };

    const { error: updateErr } = await supabase
      .from("teams")
      .update({ metadata: newMetadata })
      .eq("id", team_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cancelled: activeResearchId,
    });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
