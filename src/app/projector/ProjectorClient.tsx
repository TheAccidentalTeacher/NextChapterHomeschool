// ============================================
// ProjectorClient — Classroom projector display
// Decision 16: Shared projector view, no student login needed
// Decision 79: Epoch state machine sync
//
// Full-screen display for the classroom projector/TV.
// Auto-discovers the active game and polls for state.
// Renders:
//   - GameMap with all team territories
//   - PausedOverlay when DM pauses the game
//   - ResolveSequence during epoch resolution
//   - AnnouncementOverlay for DM announcements
//   - EventCardOverlay for global events
//   - DailyRecapCard at end of class
//   - ExitHookCard with dinner questions
//   - Resource leaderboard per team
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
import { RESOURCES } from "@/lib/constants";
import type { ResourceType } from "@/types/database";
import { debug } from "@/lib/debug";

const GameMap = dynamic(() => import("@/components/map/GameMap"), { ssr: false });

interface Team {
  id: string;
  name: string;
  civilization_name: string | null;
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

export default function ProjectorClient() {
  debug.render("ProjectorClient mounted");
  const [gameId, setGameId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [epoch, setEpoch] = useState(1);
  const [step, setStep] = useState<EpochStep>("login");
  const [isPaused, setIsPaused] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [globalEvent, setGlobalEvent] = useState<GlobalEvent | null>(null);
  const [teamResources, setTeamResources] = useState<Record<string, Record<ResourceType, number>>>({});
  const [dismissedEvents, setDismissedEvents] = useState<Set<string>>(new Set());

  // Find active game
  useEffect(() => {
    async function findGame() {
      try {
        const res = await fetch("/api/games");
        if (res.ok) {
          const data = await res.json();
          const games = data.games ?? [];
          if (games.length > 0) {
            setGameId(games[0].id);
          }
        }
      } catch {
        // ignore
      }
    }
    findGame();
  }, []);

  const fetchState = useCallback(async () => {
    if (!gameId) return;
    try {
      const [epochRes, teamsRes, eventsRes] = await Promise.all([
        fetch(`/api/games/${gameId}/epoch/state`),
        fetch(`/api/games/${gameId}/teams`),
        fetch(`/api/games/${gameId}/events/global?epoch=${epoch}`),
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
    }
  }, [step, isResolving]);

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
    <div className="flex min-h-screen flex-col bg-stone-950 text-white">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-stone-800 px-6 py-3">
        <h1 className="text-xl font-bold text-amber-400">
          🏛️ ClassCiv
        </h1>
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
        </div>
      </header>

      {/* Main area */}
      <main className="relative flex-1">
        {/* Map */}
        <div className="h-full">
          <GameMap
            subZones={[]}
            teamColors={[]}
            fogState={[]}
            markers={[]}
            showFog={false}
          />
        </div>

        {/* Leaderboard overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-stone-800 bg-black/80 backdrop-blur">
          <div className="flex items-center gap-3 overflow-x-auto px-4 py-2">
            <span className="shrink-0 text-xs text-stone-500">
              LEADERBOARD
            </span>
            {teams.map((team) => {
              const tr = teamResources[team.id] ?? {};
              const total = Object.values(tr).reduce((s, v) => s + (v || 0), 0);
              return (
                <div
                  key={team.id}
                  className="flex shrink-0 items-center gap-2 rounded border border-stone-800 bg-stone-900 px-3 py-1.5 text-xs"
                >
                  <span className="font-bold text-amber-400">
                    {team.civilization_name ?? team.name}
                  </span>
                  <span className="text-stone-500">👥 {team.population}</span>
                  <span className="text-stone-500">{total} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Overlays */}
      {isPaused && <PausedOverlay />}

      {isResolving && (
        <ResolveSequence
          gameId={gameId}
          epoch={epoch}
          teams={teams}
          onComplete={() => setIsResolving(false)}
        />
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
