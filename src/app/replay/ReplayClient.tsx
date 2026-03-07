// ============================================
// ReplayClient — Full game replay viewer
// Loads all epoch resolve snapshots and plays
// them back with transport controls. Can scrub
// to any epoch or watch the whole 30-epoch arc.
// ============================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ---- Types ----

interface SnapshotTeam {
  teamId: string;
  teamName: string;
  resources: Record<string, number>;
  resourcesBefore: Record<string, number>;
  population: number;
  populationChange: number;
  isDarkAge: boolean;
  events: string[];
}

interface StudentSubmission {
  studentName: string;
  role: string;
  roundType: string;
  optionSelected: string;
  justification: string;
}

interface TeamSubmissions {
  teamId: string;
  submissions: StudentSubmission[];
}

interface EpochSnapshot {
  epoch: number;
  teams: SnapshotTeam[];
  teamSubmissions?: TeamSubmissions[];
}

interface ReplayData {
  gameId: string;
  gameName: string;
  totalEpochs: number;
  snapshots: EpochSnapshot[];
}

type Phase =
  | "idle"
  | "loading"
  | "ready"
  | "epoch_intro"
  | "resolve_processing"
  | "resolve_results"
  | "epoch_summary"
  | "finished";

// ---- Helpers ----

const SPEED_OPTIONS = [0.5, 1, 2, 5, 10] as const;
type SpeedValue = (typeof SPEED_OPTIONS)[number];

function scaled(ms: number, speed: SpeedValue): number {
  return Math.max(100, ms / speed);
}

// ---- Component ----

interface Props {
  gameId: string;
}

export default function ReplayClient({ gameId }: Props) {
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");

  // Playback state
  const [epochIndex, setEpochIndex] = useState(0); // index into snapshots[]
  const [teamIdx, setTeamIdx] = useState(0); // for processing animation
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<SpeedValue>(1);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const epochIndexRef = useRef(epochIndex);
  epochIndexRef.current = epochIndex;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Load Data ----

  useEffect(() => {
    async function loadReplay() {
      try {
        const res = await fetch(`/api/games/${gameId}/replay`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setLoadError(body.error ?? `HTTP ${res.status}`);
          setPhase("idle");
          return;
        }
        const data: ReplayData = await res.json();
        if (!data.snapshots || data.snapshots.length === 0) {
          setLoadError("No epoch snapshots recorded yet. Run with --cinematic first.");
          setPhase("idle");
          return;
        }
        setReplayData(data);
        setPhase("ready");
      } catch (e) {
        setLoadError(String(e));
        setPhase("idle");
      }
    }
    loadReplay();
  }, [gameId]);

  // ---- Clear all timers ----

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (processingTimerRef.current) { clearInterval(processingTimerRef.current); processingTimerRef.current = null; }
  }, []);

  // ---- Advance phase ----

  const advancePhase = useCallback((snapshots: EpochSnapshot[], idx: number, currentSpeed: SpeedValue) => {
    const snapshot = snapshots[idx];
    const teamCount = snapshot?.teams.length ?? 1;

    // epoch_intro → resolve_processing
    if (phaseRef.current === "epoch_intro") {
      timerRef.current = setTimeout(() => {
        setTeamIdx(0);
        setPhase("resolve_processing");
        // Start cycling through teams
        let tIdx = 0;
        processingTimerRef.current = setInterval(() => {
          tIdx++;
          if (tIdx >= teamCount) {
            clearInterval(processingTimerRef.current!);
            processingTimerRef.current = null;
            setTimeout(() => {
              setPhase("resolve_results");
            }, scaled(800, speedRef.current));
          } else {
            setTeamIdx(tIdx);
          }
        }, scaled(1800, speedRef.current));
      }, scaled(2000, currentSpeed));
      return;
    }

    // resolve_processing advances itself via interval above
    if (phaseRef.current === "resolve_processing") return;

    // resolve_results → epoch_summary
    if (phaseRef.current === "resolve_results") {
      timerRef.current = setTimeout(() => {
        setPhase("epoch_summary");
      }, scaled(10000, speedRef.current));
      return;
    }

    // epoch_summary → next epoch (or finished)
    if (phaseRef.current === "epoch_summary") {
      timerRef.current = setTimeout(() => {
        const nextIdx = epochIndexRef.current + 1;
        if (nextIdx >= snapshots.length) {
          setPhase("finished");
          setPlaying(false);
        } else {
          setEpochIndex(nextIdx);
          setPhase("epoch_intro");
        }
      }, scaled(3500, speedRef.current));
      return;
    }
  }, []);

  // ---- Drive phase transitions ----

  useEffect(() => {
    if (!replayData || !playing) return;
    if (phase === "ready" || phase === "idle" || phase === "loading" || phase === "finished") return;

    clearAllTimers();
    advancePhase(replayData.snapshots, epochIndex, speed);

    return () => clearAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playing, epochIndex, speed, replayData]);

  // ---- Transport controls ----

  const handlePlay = useCallback(() => {
    if (!replayData) return;
    if (phase === "finished") {
      // Restart
      setEpochIndex(0);
      setPhase("epoch_intro");
      setPlaying(true);
      return;
    }
    if (phase === "ready") {
      setPhase("epoch_intro");
      setPlaying(true);
      return;
    }
    setPlaying(true);
  }, [phase, replayData]);

  const handlePause = useCallback(() => {
    clearAllTimers();
    setPlaying(false);
  }, [clearAllTimers]);

  const handleScrub = useCallback((idx: number) => {
    clearAllTimers();
    setEpochIndex(idx);
    if (playingRef.current) {
      // Was playing — keep playing forward from this epoch's intro
      setPhase("epoch_intro");
      // playing stays true — the useEffect will pick up and drive phase transitions
    } else {
      // Paused / manual browse — jump straight to results for that epoch
      setPlaying(false);
      setPhase("resolve_results");
    }
  }, [clearAllTimers]);

  const handleSpeedChange = useCallback((s: SpeedValue) => {
    setSpeed(s);
    // Restart current phase timer with new speed (effect dependency on speed will re-run)
  }, []);

  // ---- Current snapshot ----

  const snapshot = replayData?.snapshots[epochIndex] ?? null;
  const totalSnapshots = replayData?.snapshots.length ?? 0;

  // ---- Render: Loading ----

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <div className="text-center">
          <div className="mb-4 text-4xl animate-pulse">🎬</div>
          <p className="text-xl text-stone-400">Loading replay data…</p>
        </div>
      </div>
    );
  }

  // ---- Render: Error ----

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <div className="max-w-md text-center">
          <p className="mb-2 text-2xl font-bold text-red-400">Unable to load replay</p>
          <p className="text-stone-500">{loadError}</p>
        </div>
      </div>
    );
  }

  // ---- Render: Ready splash ----

  if (phase === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-stone-950">
        <div className="text-center">
          <div className="mb-4 text-5xl">🎬</div>
          <h1 className="text-4xl font-bold text-amber-400">{replayData?.gameName ?? "ClassCiv Replay"}</h1>
          <p className="mt-2 text-stone-500">
            {totalSnapshots} epoch{totalSnapshots !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <button
          onClick={handlePlay}
          className="rounded-xl bg-amber-500 px-10 py-4 text-xl font-bold text-stone-950 transition hover:bg-amber-400 active:scale-95"
        >
          ▶ Play Full Replay
        </button>
        <p className="text-sm text-stone-600">Or scrub to any epoch using the timeline below</p>

        {/* Epoch grid for direct jump */}
        <div className="flex flex-wrap justify-center gap-2 px-8 max-w-2xl">
          {replayData?.snapshots.map((snap, idx) => (
            <button
              key={idx}
              onClick={() => handleScrub(idx)}
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm font-bold text-stone-300 transition hover:border-amber-500 hover:text-amber-400"
            >
              E{snap.epoch}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---- Render: Finished ----

  if (phase === "finished") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-stone-950">
        <div className="text-center">
          <div className="mb-4 text-5xl">🏛️</div>
          <h1 className="text-4xl font-bold text-amber-400">Replay Complete</h1>
          <p className="mt-2 text-stone-500">All {totalSnapshots} epochs played</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handlePlay}
            className="rounded-xl bg-amber-500 px-8 py-3 text-lg font-bold text-stone-950 transition hover:bg-amber-400"
          >
            ↺ Watch Again
          </button>
        </div>
        {/* Final leaderboard */}
        {snapshot && <FinalLeaderboard snapshot={snapshot} />}
      </div>
    );
  }

  // ---- Render: Playback phases ----

  return (
    <div className="relative min-h-screen bg-stone-950">
      {/* ---- EPOCH INTRO ---- */}
      {phase === "epoch_intro" && snapshot && (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-6 text-7xl font-black text-amber-400 animate-pulse">
              EPOCH {snapshot.epoch}
            </div>
            <p className="text-xl text-stone-500">End-of-epoch resolution</p>
          </div>
        </div>
      )}

      {/* ---- RESOLVE PROCESSING ---- */}
      {phase === "resolve_processing" && snapshot && (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-4xl">🎲</div>
            <h2 className="text-3xl font-bold text-stone-200">
              {snapshot.teams[teamIdx]?.teamName ?? "…"}
            </h2>
            <p className="mt-2 text-lg text-stone-500">Calculating yields…</p>
            <div className="mt-6 flex justify-center gap-2">
              {snapshot.teams.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 w-8 rounded-full transition-all ${
                    idx <= teamIdx ? "bg-amber-500" : "bg-stone-800"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- RESOLVE RESULTS ---- */}
      {phase === "resolve_results" && snapshot && (
        <div className="min-h-screen overflow-auto pb-28 pt-8 px-8">
          <h2 className="mb-2 text-center text-3xl font-bold text-amber-400">
            ⚡ Epoch {snapshot.epoch} Results
          </h2>
          <p className="mb-6 text-center text-sm text-stone-600">End-of-epoch resource state</p>
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">
            {snapshot.teams.map((t, idx) => (
              <TeamResultCard key={idx} team={t} />
            ))}
          </div>
          <StudentDecisionsPanel snapshot={snapshot} />
        </div>
      )}

      {/* ---- EPOCH SUMMARY ---- */}
      {phase === "epoch_summary" && snapshot && (
        <div className="flex min-h-screen items-center justify-center pb-28 px-8">
          <div className="w-full max-w-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-amber-400">
              Epoch {snapshot.epoch} — Leaderboard
            </h2>
            <div className="space-y-2">
              {[...snapshot.teams]
                .sort((a, b) => {
                  const scoreA = Object.values(a.resources).reduce((s, v) => s + v, 0);
                  const scoreB = Object.values(b.resources).reduce((s, v) => s + v, 0);
                  return scoreB - scoreA;
                })
                .map((t, rank) => {
                  const score = Object.values(t.resources).reduce((s, v) => s + v, 0);
                  return (
                    <div
                      key={t.teamId}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                        t.isDarkAge
                          ? "border-red-900 bg-red-950/30"
                          : rank === 0
                          ? "border-amber-700 bg-amber-950/40"
                          : "border-stone-800 bg-stone-900/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-stone-500">#{rank + 1}</span>
                        <span className="font-bold text-stone-200">{t.teamName}</span>
                        {t.isDarkAge && (
                          <span className="rounded bg-red-900/50 px-1.5 py-0.5 text-xs text-red-400">
                            DARK AGE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-stone-400">
                          👥 {t.population}
                          {t.populationChange !== 0 && (
                            <span className={t.populationChange > 0 ? " text-green-400" : " text-red-400"}>
                              {t.populationChange > 0 ? " ▲" : " ▼"}
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-amber-400">{score} pts</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ---- TRANSPORT BAR ---- */}
      <TransportBar
        playing={playing}
        phase={phase}
        epochIndex={epochIndex}
        totalSnapshots={totalSnapshots}
        speed={speed}
        snapshots={replayData?.snapshots ?? []}
        onPlay={handlePlay}
        onPause={handlePause}
        onScrub={handleScrub}
        onSpeedChange={handleSpeedChange}
      />
    </div>
  );
}

// ---- Sub-components ----

function TeamResultCard({ team }: { team: SnapshotTeam }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        team.isDarkAge
          ? "border-red-900 bg-red-950/30"
          : "border-stone-800 bg-stone-900/50"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-stone-200">{team.teamName}</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-stone-400">
            👥 {team.population}
          </span>
          {team.populationChange !== 0 && (
            <span className={team.populationChange > 0 ? "text-green-400" : "text-red-400"}>
              {team.populationChange > 0 ? "▲" : "▼"}
            </span>
          )}
          {team.isDarkAge && (
            <span className="rounded bg-red-900/50 px-1.5 py-0.5 text-xs text-red-400">
              DARK AGE
            </span>
          )}
        </div>
      </div>
      <div className="mb-3 grid grid-cols-5 gap-1 text-center text-xs">
        <ResourceCell icon="⚙️" label="Prod" value={team.resources.production ?? 0} color="text-amber-400" />
        <ResourceCell icon="🧭" label="Reach" value={team.resources.reach ?? 0} color="text-blue-400" />
        <ResourceCell icon="📜" label="Legacy" value={team.resources.legacy ?? 0} color="text-purple-400" />
        <ResourceCell icon="🛡️" label="Resil" value={team.resources.resilience ?? 0} color="text-green-400" />
        <ResourceCell icon="🌾" label="Food" value={team.resources.food ?? 0} color="text-lime-400" />
      </div>
      {team.events.length > 0 && (
        <ul className="space-y-0.5">
          {team.events.slice(0, 3).map((e, i) => (
            <li key={i} className="truncate text-xs text-stone-500">{e}</li>
          ))}
          {team.events.length > 3 && (
            <li className="text-xs text-stone-600">+{team.events.length - 3} more…</li>
          )}
        </ul>
      )}
    </div>
  );
}

function ResourceCell({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-stone-500">{icon}</p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
      <p className="text-xs text-stone-600">{label}</p>
    </div>
  );
}

// ---- Student Decisions Panel ----

const ROUND_LEAD: Record<string, string> = { build: "architect", expand: "merchant", define: "diplomat" };
const ROUND_LABEL: Record<string, string> = { build: "🏗️ Build", expand: "🧭 Expand", define: "📜 Define" };
const OPTION_LABEL: Record<string, string> = { a: "Option A", b: "Option B", c: "Option C" };

function StudentDecisionsPanel({ snapshot }: { snapshot: EpochSnapshot }) {
  const [activeRound, setActiveRound] = useState<"build" | "expand" | "define">("build");
  const [collapsed, setCollapsed] = useState(false);

  const subs = snapshot.teamSubmissions;
  if (!subs || subs.length === 0) return null;

  const leadRole = ROUND_LEAD[activeRound];

  return (
    <div className="mx-auto mt-8 max-w-6xl border-t border-stone-800 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-stone-300">📋 Student Decisions</h3>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-sm text-stone-500 hover:text-stone-300 transition"
        >
          {collapsed ? "▼ Show" : "▲ Hide"}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Round Tabs */}
          <div className="mb-5 flex gap-2">
            {(["build", "expand", "define"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setActiveRound(r)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  activeRound === r
                    ? "bg-amber-500 text-stone-950"
                    : "border border-stone-700 bg-stone-900 text-stone-400 hover:text-stone-200"
                }`}
              >
                {ROUND_LABEL[r]}
              </button>
            ))}
          </div>

          {/* Team Decision Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {snapshot.teams.map((team) => {
              const teamSubs = subs.find((ts) => ts.teamId === team.teamId);
              const allForRound = teamSubs?.submissions.filter((s) => s.roundType === activeRound) ?? [];
              const leadSub = allForRound.find((s) => s.role === leadRole);
              const otherSubs = allForRound.filter((s) => s.role !== leadRole);
              // Tally other students' choices
              const tally: Record<string, number> = {};
              otherSubs.forEach((s) => { tally[s.optionSelected] = (tally[s.optionSelected] ?? 0) + 1; });

              return (
                <div
                  key={team.teamId}
                  className="rounded-xl border border-stone-800 bg-stone-900/60 p-4"
                >
                  <div className="mb-3 font-bold text-stone-200">{team.teamName}</div>

                  {leadSub ? (
                    <>
                      {/* Lead decision */}
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400">
                          {OPTION_LABEL[leadSub.optionSelected] ?? leadSub.optionSelected.toUpperCase()}
                        </span>
                        <span className="text-sm text-stone-300">{leadSub.studentName}</span>
                        <span className="text-xs text-stone-600">({leadSub.role})</span>
                      </div>
                      <p className="mb-3 line-clamp-3 text-xs italic text-stone-500">
                        &ldquo;{leadSub.justification}&rdquo;
                      </p>
                      {/* Other students' votes */}
                      {Object.keys(tally).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-stone-600">Class votes:</span>
                          {Object.entries(tally).map(([opt, count]) => (
                            <span key={opt} className="rounded bg-stone-800 px-1.5 py-0.5 text-xs text-stone-400">
                              {OPTION_LABEL[opt] ?? opt.toUpperCase()} ×{count}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-stone-600">No submission recorded</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FinalLeaderboard({ snapshot }: { snapshot: EpochSnapshot }) {
  const sorted = [...snapshot.teams].sort((a, b) => {
    const sA = Object.values(a.resources).reduce((s, v) => s + v, 0);
    const sB = Object.values(b.resources).reduce((s, v) => s + v, 0);
    return sB - sA;
  });
  return (
    <div className="w-full max-w-md space-y-2">
      {sorted.map((t, rank) => {
        const score = Object.values(t.resources).reduce((s, v) => s + v, 0);
        return (
          <div key={t.teamId} className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="font-black text-stone-500">#{rank + 1}</span>
              <span className="font-bold text-stone-200">{t.teamName}</span>
            </div>
            <span className="font-bold text-amber-400">{score}</span>
          </div>
        );
      })}
    </div>
  );
}

interface TransportBarProps {
  playing: boolean;
  phase: Phase;
  epochIndex: number;
  totalSnapshots: number;
  speed: SpeedValue;
  snapshots: EpochSnapshot[];
  onPlay: () => void;
  onPause: () => void;
  onScrub: (idx: number) => void;
  onSpeedChange: (s: SpeedValue) => void;
}

function TransportBar({
  playing,
  phase,
  epochIndex,
  totalSnapshots,
  speed,
  snapshots,
  onPlay,
  onPause,
  onScrub,
  onSpeedChange,
}: TransportBarProps) {
  const currentEpoch = snapshots[epochIndex]?.epoch ?? epochIndex + 1;
  const lastEpoch = snapshots[snapshots.length - 1]?.epoch ?? totalSnapshots;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-800 bg-stone-950/95 px-6 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center gap-4">
        {/* Play / Pause */}
        <button
          onClick={playing ? onPause : onPlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-lg font-bold text-stone-950 transition hover:bg-amber-400 active:scale-95"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? "⏸" : "▶"}
        </button>

        {/* Epoch counter */}
        <div className="shrink-0 text-center text-sm">
          <span className="font-bold text-amber-400">
            {phase === "ready" ? "—" : currentEpoch}
          </span>
          <span className="text-stone-600"> / {lastEpoch}</span>
        </div>

        {/* Epoch scrubber */}
        <div className="relative flex flex-1 items-center gap-1">
          {snapshots.map((snap, idx) => (
            <button
              key={idx}
              onClick={() => onScrub(idx)}
              title={`Epoch ${snap.epoch}`}
              className={`h-2 flex-1 rounded-full transition-all ${
                idx < epochIndex
                  ? "bg-amber-700"
                  : idx === epochIndex && phase !== "ready"
                  ? "bg-amber-400"
                  : "bg-stone-800 hover:bg-stone-600"
              }`}
            />
          ))}
        </div>

        {/* Speed selector */}
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-800 bg-stone-900 p-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`rounded px-2 py-1 text-xs font-bold transition ${
                speed === s
                  ? "bg-amber-500 text-stone-950"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
