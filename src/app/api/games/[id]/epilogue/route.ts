import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculateVictories,
  calculateOverallStandings,
  VICTORY_CONDITIONS,
  type TeamData,
  type VictoryType,
} from "@/lib/game/victory-engine";
import { generateAllHistories, type CivHistoryInput } from "@/lib/ai/civilization-history";

// ============================================
// Epilogue API — trigger + data endpoint
// Decision 68: No resources, no combat — story begins
// ============================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();

  // Get histories
  const { data: histories } = await supabase
    .from("epilogue_histories")
    .select("team_id, history_text, teams(name)")
    .eq("game_id", gameId);

  // Get victory conditions
  const { data: vcData } = await supabase
    .from("victory_conditions")
    .select("*")
    .eq("game_id", gameId)
    .eq("active", true);

  // Get teams for victory calc
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("game_id", gameId);

  // Build VictoryResults from stored data or calculate live
  const victoryResults = (vcData ?? []).map((vc) => {
    const type = vc.condition_type as VictoryType;
    const cond = VICTORY_CONDITIONS[type];
    return {
      type,
      label: cond?.label ?? type,
      emoji: cond?.emoji ?? "🏆",
      winner: vc.triggered_by_team_id
        ? {
            teamId: vc.triggered_by_team_id as string,
            teamName: teams?.find((t) => t.id === vc.triggered_by_team_id)?.name ?? "Unknown",
          }
        : null,
      standings: [], // Full standings calculated on epilogue trigger
    };
  });

  // Get closing video
  const { data: closingAsset } = await supabase
    .from("heygen_assets")
    .select("video_url")
    .eq("event_type", "epilogue_closing")
    .single();
  const closingVideoUrl = (closingAsset?.video_url as string) ?? null;

  return NextResponse.json({
    histories: (histories ?? []).map((h) => ({
      teamId: h.team_id,
      teamName: (h.teams as unknown as { name: string } | null)?.name ?? "Unknown",
      historyText: h.history_text,
    })),
    victories: victoryResults,
    closingVideoUrl,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const { action } = body as { action: string };

  if (action === "trigger") {
    // ---- TRIGGER EPILOGUE ----

    // 1. Get all teams
    const { data: teams } = await supabase
      .from("teams")
      .select("*")
      .eq("game_id", gameId);

    if (!teams || teams.length === 0) {
      return NextResponse.json({ error: "No teams found" }, { status: 404 });
    }

    // 2. Get all resources
    const { data: resources } = await supabase
      .from("team_resources")
      .select("*")
      .eq("game_id", gameId);

    // 3. Get tech research
    const { data: techs } = await supabase
      .from("tech_research")
      .select("team_id, tech_id, completed")
      .eq("game_id", gameId)
      .eq("completed", true);

    // 4. Build TeamData for victory engine
    const teamDataList: TeamData[] = teams.map((t) => {
      const res = resources?.find((r) => r.team_id === t.id);
      const teamTechs = (techs ?? [])
        .filter((tc) => tc.team_id === t.id)
        .map((tc) => tc.tech_id as string);

      // Determine highest tech tier (simplified)
      let highestTier = 0;
      if (teamTechs.length >= 20) highestTier = 4;
      else if (teamTechs.length >= 12) highestTier = 3;
      else if (teamTechs.length >= 6) highestTier = 2;
      else if (teamTechs.length >= 1) highestTier = 1;

      return {
        id: t.id,
        name: t.name,
        resources: {
          production: (res?.production as number) ?? 0,
          reach: (res?.reach as number) ?? 0,
          legacy: (res?.legacy as number) ?? 0,
          resilience: (res?.resilience as number) ?? 0,
        },
        population: (res?.population as number) ?? 10,
        ciScore: ((t.metadata as Record<string, unknown>)?.ciScore as number) ?? 0,
        ciSpread: ((t.metadata as Record<string, unknown>)?.ciSpread as number) ?? 0,
        totalSubZones: 0,
        highestTechTier: highestTier,
        completedTechs: teamTechs,
        wondersCompleted: [],
      };
    });

    // 5. Get active victory conditions
    const { data: vcConfig } = await supabase
      .from("game_state")
      .select("metadata")
      .eq("game_id", gameId)
      .single();

    const activeConditions: VictoryType[] =
      ((vcConfig?.metadata as Record<string, unknown>)?.victoryConditions as VictoryType[]) ??
      ["economic", "population", "cultural", "scientific"];

    // 6. Calculate victories
    const victoryResults = calculateVictories(teamDataList, activeConditions);
    const overallStandings = calculateOverallStandings(victoryResults, teamDataList);

    // 7. Store victory results
    for (const result of victoryResults) {
      await supabase.from("victory_conditions").upsert({
        game_id: gameId,
        condition_type: result.type,
        active: true,
        triggered_by_team_id: result.achievedBy,
      }, { onConflict: "game_id,condition_type" });
    }

    // 8. Generate civilization histories
    const { data: submissions } = await supabase
      .from("submissions")
      .select("team_id")
      .eq("game_id", gameId);

    const { data: wars } = await supabase
      .from("game_events")
      .select("*")
      .eq("game_id", gameId)
      .in("event_type", ["battle_resolved", "war_declared"]);

    const { data: resourceSnapshots } = await supabase
      .from("resource_snapshots")
      .select("*")
      .eq("game_id", gameId)
      .order("epoch", { ascending: true });

    const historyInputs: CivHistoryInput[] = teamDataList.map((team) => {
      const teamSubmissions = (submissions ?? []).filter(
        (s) => s.team_id === team.id
      );
      const teamSnapshots = (resourceSnapshots ?? [])
        .filter((s) => s.team_id === team.id)
        .map((s) => ({
          epoch: s.epoch as number,
          production: s.production as number,
          reach: s.reach as number,
          legacy: s.legacy as number,
          resilience: s.resilience as number,
          population: s.population as number,
        }));

      const overallRank = overallStandings.find((s) => s.teamId === team.id);

      return {
        teamId: team.id,
        teamName: team.name,
        civName: team.name,
        epochs: teamSnapshots.length,
        territory: [],
        resourceArc:
          teamSnapshots.length > 0
            ? teamSnapshots
            : [{ epoch: 1, production: 10, reach: 10, legacy: 5, resilience: 10, population: 10 }],
        wondersCompleted: team.wondersCompleted,
        techsResearched: team.completedTechs,
        wars: (wars ?? [])
          .filter((w) => {
            const payload = w.payload as Record<string, unknown>;
            return payload?.attackerId === team.id || payload?.defenderId === team.id;
          })
          .map((w) => {
            const payload = w.payload as Record<string, unknown>;
            return {
              opponent: payload?.attackerId === team.id
                ? String(payload?.defenderId ?? "Unknown")
                : String(payload?.attackerId ?? "Unknown"),
              epoch: (w as Record<string, unknown>).epoch as number ?? 1,
              won: payload?.winnerId === team.id,
            };
          }),
        tradeAgreements: 0,
        mythologyCreatures: [],
        codexEntries: 0,
        victoryTypes: victoryResults
          .filter((v) => v.achievedBy === team.id)
          .map((v) => v.type),
        submissionCount: teamSubmissions.length,
        roleSummary: {},
      };
    });

    const generatedHistories = await generateAllHistories(historyInputs);

    // 9. Store histories
    for (const h of generatedHistories) {
      await supabase.from("epilogue_histories").upsert({
        team_id: h.teamId,
        game_id: gameId,
        history_text: h.historyText,
        generated_at: h.generatedAt,
      }, { onConflict: "team_id,game_id" });
    }

    // 10. Mark game as epilogue generated
    await supabase
      .from("game_state")
      .update({
        metadata: {
          ...(vcConfig?.metadata as Record<string, unknown> ?? {}),
          epilogueGenerated: true,
        },
      })
      .eq("game_id", gameId);

    return NextResponse.json({
      success: true,
      historiesGenerated: generatedHistories.length,
      victoriesCalculated: victoryResults.length,
      overallStandings,
    });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
