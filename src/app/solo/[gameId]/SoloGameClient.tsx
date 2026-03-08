"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────
type ActionStep = "build" | "expand" | "define" | "defend";
type UIStep =
  | "loading"
  | "error"
  | "epoch_start"
  | "question"
  | "question_scored"
  | "routing"
  | "resolving"
  | "epoch_summary";

interface QuestionOption {
  id: string;
  label: string;
  description?: string;
}

interface Question {
  id: string;
  promptText: string;
  options: QuestionOption[];
  allowFreeText: boolean;
  historicalContext: string;
  scaffolding6th: string;
}

interface GameData {
  playerTeamId: string;
  playerCivName: string;
  currentEpoch: number;
  questions: Record<string, Question>;
  teams: Array<{
    id: string;
    name: string;
    civName: string;
    resources: Record<string, number>;
    population: number;
    totalResources: number;
  }>;
}

interface RoundResult {
  step: ActionStep;
  score: number;
  multiplier: number;
  feedback: string;
  earned: number;
  routing: { store: number; food: number; defense: number };
}

interface Routing {
  store: number;   // % to primary resource
  food: number;    // % to food
  defense: number; // % to resilience
}

interface EpochSummary {
  newEpoch: number;
  completedEpoch: number;
  standings: Array<{
    rank: number;
    teamId: string;
    civName: string;
    name: string;
    total: number;
    resources: Record<string, number>;
    population: number;
    isPlayer: boolean;
  }>;
}

// ── Constants ─────────────────────────────────────────────────
const ACTION_STEPS: ActionStep[] = ["build", "expand", "define", "defend"];

const STEP_META: Record<ActionStep, { label: string; round: string; role: string; emoji: string; resource: string; color: string }> = {
  build:   { label: "Build",   round: "BUILD",  role: "Architect", emoji: "⚙️", resource: "production", color: "amber" },
  expand:  { label: "Expand",  round: "EXPAND", role: "Merchant",  emoji: "🧭", resource: "reach",      color: "blue"  },
  define:  { label: "Define",  round: "DEFINE", role: "Diplomat",  emoji: "📜", resource: "legacy",     color: "purple"},
  defend:  { label: "Defend",  round: "DEFEND", role: "Warlord",   emoji: "🛡️", resource: "resilience", color: "red"   },
};

const RESOURCE_META: Record<string, { emoji: string; label: string }> = {
  production: { emoji: "⚙️", label: "Production" },
  reach:      { emoji: "🧭", label: "Reach"       },
  legacy:     { emoji: "📜", label: "Legacy"      },
  resilience: { emoji: "🛡️", label: "Resilience"  },
  food:       { emoji: "🌾", label: "Food"        },
};

const SCORE_META: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: "Needs Work",   color: "text-red-400",    emoji: "📌" },
  2: { label: "Acceptable",   color: "text-orange-400", emoji: "📋" },
  3: { label: "Solid",        color: "text-yellow-400", emoji: "📗" },
  4: { label: "Strong",       color: "text-green-400",  emoji: "⭐" },
  5: { label: "Exceptional",  color: "text-emerald-400",emoji: "🏆" },
};

// ── Adjust routing helper (keeps total = 100) ─────────────────
function adjustRouting(current: Routing, field: keyof Routing, delta: number): Routing {
  const next = { ...current, [field]: Math.max(0, Math.min(100, current[field] + delta)) };
  const otherFields = (Object.keys(next) as (keyof Routing)[]).filter((k) => k !== field);
  const remaining = 100 - next[field];
  const otherSum = otherFields.reduce((s, k) => s + next[k], 0);
  if (otherSum === 0) {
    // distribute evenly
    const split = Math.floor(remaining / 2);
    next[otherFields[0]] = split;
    next[otherFields[1]] = remaining - split;
  } else {
    // scale others proportionally
    for (const k of otherFields) {
      next[k] = Math.round((next[k] / otherSum) * remaining);
    }
    // fix rounding error
    const total = next.store + next.food + next.defense;
    if (total !== 100) next[otherFields[0]] += 100 - total;
  }
  return next;
}

// ── Sub-views ─────────────────────────────────────────────────
function ResourceSidebar({ resources, population }: { resources: Record<string, number>; population: number }) {
  return (
    <aside className="w-56 shrink-0 space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Your Resources</h3>
      {Object.entries(RESOURCE_META).map(([key, meta]) => (
        <div key={key} className="flex justify-between items-center bg-gray-900 rounded px-3 py-2">
          <span className="text-sm">{meta.emoji} {meta.label}</span>
          <span className="font-mono font-bold text-white">{resources[key] ?? 0}</span>
        </div>
      ))}
      <div className="flex justify-between items-center bg-gray-900 rounded px-3 py-2">
        <span className="text-sm">👥 Population</span>
        <span className="font-mono font-bold text-white">{population}</span>
      </div>
    </aside>
  );
}

function PhaseBar({ roundIndex }: { roundIndex: number }) {
  return (
    <div className="flex gap-2 mb-6">
      {ACTION_STEPS.map((s, i) => {
        const meta = STEP_META[s];
        const done = i < roundIndex;
        const active = i === roundIndex;
        return (
          <div
            key={s}
            className={`flex-1 rounded py-1 px-2 text-center text-xs font-bold transition-all ${
              active
                ? "bg-amber-500 text-black"
                : done
                ? "bg-gray-700 text-gray-400"
                : "bg-gray-900 text-gray-600"
            }`}
          >
            {done ? "✓ " : ""}{meta.emoji} {meta.label}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function SoloGameClient({ gameId }: { gameId: string }) {
  const router = useRouter();

  const [uiStep, setUiStep] = useState<UIStep>("loading");
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [playerResources, setPlayerResources] = useState<Record<string, number>>({});
  const [playerPopulation, setPlayerPopulation] = useState(10);
  const [errorMsg, setErrorMsg] = useState("");

  // Round state
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // After submission
  const [pendingResult, setPendingResult] = useState<RoundResult | null>(null);
  const [routing, setRouting] = useState<Routing>({ store: 60, food: 25, defense: 15 });

  // All round results this epoch (for summary)
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [epochSummary, setEpochSummary] = useState<EpochSummary | null>(null);

  // ── Load game state ──────────────────────────────────────────
  const loadState = useCallback(async () => {
    try {
      const res = await fetch(`/api/solo/${gameId}/state`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load game");

      const player = data.teams[0]; // player is always first team
      setGameData({
        playerTeamId: player.id,
        playerCivName: player.civName,
        currentEpoch: data.currentEpoch,
        questions: data.questions,
        teams: data.teams,
      });
      setPlayerResources(player.resources ?? {});
      setPlayerPopulation(player.population ?? 10);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
      setUiStep("error");
    }
  }, [gameId]);

  useEffect(() => {
    loadState().then(() => setUiStep("epoch_start"));
  }, [loadState]);

  // ── Helpers ─────────────────────────────────────────────────
  const currentActionStep = ACTION_STEPS[roundIndex];
  const currentMeta = STEP_META[currentActionStep];
  const currentQuestion = gameData?.questions?.[currentMeta.round] ?? null;

  // ── Handle question submit ───────────────────────────────────
  async function handleSubmit() {
    if (!gameData || !justification.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/solo/${gameId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: gameData.playerTeamId,
          step: currentActionStep,
          optionSelected: selectedOption,
          justificationText: justification,
          questionId: currentQuestion?.id ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");

      setPendingResult({
        step: currentActionStep,
        score: data.score,
        multiplier: data.multiplier,
        feedback: data.feedback,
        earned: data.earned,
        routing: { store: 60, food: 25, defense: 15 },
      });
      setUiStep("question_scored");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error submitting");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Handle routing confirm ───────────────────────────────────
  async function handleConfirmRouting() {
    if (!gameData || !pendingResult) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/solo/${gameId}/route-resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: gameData.playerTeamId,
          step: pendingResult.step,
          earned: pendingResult.earned,
          storePercent: routing.store,
          populationPercent: routing.food,
          defensePercent: routing.defense,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Routing failed");

      // Update local resources
      setPlayerResources(data.updatedResources ?? {});

      // Record round result
      const result: RoundResult = { ...pendingResult, routing };
      const newResults = [...roundResults, result];
      setRoundResults(newResults);

      // Advance to next round or resolve
      if (roundIndex < ACTION_STEPS.length - 1) {
        setRoundIndex(roundIndex + 1);
        setSelectedOption("");
        setJustification("");
        setPendingResult(null);
        setRouting({ store: 60, food: 25, defense: 15 });
        setUiStep("question");
      } else {
        // All 4 rounds done — resolve epoch
        setUiStep("resolving");
        await handleResolveEpoch(newResults);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error routing resources");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Handle epoch resolution ──────────────────────────────────
  async function handleResolveEpoch(results: RoundResult[]) {
    if (!gameData) return;
    try {
      const res = await fetch(`/api/solo/${gameId}/cpu-advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerTeamId: gameData.playerTeamId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Advance failed");

      setEpochSummary({
        newEpoch: data.newEpoch,
        completedEpoch: data.completedEpoch,
        standings: data.standings,
      });
      setUiStep("epoch_summary");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error advancing epoch");
      setUiStep("epoch_summary");
    }
  }

  // ── Handle next epoch ────────────────────────────────────────
  async function handleNextEpoch() {
    setRoundIndex(0);
    setRoundResults([]);
    setEpochSummary(null);
    setSelectedOption("");
    setJustification("");
    setPendingResult(null);
    setRouting({ store: 60, food: 25, defense: 15 });
    setUiStep("loading");
    await loadState();
    setUiStep("epoch_start");
  }

  // ── Render ─────────────────────────────────────────────────
  if (uiStep === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-lg animate-pulse">Loading civilization data…</div>
      </div>
    );
  }

  if (uiStep === "error") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">⚠️ {errorMsg}</p>
          <button onClick={() => router.push("/solo")} className="px-4 py-2 bg-gray-700 rounded text-white">
            ← Back to Solo Menu
          </button>
        </div>
      </div>
    );
  }

  const epoch = gameData?.currentEpoch ?? 1;
  const civName = gameData?.playerCivName ?? "Your Civilization";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => router.push("/solo")}
          className="text-gray-500 hover:text-gray-300 text-sm"
        >
          ← Solo Menu
        </button>
        <div className="flex-1 text-center">
          <span className="text-amber-400 font-bold">{civName}</span>
          <span className="text-gray-500 mx-2">·</span>
          <span className="text-gray-300">EPOCH {epoch}</span>
        </div>
        <span className="text-gray-600 text-sm font-mono">{gameId.slice(0, 8)}</span>
      </header>

      <div className="flex flex-1 gap-0">
        {/* Main content */}
        <main className="flex-1 p-6 max-w-3xl mx-auto w-full">

          {/* EPOCH START */}
          {uiStep === "epoch_start" && (
            <div className="text-center space-y-6 pt-12">
              <div className="inline-block bg-gray-900 border border-gray-700 rounded-2xl px-8 py-6">
                <div className="text-5xl mb-4">🏛️</div>
                <h2 className="text-3xl font-bold text-amber-400 mb-2">Epoch {epoch} Begins</h2>
                <p className="text-gray-400 max-w-md">
                  Your council of advisors awaits your decisions. Each round your specialists will
                  bring you a question — answer wisely to earn resources and grow your civilization.
                </p>
              </div>
              <div className="text-gray-600 text-sm grid grid-cols-4 gap-2 max-w-sm mx-auto">
                {ACTION_STEPS.map((s) => (
                  <div key={s} className="text-center">
                    <div className="text-xl mb-1">{STEP_META[s].emoji}</div>
                    <div className="text-xs">{STEP_META[s].role}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setRoundIndex(0); setUiStep("question"); }}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-lg"
              >
                Begin Epoch {epoch} →
              </button>
            </div>
          )}

          {/* QUESTION */}
          {uiStep === "question" && currentQuestion && (
            <div className="space-y-5">
              <PhaseBar roundIndex={roundIndex} />
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
                {/* Round badge */}
                <div className="flex items-center gap-3">
                  <span className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1 text-sm font-bold">
                    {currentMeta.emoji} {currentMeta.label.toUpperCase()} ROUND
                  </span>
                  <span className="text-gray-500 text-sm">Your {currentMeta.role} speaks:</span>
                </div>

                {/* Question text */}
                <h2 className="text-lg font-semibold text-gray-100 leading-relaxed">
                  {currentQuestion.promptText}
                </h2>

                {/* Options */}
                <div className="space-y-2">
                  {currentQuestion.options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                        selectedOption === opt.id
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-gray-700 hover:border-gray-500 bg-gray-800"
                      }`}
                    >
                      <input
                        type="radio"
                        name="option"
                        value={opt.id}
                        checked={selectedOption === opt.id}
                        onChange={() => setSelectedOption(opt.id)}
                        className="mt-0.5 accent-amber-500"
                      />
                      <div>
                        <div className="font-medium text-gray-100">{opt.label}</div>
                        {opt.description && (
                          <div className="text-sm text-gray-400 mt-0.5">{opt.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Historical context */}
                <details className="group">
                  <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <span className="group-open:hidden">▶</span>
                    <span className="hidden group-open:inline">▼</span>
                    Historical Context
                  </summary>
                  <p className="mt-2 text-sm text-gray-400 bg-gray-800 rounded p-3 italic leading-relaxed">
                    {currentQuestion.historicalContext}
                  </p>
                </details>
              </div>

              {/* Justification */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Your Justification{" "}
                  <span className="font-normal text-gray-500">
                    (DM scores your reasoning — more depth = higher yield)
                  </span>
                </label>
                <div className="text-xs text-gray-500 bg-gray-900 rounded px-3 py-2 mb-2 italic">
                  💡 Starter: &quot;{currentQuestion.scaffolding6th}&quot;
                </div>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Write your justification here (at least 2 sentences)…"
                  rows={5}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-600 resize-none focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>
                    {justification.length < 100 && "⚠️ Short — score 1–2"}
                    {justification.length >= 100 && justification.length < 200 && "📋 Developing — score 2–3"}
                    {justification.length >= 200 && justification.length < 350 && "📗 Solid — score 3–4"}
                    {justification.length >= 350 && "⭐ Strong — score 4–5"}
                  </span>
                  <span>{justification.length} chars</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || justification.trim().length < 30}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-lg text-base transition-all"
              >
                {submitting ? "Submitting…" : `Submit ${currentMeta.emoji} ${currentMeta.label} Decision →`}
              </button>
            </div>
          )}

          {/* QUESTION SCORED */}
          {uiStep === "question_scored" && pendingResult && (() => {
            const sm = SCORE_META[pendingResult.score];
            return (
              <div className="space-y-5">
                <PhaseBar roundIndex={roundIndex} />
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center space-y-4">
                  <div className="text-5xl">{sm.emoji}</div>
                  <div>
                    <div className={`text-3xl font-bold ${sm.color}`}>
                      {pendingResult.score}/5 — {sm.label}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Justification multiplier: ×{pendingResult.multiplier.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm text-gray-300 text-left leading-relaxed">
                    {pendingResult.feedback}
                  </div>
                  <div className="text-2xl font-bold text-amber-400">
                    +{pendingResult.earned} {currentMeta.emoji} {currentMeta.role === "Architect" ? "Production" : currentMeta.role === "Merchant" ? "Reach" : currentMeta.role === "Diplomat" ? "Legacy" : "Resilience"} earned
                  </div>
                </div>
                <button
                  onClick={() => setUiStep("routing")}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg"
                >
                  Allocate Resources →
                </button>
              </div>
            );
          })()}

          {/* ROUTING */}
          {uiStep === "routing" && pendingResult && (
            <div className="space-y-5">
              <PhaseBar roundIndex={roundIndex} />
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold">Resource Allocation</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    You earned{" "}
                    <span className="text-amber-400 font-bold">
                      {pendingResult.earned} {currentMeta.emoji} {STEP_META[pendingResult.step].label}
                    </span>{" "}
                    this round. How do you allocate it?
                  </p>
                </div>

                {/* Visual bar */}
                <div className="flex rounded-full overflow-hidden h-4">
                  <div className="bg-amber-500 transition-all" style={{ width: `${routing.store}%` }} />
                  <div className="bg-green-500 transition-all" style={{ width: `${routing.food}%` }} />
                  <div className="bg-blue-500 transition-all" style={{ width: `${routing.defense}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="text-amber-400">⚙️ Treasury {routing.store}%</span>
                  <span className="text-green-400">🌾 Growth {routing.food}%</span>
                  <span className="text-blue-400">🛡️ Defense {routing.defense}%</span>
                </div>

                {/* Allocation rows */}
                {(
                  [
                    {
                      field: "store" as const,
                      label: "Treasury",
                      desc: `→ ${RESOURCE_META[STEP_META[pendingResult.step].resource].emoji} ${RESOURCE_META[STEP_META[pendingResult.step].resource].label} bank`,
                      color: "text-amber-400",
                      barColor: "bg-amber-500",
                    },
                    {
                      field: "food" as const,
                      label: "Growth Fund",
                      desc: "→ 🌾 Food (grows population)",
                      color: "text-green-400",
                      barColor: "bg-green-500",
                    },
                    {
                      field: "defense" as const,
                      label: "Defense Reserve",
                      desc: "→ 🛡️ Resilience (protection)",
                      color: "text-blue-400",
                      barColor: "bg-blue-500",
                    },
                  ] as const
                ).map(({ field, label, desc, color }) => (
                  <div key={field} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className={`font-semibold text-sm ${color}`}>{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRouting(adjustRouting(routing, field, -5))}
                        className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold"
                        disabled={routing[field] <= 0}
                      >
                        −
                      </button>
                      <span className={`w-12 text-center font-mono font-bold ${color}`}>
                        {routing[field]}%
                      </span>
                      <button
                        onClick={() => setRouting(adjustRouting(routing, field, 5))}
                        className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold"
                        disabled={routing[field] >= 100}
                      >
                        +
                      </button>
                      <span className="w-10 text-right text-gray-400 text-sm">
                        +{Math.round(pendingResult.earned * routing[field] / 100)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirmRouting}
                disabled={submitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 text-black font-bold rounded-lg text-base"
              >
                {submitting
                  ? "Saving…"
                  : roundIndex < ACTION_STEPS.length - 1
                  ? `Confirm → ${STEP_META[ACTION_STEPS[roundIndex + 1]].emoji} ${STEP_META[ACTION_STEPS[roundIndex + 1]].label} Round`
                  : "Confirm → Resolve Epoch"}
              </button>
            </div>
          )}

          {/* RESOLVING */}
          {uiStep === "resolving" && (
            <div className="text-center space-y-6 pt-16">
              <div className="text-5xl animate-spin inline-block">⚙️</div>
              <h2 className="text-2xl font-bold text-gray-300">Resolving Epoch {epoch}…</h2>
              <p className="text-gray-500">CPU civilizations are making their decisions.</p>
              <div className="flex justify-center gap-2 mt-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* EPOCH SUMMARY */}
          {uiStep === "epoch_summary" && epochSummary && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-amber-400">Epoch {epochSummary.completedEpoch} Complete</h2>
                <p className="text-gray-500 mt-1">Your civilization advances through history.</p>
              </div>

              {/* Your round results */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Your Results This Epoch</h3>
                <div className="grid grid-cols-4 gap-2">
                  {roundResults.map((r) => {
                    const meta = STEP_META[r.step];
                    const sm = SCORE_META[r.score];
                    return (
                      <div key={r.step} className="bg-gray-800 rounded-lg p-3 text-center">
                        <div className="text-xl mb-1">{meta.emoji}</div>
                        <div className="text-xs font-bold text-gray-400">{meta.label}</div>
                        <div className={`text-lg font-bold mt-1 ${sm.color}`}>{r.score}/5</div>
                        <div className="text-xs text-amber-400">+{r.earned}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Standings */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                  Civilization Standings
                </h3>
                <div className="space-y-2">
                  {epochSummary.standings.map((t) => (
                    <div
                      key={t.teamId}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                        t.isPlayer ? "bg-amber-500/15 border border-amber-500/40" : "bg-gray-800"
                      }`}
                    >
                      <span className="w-6 text-center font-bold text-gray-500">#{t.rank}</span>
                      <div className="flex-1">
                        <span className={`font-semibold ${t.isPlayer ? "text-amber-400" : "text-gray-200"}`}>
                          {t.civName}
                          {t.isPlayer && " 👑"}
                        </span>
                        <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                          <span>⚙️{t.resources.production ?? 0}</span>
                          <span>🧭{t.resources.reach ?? 0}</span>
                          <span>📜{t.resources.legacy ?? 0}</span>
                          <span>🛡️{t.resources.resilience ?? 0}</span>
                          <span>👥{t.population}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-gray-300">{t.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleNextEpoch}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-lg"
              >
                Begin Epoch {epochSummary.newEpoch} →
              </button>
            </div>
          )}
        </main>

        {/* Resource Sidebar */}
        {uiStep !== "epoch_start" && uiStep !== "resolving" && (
          <div className="p-6 border-l border-gray-800">
            <ResourceSidebar resources={playerResources} population={playerPopulation} />
            {/* Mini leaderboard */}
            {gameData && (
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Standings
                </h3>
                {gameData.teams
                  .sort((a, b) => b.totalResources - a.totalResources)
                  .map((t, i) => (
                    <div key={t.id} className="flex justify-between text-xs py-1">
                      <span className={t.id === gameData.playerTeamId ? "text-amber-400" : "text-gray-500"}>
                        #{i + 1} {t.civName?.split(" ")[1] ?? t.civName}
                        {t.id === gameData.playerTeamId && " 👑"}
                      </span>
                      <span className="text-gray-400">{t.totalResources}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
