"use client";

// ============================================
// Epilogue Page — The game's final act
// Decision 68: Histories → Victories → Votes →
// Portfolios → HeyGen closing
// ============================================

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface TeamHistory {
  teamId: string;
  teamName: string;
  historyText: string;
}

interface VictoryResult {
  type: string;
  label: string;
  emoji: string;
  winner: { teamId: string; teamName: string } | null;
  standings: { teamId: string; teamName: string; rank: number; score: number }[];
}

interface SuperlativeResult {
  category: string;
  label: string;
  emoji: string;
  winner: { teamId: string; teamName: string; votes: number } | null;
}

type EpiloguePhase =
  | "histories"
  | "victories"
  | "superlatives"
  | "portfolios"
  | "closing";

const PHASE_ORDER: EpiloguePhase[] = [
  "histories",
  "victories",
  "superlatives",
  "portfolios",
  "closing",
];

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  most_ruthless: { label: "Most Ruthless Civilization", emoji: "⚔️" },
  most_surprising_comeback: { label: "Most Surprising Comeback", emoji: "🔄" },
  best_diplomat: { label: "Best Diplomat", emoji: "🤝" },
  most_feared: { label: "Civilization We Most Feared", emoji: "😨" },
  wished_we_were: { label: "Civilization We Wished We Were", emoji: "✨" },
};

export default function EpiloguePage() {
  const searchParams = useSearchParams();
  const gameId = searchParams?.get("gameId");
  const isProjector = searchParams?.get("view") === "projector";

  const [phase, setPhase] = useState<EpiloguePhase>("histories");
  const [histories, setHistories] = useState<TeamHistory[]>([]);
  const [victories, setVictories] = useState<VictoryResult[]>([]);
  const [superlatives, setSuperlatives] = useState<SuperlativeResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [closingVideoUrl, setClosingVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!gameId) return;
      setLoading(true);

      try {
        // Load epilogue data
        const res = await fetch(`/api/games/${gameId}/epilogue`);
        if (res.ok) {
          const data = await res.json();
          setHistories(data.histories ?? []);
          setVictories(data.victories ?? []);
          setClosingVideoUrl(data.closingVideoUrl ?? null);
        }

        // Load superlative results
        const supRes = await fetch(`/api/epilogue/results?game_id=${gameId}`);
        if (supRes.ok) {
          const supData = await supRes.json();
          const supList: SuperlativeResult[] = [];
          for (const [category, result] of Object.entries(supData.results ?? {})) {
            const meta = CATEGORY_META[category] ?? { label: category, emoji: "🏆" };
            supList.push({
              category,
              label: meta.label,
              emoji: meta.emoji,
              winner: (result as { winner: { teamId: string; teamName: string; votes: number } | null }).winner,
            });
          }
          setSuperlatives(supList);
        }
      } catch (err) {
        console.error("Epilogue load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [gameId]);

  function nextItem() {
    const maxForPhase = getMaxIndex();
    if (currentIndex < maxForPhase - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Move to next phase
      const phaseIdx = PHASE_ORDER.indexOf(phase);
      if (phaseIdx < PHASE_ORDER.length - 1) {
        setPhase(PHASE_ORDER[phaseIdx + 1]);
        setCurrentIndex(0);
      }
    }
  }

  function prevItem() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  function getMaxIndex(): number {
    switch (phase) {
      case "histories":
        return histories.length;
      case "victories":
        return victories.length;
      case "superlatives":
        return superlatives.length;
      case "portfolios":
        return 1;
      case "closing":
        return 1;
      default:
        return 1;
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-white text-lg animate-pulse">
          Loading the Epilogue...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Phase navigation (DM/teacher only) */}
      {!isProjector && (
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-800 bg-gray-900/90 px-4 py-2 backdrop-blur-sm">
          <div className="flex gap-2">
            {PHASE_ORDER.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPhase(p);
                  setCurrentIndex(0);
                }}
                className={`rounded px-3 py-1 text-xs uppercase ${
                  phase === p
                    ? "bg-amber-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prevItem}
              className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700"
            >
              ◀ Prev
            </button>
            <span className="text-xs text-gray-500 self-center">
              {currentIndex + 1} / {getMaxIndex()}
            </span>
            <button
              type="button"
              onClick={nextItem}
              className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-48px)] p-8">
        {/* HISTORIES */}
        {phase === "histories" && histories[currentIndex] && (
          <div className="max-w-3xl animate-fade-in">
            <h1 className="text-4xl font-bold text-amber-400 mb-8 text-center">
              📜 {histories[currentIndex].teamName}
            </h1>
            <div className="space-y-6 text-lg leading-relaxed text-gray-200">
              {histories[currentIndex].historyText
                .split("\n\n")
                .map((paragraph, i) => (
                  <p key={i} className="text-justify indent-8">
                    {paragraph}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* VICTORIES */}
        {phase === "victories" && victories[currentIndex] && (
          <div className="max-w-2xl text-center animate-fade-in">
            <div className="text-6xl mb-4">{victories[currentIndex].emoji}</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {victories[currentIndex].label}
            </h2>
            {victories[currentIndex].winner ? (
              <>
                <p className="text-5xl font-black text-amber-400 mt-8 mb-4">
                  🏆 {victories[currentIndex].winner?.teamName}
                </p>
                <div className="mt-8 space-y-2">
                  {victories[currentIndex].standings.map((s) => (
                    <div
                      key={s.teamId}
                      className={`flex items-center justify-between rounded-lg px-4 py-2 ${
                        s.rank === 1
                          ? "bg-amber-900/30 border border-amber-700"
                          : "bg-gray-800"
                      }`}
                    >
                      <span>
                        #{s.rank} {s.teamName}
                      </span>
                      <span className="text-gray-400">{s.score}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xl text-gray-500 mt-8">
                No civilization achieved this victory
              </p>
            )}
          </div>
        )}

        {/* SUPERLATIVES */}
        {phase === "superlatives" && superlatives[currentIndex] && (
          <div className="max-w-xl text-center animate-fade-in">
            <div className="text-8xl mb-6">
              {superlatives[currentIndex].emoji}
            </div>
            <h2 className="text-2xl font-bold text-gray-300 mb-4">
              {superlatives[currentIndex].label}
            </h2>
            {superlatives[currentIndex].winner ? (
              <p className="text-5xl font-black text-amber-400 mt-4">
                {superlatives[currentIndex].winner?.teamName}
              </p>
            ) : (
              <p className="text-xl text-gray-500">No votes recorded</p>
            )}
          </div>
        )}

        {/* PORTFOLIOS */}
        {phase === "portfolios" && (
          <div className="max-w-lg text-center animate-fade-in">
            <div className="text-6xl mb-6">📋</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Portfolio Available
            </h2>
            <p className="text-gray-400 mb-8">
              Each student can now view and download their civilization portfolio
              from their device.
            </p>
            <a
              href={`/api/epilogue/export-all`}
              className="inline-block rounded-xl bg-blue-700 px-8 py-3 font-bold text-white hover:bg-blue-600 transition-all"
            >
              📦 Export All Portfolios
            </a>
          </div>
        )}

        {/* CLOSING */}
        {phase === "closing" && (
          <div className="max-w-3xl text-center animate-fade-in">
            {closingVideoUrl ? (
              <video
                src={closingVideoUrl}
                autoPlay
                className="w-full rounded-xl shadow-2xl"
                onEnded={() => {
                  // Video done — show final text
                }}
              />
            ) : (
              <>
                <div className="text-6xl mb-8">🏛️</div>
                <blockquote className="text-xl leading-relaxed text-gray-300 italic">
                  &ldquo;Empires are not built by the sword alone. They are built
                  by the farmer who made the fields produce, by the merchant who
                  opened the road between strangers, by the artist who made the
                  people remember who they were. Six civilizations rose in this
                  room. You drafted your teams. You named your nations. You
                  answered history&apos;s questions and wrote your justifications
                  into the record. The map is full. The record is permanent.
                  History has been made — and you made it.&rdquo;
                </blockquote>
                <p className="mt-8 text-lg text-amber-400 font-bold">
                  — The Historian
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Phase indicator */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {PHASE_ORDER.map((p) => (
          <div
            key={p}
            className={`h-2 w-8 rounded-full ${
              phase === p ? "bg-amber-500" : "bg-gray-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
