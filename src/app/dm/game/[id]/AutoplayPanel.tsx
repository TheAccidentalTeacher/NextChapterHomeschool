"use client";

// ================================================================
// AutoplayPanel — DM control to run a full "simulation" of the game
// advancing automaticaly while the teacher watches.
//
// Each call to /api/dm/[id]/simulate/step:
//   1. Submits 7th-grader-quality answers for all teams
//   2. Auto-scores them + applies resource bonuses
//   3. Advances the epoch step
//
// The student windows (opened in Chrome profiles) poll for state
// changes and show the real game UI updating in real time.
// ================================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { STEP_LABELS } from "@/lib/game/epoch-machine";
import type { EpochStep } from "@/lib/game/epoch-machine";

// Delay between steps at each speed  (ms)
const SPEED_DELAYS: Record<string, number> = {
  "1×":  8000,
  "2×":  4000,
  "5×":  1600,
  "10×":  800,
  "Max": 200,
};

// Sentinel value meaning "run forever until STOP pressed"
const EPOCH_INFINITE = 9999;

interface LogEntry {
  step: string;
  epoch: number;
  items: Array<{ team: string; action: string; score?: number; earned?: number }>;
  ts: number;
}

interface AutoplayPanelProps {
  gameId: string;
  currentStep: EpochStep;
  currentEpoch: number;
  teams: Array<{ id: string; name: string; civilization_name: string | null }>;
  onStepComplete: () => void;
}

export default function AutoplayPanel({
  gameId,
  currentStep,
  currentEpoch,
  teams,
  onStepComplete,
}: AutoplayPanelProps) {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<string>("5×");
  const [epochTarget, setEpochTarget] = useState<number>(EPOCH_INFINITE);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<string>("Ready");
  const stopRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  // Keep a mutable ref so the loop always reads the latest stopRef
  const epochTargetRef = useRef(epochTarget);
  useEffect(() => { epochTargetRef.current = epochTarget; }, [epochTarget]);

  async function runStep(): Promise<{ done: boolean; nextEpoch: number; nextStep: string }> {
    const res = await fetch(`/api/dm/${gameId}/simulate/step`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Simulate step failed");
    }
    const data = await res.json();

    setLog((prev) => [
      ...prev,
      {
        step: data.prevStep,
        epoch: data.epoch,
        items: data.log,
        ts: Date.now(),
      },
    ]);
    // Keep only last 100 entries to avoid memory growth during long runs
    setLog((prev) => prev.length > 100 ? prev.slice(-100) : prev);
    onStepComplete();

    const target = epochTargetRef.current;
    const done = target !== EPOCH_INFINITE && data.newEpoch > currentEpoch + target - 1;
    return { done, nextEpoch: data.newEpoch, nextStep: data.nextStep };
  }

  const handleStart = useCallback(async () => {
    setRunning(true);
    stopRef.current = false;
    setLog([]);
    setStatus("Running\u2026");

    const delay = SPEED_DELAYS[speed] ?? 1600;
    const targetEpoch = epochTarget === EPOCH_INFINITE
      ? Number.MAX_SAFE_INTEGER
      : currentEpoch + epochTarget;

    try {
      let currentE = currentEpoch;
      while (!stopRef.current) {
        const { done, nextEpoch, nextStep } = await runStep();
        currentE = nextEpoch;

        setStatus(`Epoch ${currentE} → ${STEP_LABELS[nextStep as EpochStep] ?? nextStep}`);

        if (done || currentE >= targetEpoch) break;

        await new Promise((r) => setTimeout(r, delay));
        if (stopRef.current) break;
      }
    } catch (e: unknown) {
      setStatus("Error: " + (e instanceof Error ? e.message : String(e)));
    }

    setRunning(false);
    setStatus(stopRef.current ? "Stopped" : "Complete ✓");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, epochTarget, currentEpoch, gameId]);

  function handleStop() {
    stopRef.current = true;
    setStatus("Stopping…");
  }

  const scoreColor = (s?: number) => {
    if (!s) return "text-stone-500";
    if (s >= 4) return "text-green-400";
    if (s === 3) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <div className="space-y-4 rounded-xl border border-violet-900/50 bg-violet-950/20 p-4">
      <div className="flex items-center gap-3">
        <span className="text-lg">🎭</span>
        <div>
          <h3 className="text-sm font-bold text-violet-300">Simulation Autoplay</h3>
          <p className="text-xs text-stone-500">
            Simulates 7th-grader decisions so you can watch the full game flow
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        {/* Speed */}
        <div>
          <label className="mb-1 block text-xs text-stone-400">Speed</label>
          <div className="flex gap-1">
            {Object.keys(SPEED_DELAYS).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                disabled={running}
                className={`flex-1 rounded px-1 py-1 text-xs font-medium transition ${
                  speed === s
                    ? "bg-violet-700 text-white"
                    : "bg-stone-800 text-stone-400 hover:bg-stone-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Epochs */}
        <div>
          <label className="mb-1 block text-xs text-stone-400">Run epochs</label>
          <div className="flex gap-1">
            {([1, 2, 3, 5, EPOCH_INFINITE] as const).map((n) => (
              <button
                key={n}
                onClick={() => setEpochTarget(n)}
                disabled={running}
                className={`flex-1 rounded px-1 py-1 text-xs font-medium transition ${
                  epochTarget === n
                    ? "bg-violet-700 text-white"
                    : "bg-stone-800 text-stone-400 hover:bg-stone-700"
                }`}
              >
                {n === EPOCH_INFINITE ? "∞" : n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status + GO/STOP */}
      <div className="flex items-center gap-3">
        {!running ? (
          <button
            onClick={handleStart}
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-violet-500"
          >
            ▶ GO
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="rounded-lg bg-red-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-600"
          >
            ⏹ STOP
          </button>
        )}
        <div className="flex items-center gap-2">
          {running && (
            <div className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
          )}
          <span className="text-xs text-stone-400">{status}</span>
        </div>
      </div>

      {/* Team quick-links */}
      {teams.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-stone-500">
            Open each team in a separate Chrome profile window:
          </p>
          <div className="flex flex-wrap gap-1.5">
            <a
              href={`/projector?game=${gameId}`}
              target="_blank"
              rel="noopener"
              className="rounded bg-blue-900/50 px-2 py-1 text-xs text-blue-400 hover:bg-blue-900"
            >
              📺 Projector
            </a>
            <a
              href="/dashboard"
              target="_blank"
              rel="noopener"
              className="rounded bg-stone-800 px-2 py-1 text-xs text-stone-300 hover:bg-stone-700"
            >
              👤 Student View
            </a>
          </div>
        </div>
      )}

      {/* Live log */}
      {log.length > 0 && (
        <div className="max-h-64 overflow-y-auto rounded-lg bg-stone-950 p-3">
          {log.map((entry, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-stone-800 px-1.5 py-0.5 text-xs font-mono text-stone-400">
                  Ep {entry.epoch} · {STEP_LABELS[entry.step as EpochStep] ?? entry.step}
                </span>
              </div>
              {entry.items.map((item, j) => (
                <div key={j} className="flex items-baseline gap-2 py-0.5 pl-2 text-xs">
                  <span className="w-32 shrink-0 truncate text-stone-300">{item.team}</span>
                  <span className="text-stone-500">{item.action}</span>
                  {item.score !== undefined && (
                    <span className={`ml-auto shrink-0 font-mono ${scoreColor(item.score)}`}>
                      {item.score}/5 → +{item.earned}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}
