// ============================================
// DM Game Page — Live game management for the teacher
// Decision 3: Teacher = Dungeon Master (DM)
// Decision 79: Epoch state machine w/ step-by-step flow
//
// This page is the teacher's control center during a live game.
// Features:
//   - DMControlBar: advance/pause/reset epoch steps
//   - SubmissionQueue: review & approve/reject student answers
//   - SubmissionOverrideModal: override individual submissions
//   - IntelDropForm: send secret intel to specific teams
//   - GlobalEventForm: trigger game-wide events
//   - ConflictFlagBanner: alert on zone conflicts
//   - PushToProjector: push state to the classroom projector
//   - GameMap: view the current map state
// ============================================

"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import DMControlBar from "@/components/dm/DMControlBar";
import SubmissionQueue from "@/components/dm/SubmissionQueue";
import SubmissionOverrideModal from "@/components/dm/SubmissionOverrideModal";
import IntelDropForm from "@/components/dm/IntelDropForm";
import GlobalEventForm from "@/components/dm/GlobalEventForm";
import ConflictFlagBanner from "@/components/dm/ConflictFlagBanner";
import PushToProjector from "@/components/dm/PushToProjector";
import AutoplayPanel from "./AutoplayPanel";
import DMRosterPanel from "@/components/dm/DMRosterPanel";
import { STEP_LABELS, STEP_TO_ROUND, type EpochStep } from "@/lib/game/epoch-machine";
import type { RoleName } from "@/types/database";
import { debug } from "@/lib/debug";
import type { SubZoneData, TeamColor } from "@/components/map/GameMap";

const GameMap = dynamic(() => import("@/components/map/GameMap"), { ssr: false });

interface Team {
  id: string;
  name: string;
  civilization_name: string | null;
  region_id: number;
}

interface GameState {
  current_epoch: number;
  epoch_phase: string;
  current_round: string;
  current_step: EpochStep;
  is_paused: boolean;
}

export default function DMGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [gameId, setGameId] = useState<string>("");
  const [game, setGame] = useState<GameState | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [subZones, setSubZones] = useState<SubZoneData[]>([]);
  const [teamColors, setTeamColors] = useState<TeamColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideTarget, setOverrideTarget] = useState<{
    teamId: string;
    teamName: string;
    role: RoleName;
  } | null>(null);
  const [sidePanel, setSidePanel] = useState<"submissions" | "tools" | "autoplay" | "roster">("submissions");

  // Resolve params
  useEffect(() => {
    params.then((p) => {
      debug.nav("DM Game page params resolved", { id: p.id });
      setGameId(p.id);
    });
  }, [params]);

  const fetchState = useCallback(async () => {
    if (!gameId) return;
    debug.render("DM fetchState called", { gameId });
    try {
      const [gameRes, teamsRes, epochRes, szRes] = await Promise.all([
        fetch(`/api/games/${gameId}`),
        fetch(`/api/games/${gameId}/teams`),
        fetch(`/api/games/${gameId}/epoch/state`),
        fetch(`/api/games/${gameId}/sub-zones`),
      ]);
      if (gameRes.ok) {
        const gd = await gameRes.json();
        const epochData = epochRes.ok ? await epochRes.json() : {};
        setGame({
          current_epoch: gd.game?.current_epoch ?? epochData.current_epoch ?? 1,
          epoch_phase: gd.game?.epoch_phase ?? epochData.epoch_phase ?? "active",
          current_round: gd.game?.current_round ?? epochData.current_round ?? "BUILD",
          current_step: (epochData.current_step ?? epochData.current_round ?? "login") as EpochStep,
          is_paused: epochData.is_paused ?? (epochData.epoch_phase === "resolving"),
        });
      }
      if (teamsRes.ok) {
        const td = await teamsRes.json();
        const loadedTeams: Team[] = td.teams ?? [];
        setTeams(loadedTeams);
        // Build teamColors from team list
        const PALETTE = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#8b5cf6","#06b6d4","#f97316","#ec4899"];
        setTeamColors(loadedTeams.map((t, i) => ({ teamId: t.id, color: PALETTE[i % PALETTE.length], name: t.civilization_name ?? t.name })));
      }
      if (szRes.ok) {
        const szd = await szRes.json();
        setSubZones(szd.subZones ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [fetchState]);

  if (!gameId || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-stone-500">Loading game…</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-red-400">Game not found</p>
      </div>
    );
  }

  const currentRound = STEP_TO_ROUND[game.current_step] ?? game.current_round;

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <DMControlBar
        gameId={gameId}
        currentStep={game.current_step}
        currentEpoch={game.current_epoch}
        isPaused={game.is_paused}
        onRefresh={fetchState}
      />

      {/* Conflict Flags */}
      <ConflictFlagBanner gameId={gameId} epoch={game.current_epoch} />

      {/* Main layout: Map + Side Panel */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Map area — 60% */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-xl border border-stone-800">
            <div className="h-[500px]">
              <GameMap
                subZones={subZones}
                teamColors={teamColors}
                fogState={[]}
                markers={[]}
                showFog={false}
              />
            </div>
          </div>
        </div>

        {/* Side panel — 40% */}
        <div className="space-y-4 lg:col-span-2">
          {/* Panel tabs */}
          <div className="flex gap-1 rounded-lg bg-stone-900/50 p-1">
            <button
              onClick={() => setSidePanel("submissions")}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs transition ${
                sidePanel === "submissions"
                  ? "bg-stone-700 text-white"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Submissions
            </button>
            <button
              onClick={() => setSidePanel("roster")}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs transition ${
                sidePanel === "roster"
                  ? "bg-green-800 text-white"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              👥 Roster
            </button>
            <button
              onClick={() => setSidePanel("tools")}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs transition ${
                sidePanel === "tools"
                  ? "bg-stone-700 text-white"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              DM Tools
            </button>
            <button
              onClick={() => setSidePanel("autoplay")}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs transition ${
                sidePanel === "autoplay"
                  ? "bg-violet-700 text-white"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              🎭 Sim
            </button>
          </div>

          {sidePanel === "roster" ? (
            <div className="overflow-y-auto max-h-[600px] pr-1">
              <DMRosterPanel gameId={gameId} />
            </div>
          ) : sidePanel === "submissions" ? (
            <SubmissionQueue
              gameId={gameId}
              epoch={game.current_epoch}
              roundType={currentRound}
              onOpenOverride={(teamId, role) => {
                const team = teams.find((t) => t.id === teamId);
                setOverrideTarget({
                  teamId,
                  teamName: team?.civilization_name ?? team?.name ?? "Unknown",
                  role,
                });
              }}
            />
          ) : sidePanel === "autoplay" ? (
            <AutoplayPanel
              gameId={gameId}
              currentStep={game.current_step}
              currentEpoch={game.current_epoch}
              teams={teams}
              onStepComplete={fetchState}
            />
          ) : (
            <div className="space-y-4">
              <IntelDropForm gameId={gameId} teams={teams} />
              <GlobalEventForm
                gameId={gameId}
                epoch={game.current_epoch}
              />
              <PushToProjector gameId={gameId} />
            </div>
          )}
        </div>
      </div>

      {/* Override Modal */}
      {overrideTarget && (
        <SubmissionOverrideModal
          gameId={gameId}
          teamId={overrideTarget.teamId}
          teamName={overrideTarget.teamName}
          role={overrideTarget.role}
          epoch={game.current_epoch}
          onClose={() => setOverrideTarget(null)}
        />
      )}
    </div>
  );
}
