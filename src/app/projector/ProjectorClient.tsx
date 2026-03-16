// ============================================
// ProjectorClient — Classroom projector display
// Decision 16: Shared projector view, no student login needed
// Decision 79: Epoch state machine sync
// Decision 102: Defaults to civilization standings board; DM can toggle to map
//
// Full-screen display for the classroom projector/TV.
// Auto-discovers the active game and polls for state.
// Renders:
//   - Leaderboard (default) — civilization standings with resource breakdown
//   - GameMap with all team territories (toggled by keyboard / button)
//   - PausedOverlay when DM pauses the game
//   - ResolveSequence during epoch resolution
//   - AnnouncementOverlay for DM announcements
//   - EventCardOverlay for global events
//   - DailyRecapCard at end of class
//   - ExitHookCard with dinner questions
// ============================================

"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import PausedOverlay from "@/components/projector/PausedOverlay";
import ResolveSequence from "@/components/projector/ResolveSequence";
import AnnouncementOverlay from "@/components/projector/AnnouncementOverlay";
import EventCardOverlay from "@/components/projector/EventCardOverlay";
import DailyRecapCard from "@/components/projector/DailyRecapCard";
import ExitHookCard, { getExitPrompt } from "@/components/projector/ExitHookCard";
import { STEP_LABELS, type EpochStep } from "@/lib/game/epoch-machine";

import { debug } from "@/lib/debug";
import type { TeamRegion } from "@/components/map/GameMap";
import type { LeaderboardEntry } from "@/app/api/games/[id]/leaderboard/route";

const TEAM_COLOR_PALETTE = [
  "#e63946", "#2a9d8f", "#e9c46a", "#f4a261",
  "#457b9d", "#a8dadc", "#6a4c93", "#06d6a0",
  "#118ab2", "#ffd166", "#ef476f", "#a7c957",
];

const GameMap = dynamic(() => import("@/components/map/GameMap"), { ssr: false });

interface Team {
  id: string;
  name: string;
  civilization_name: string | null;
  region_id: number;
  population: number;
}

interface Announcement {
  type: string;
  text: string;
  ts: number;
}

interface GlobalEvent {
  id: string;
  description: string;
  event_type: string;
}

export default function ProjectorClient({ initialGameId }: { initialGameId?: string | null }) {
  debug.render("ProjectorClient mounted");
  const [gameId, setGameId] = useState<string | null>(initialGameId ?? null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [epoch, setEpoch] = useState(1);
  const [step, setStep] = useState<EpochStep>("login");
  const [isPaused, setIsPaused] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [globalEvent, setGlobalEvent] = useState<GlobalEvent | null>(null);
  const [dismissedEvents, setDismissedEvents] = useState<Set<string>>(new Set());
  // Decision 102: default to standings board; DM can press M or click to toggle map
  const [view, setView] = useState<"leaderboard" | "map">("leaderboard");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  // DailyRecapCard: shown after resolve completes
  const [showRecap, setShowRecap] = useState(false);
  const [recapText, setRecapText] = useState("");

  // Find active game (only if no gameId passed via URL)
  useEffect(() => {
    if (initialGameId) return; // already have it from URL param
    async function findGame() {
      try {
        const res = await fetch("/api/projector/active-game");
        if (res.ok) {
          const data = await res.json();
          if (data.gameId) setGameId(data.gameId);
        }
      } catch {
        // ignore
      }
    }
    findGame();
  }, [initialGameId]);

  const fetchState = useCallback(async () => {
    if (!gameId) return;
    try {
      const [epochRes, teamsRes, eventsRes, lbRes] = await Promise.all([
        fetch(`/api/games/${gameId}/epoch/state`),
        fetch(`/api/games/${gameId}/map-data`),
        fetch(`/api/games/${gameId}/events/global?epoch=${epoch}`),
        fetch(`/api/games/${gameId}/leaderboard`),
      ]);

      if (epochRes.ok) {
        const ed = await epochRes.json();
        setEpoch(ed.current_epoch ?? 1);
        setStep(ed.current_step ?? "login");
        setIsPaused(ed.is_paused ?? false);

        // Check for projector announcements
        if (ed.animation_queue?.length > 0) {
          const latest = ed.animation_queue[ed.animation_queue.length - 1];
          if (latest.type === "announcement" && latest.text) {
            setAnnouncement(latest);
          }
        }
      }

      if (teamsRes.ok) {
        const td = await teamsRes.json();
        setTeams(td.teams ?? []);
      }

      if (eventsRes.ok) {
        const evd = await eventsRes.json();
        const events: GlobalEvent[] = evd.events ?? [];
        const newEvt = events.find((e) => !dismissedEvents.has(e.id));
        if (newEvt) setGlobalEvent(newEvt);
      }

      if (lbRes.ok) {
        const lbd = await lbRes.json();
        setLeaderboard(lbd.leaderboard ?? []);
      }
    } catch {
      // ignore
    }
  }, [gameId, epoch, dismissedEvents]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 4000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Auto-trigger resolve sequence when step is "resolve"
  useEffect(() => {
    if (step === "resolve" && !isResolving) {
      setIsResolving(true);
      setShowRecap(false); // clear any prior recap when a new resolve starts
    }
  }, [step, isResolving]);

  // Called when ResolveSequence finishes — fetch recap then display it for 12 seconds
  const handleResolveComplete = useCallback(async () => {
    setIsResolving(false);
    if (!gameId || teams.length === 0) return;
    try {
      const res = await fetch(`/api/games/${gameId}/recap/${teams[0].id}`);
      if (res.ok) {
        const data = await res.json();
        const text: string =
          data.recap_text ??
          "The epoch is complete. Civilizations grow, adapt, and endure.";
        setRecapText(text);
        setShowRecap(true);
        // Auto-dismiss after 12 seconds
        setTimeout(() => setShowRecap(false), 12000);
      }
    } catch {
      // non-critical — skip recap display if fetch fails
    }
  }, [gameId, teams]);

  // Keyboard shortcut: M = toggle map/leaderboard (for teacher/DM control)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "m" || e.key === "M") {
        setView((v) => (v === "leaderboard" ? "map" : "leaderboard"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!gameId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <div className="text-center">
          <p className="text-4xl">🗺️</p>
          <p className="mt-4 text-xl text-stone-400">Waiting for game…</p>
          <p className="mt-1 text-sm text-stone-600">
            No active game found. The teacher needs to create one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-stone-950 text-white">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-stone-800 px-6 py-3">
        <h1 className="text-xl font-bold text-amber-400">🏛️ ClassCiv</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-stone-400">Epoch {epoch}</span>
          <span className="rounded bg-stone-800 px-2 py-0.5 text-xs text-stone-300">
            {STEP_LABELS[step] ?? step}
          </span>
          {isPaused && (
            <span className="animate-pulse rounded bg-yellow-800/40 px-2 py-0.5 text-xs text-yellow-400">
              PAUSED
            </span>
          )}
          {/* View toggle — Decision 102: DM can switch between standings and map */}
          <button
            onClick={() => setView((v) => (v === "leaderboard" ? "map" : "leaderboard"))}
            className="rounded border border-stone-700 bg-stone-800 px-3 py-0.5 text-xs text-stone-300 hover:bg-stone-700"
            title="Toggle view (M)"
          >
            {view === "leaderboard" ? "🗺️ Map" : "🏆 Standings"}
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main className="relative flex-1 overflow-hidden" style={{ height: "calc(100vh - 49px)" }}>

        {/* ——— LEADERBOARD VIEW (default) ——— */}
        {view === "leaderboard" && (
          <div className="flex h-full flex-col overflow-y-auto px-8 py-6">
            <h2 className="mb-6 text-center text-3xl font-bold tracking-wide text-amber-400">
              Civilization Standings
            </h2>

            {/* Resource column headers */}
            <div className="mb-2 grid grid-cols-[2.5rem_1fr_6rem_6rem_6rem_6rem_6rem_6rem] items-center gap-3 px-4 text-xs font-semibold uppercase tracking-widest text-stone-500">
              <span>#</span>
              <span>Civilization</span>
              <span className="text-center">👥 Pop</span>
              <span className="text-center">⚙️ Prod</span>
              <span className="text-center">🧭 Reach</span>
              <span className="text-center">📜 Legacy</span>
              <span className="text-center">🛡️ Resil</span>
              <span className="text-center">Total</span>
            </div>

            <div className="flex flex-col gap-2">
              {leaderboard.map((entry, i) => {
                const color = TEAM_COLOR_PALETTE[i % TEAM_COLOR_PALETTE.length];
                const isTop = entry.rank === 1;
                return (
                  <div
                    key={entry.teamId}
                    className={`grid grid-cols-[2.5rem_1fr_6rem_6rem_6rem_6rem_6rem_6rem] items-center gap-3 rounded-lg border px-4 py-3 ${
                      isTop
                        ? "border-amber-500/50 bg-amber-900/20"
                        : "border-stone-800 bg-stone-900/60"
                    }`}
                  >
                    {/* Rank */}
                    <span className={`text-lg font-bold ${isTop ? "text-amber-400" : "text-stone-500"}`}>
                      {isTop ? "👑" : `#${entry.rank}`}
                    </span>

                    {/* Civ name + team name */}
                    <div>
                      <div className="text-base font-bold" style={{ color }}>
                        {entry.civName}
                      </div>
                      <div className="text-xs text-stone-500">{entry.teamName}</div>
                    </div>

                    {/* Population */}
                    <span className="text-center text-sm font-semibold text-stone-300">
                      {entry.population.toLocaleString()}
                    </span>

                    {/* Resources */}
                    <span className="text-center text-sm font-semibold text-amber-400/90">
                      {entry.resources.production}
                    </span>
                    <span className="text-center text-sm font-semibold text-blue-400/90">
                      {entry.resources.reach}
                    </span>
                    <span className="text-center text-sm font-semibold text-purple-400/90">
                      {entry.resources.legacy}
                    </span>
                    <span className="text-center text-sm font-semibold text-green-400/90">
                      {entry.resources.resilience}
                    </span>

                    {/* Total */}
                    <span className={`text-center text-base font-bold ${isTop ? "text-amber-300" : "text-stone-200"}`}>
                      {entry.total}
                    </span>
                  </div>
                );
              })}

              {leaderboard.length === 0 && (
                <p className="py-16 text-center text-stone-600">No standings yet — waiting for game data…</p>
              )}
            </div>
          </div>
        )}

        {/* ——— MAP VIEW ——— */}
        {view === "map" && (
          <div className="h-full">
            <GameMap
              subZones={[]}
              teamColors={leaderboard.map((e, i) => ({
                teamId: e.teamId,
                color: TEAM_COLOR_PALETTE[i % TEAM_COLOR_PALETTE.length],
                name: e.civName,
              }))}
              teamRegions={teams.map((t, i) => ({
                teamId: t.id,
                regionId: t.region_id,
                color: TEAM_COLOR_PALETTE[i % TEAM_COLOR_PALETTE.length],
                name: t.civilization_name ?? t.name,
              }))}
              fogState={[]}
              markers={[]}
              showFog={false}
            />
          </div>
        )}
      </main>

      {/* Overlays */}
      {isPaused && <PausedOverlay />}

      {isResolving && (
        <ResolveSequence
          gameId={gameId}
          epoch={epoch}
          teams={teams}
          onComplete={handleResolveComplete}
        />
      )}

      {showRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-8">
          <div className="w-full max-w-2xl">
            <DailyRecapCard
              recapText={recapText}
              epoch={epoch}
            />
            <p className="mt-4 text-center text-xs text-stone-600">
              Dismisses automatically in 12 seconds…
            </p>
          </div>
        </div>
      )}

      {announcement && (
        <AnnouncementOverlay
          text={announcement.text}
          onDismiss={() => setAnnouncement(null)}
        />
      )}

      {globalEvent && (
        <EventCardOverlay
          event={globalEvent}
          onDismiss={() => {
            setDismissedEvents((prev) => new Set(prev).add(globalEvent.id));
            setGlobalEvent(null);
          }}
        />
      )}

      {step === "exit" && (
        <ExitHookCard prompt={getExitPrompt(epoch)} epoch={epoch} />
      )}
    </div>
  );
}
