import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePortfolioHTML, type PortfolioData } from "@/lib/export/portfolio-pdf";

// ============================================
// Portfolio Export API — per team
// Decisions 74, 82: Portfolio PDF (HTML) generation
// ============================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const { gameId, studentId } = body as { gameId: string; studentId?: string };

  if (!gameId) {
    return NextResponse.json({ error: "gameId required" }, { status: 400 });
  }

  // Fetch team data
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // Fetch submissions
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .order("epoch", { ascending: true });

  // Fetch role history
  const { data: roleHistory } = await supabase
    .from("role_assignments")
    .select("epoch, role, student_id, absent")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .order("epoch", { ascending: true });

  // Fetch resource snapshots
  const { data: resourceSnapshots } = await supabase
    .from("resource_snapshots")
    .select("epoch, production, reach, legacy, resilience, population")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .order("epoch", { ascending: true });

  // Fetch wonder progress
  const { data: wonders } = await supabase
    .from("wonder_progress")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_id", gameId);

  // Fetch mythology creatures
  const { data: creatures } = await supabase
    .from("mythology_creatures")
    .select("name, description, epoch")
    .eq("team_id", teamId)
    .eq("game_id", gameId);

  // Fetch civilization history
  const { data: history } = await supabase
    .from("epilogue_histories")
    .select("history_text")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .single();

  // Fetch flag
  const { data: flag } = await supabase
    .from("civilization_flags")
    .select("file_url")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .eq("dm_approved", true)
    .single();

  // Fetch victory standings
  const { data: victories } = await supabase
    .from("victory_conditions")
    .select("*")
    .eq("game_id", gameId);

  // Build portfolio data
  const portfolioData: PortfolioData = {
    studentName: studentId ?? "Team Portfolio",
    civName: (team.metadata as Record<string, unknown>)?.civName as string ?? team.name,
    teamName: team.name,
    classPeriod: (team.metadata as Record<string, unknown>)?.classPeriod as string ?? "1",
    flagUrl: flag?.file_url as string | undefined,
    roleHistory: (roleHistory ?? [])
      .filter((r) => !studentId || r.student_id === studentId)
      .map((r) => ({
        epoch: r.epoch as number,
        role: r.role as string,
        absent: !!(r.absent),
      })),
    submissions: (submissions ?? [])
      .filter((s) => !studentId || (s as Record<string, unknown>).student_id === studentId)
      .map((s) => ({
        epoch: s.epoch as number,
        round: s.round as number,
        role: (s.role as string) ?? "",
        questionPrompt: (s.question_prompt as string) ?? "",
        selectedOption: (s.selected_option as string) ?? "",
        justification: (s.justification as string) ?? "",
        multiplier: (s.multiplier as number) ?? 1.0,
      })),
    creatures: (creatures ?? []).map((c) => ({
      name: c.name as string,
      description: c.description as string,
      epoch: c.epoch as number,
    })),
    artArtifacts: [], // TODO: gallery artifacts
    wonders: (wonders ?? []).map((w) => ({
      name: (w.wonder_id as string) ?? "",
      contribution: ((w.metadata as Record<string, unknown>)?.contribution as number) ?? 0,
      completed: !!(w.completed_at),
      milestones: ((w.metadata as Record<string, unknown>)?.milestones as string[]) ?? [],
    })),
    resourceArc: (resourceSnapshots ?? []).map((r) => ({
      epoch: r.epoch as number,
      production: r.production as number,
      reach: r.reach as number,
      legacy: r.legacy as number,
      resilience: r.resilience as number,
      population: r.population as number,
    })),
    civHistory: (history?.history_text as string) ?? "History not yet generated.",
    standings: (victories ?? []).map((v) => ({
      victoryType: v.condition_type as string,
      rank: (v as Record<string, unknown>).rank as number ?? 0,
      achieved: !!(v.triggered_by_team_id === teamId),
    })),
  };

  const html = generatePortfolioHTML(portfolioData);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="portfolio-${teamId}.html"`,
    },
  });
}
