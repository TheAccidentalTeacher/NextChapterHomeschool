"use client";

// ============================================
// MathGateModal — Decision 88
// Math problem before transactions.
// Wrong = 15-20% yield reduction, transaction still happens.
// One attempt only, optional timer.
// ============================================

import { useState, useEffect, useCallback } from "react";
import {
  generateMathProblem,
  checkMathAnswer,
  type MathDifficulty,
  type MathGateResult,
} from "@/lib/game/math-gate";

interface MathGateModalProps {
  difficulty: MathDifficulty;
  resourceName: string;
  transactionAmount: number;
  bankAmount: number;
  /** Timer in seconds (0 = no timer) */
  timerSeconds: number;
  onComplete: (result: MathGateResult) => void;
}

export default function MathGateModal({
  difficulty,
  resourceName,
  transactionAmount,
  bankAmount,
  timerSeconds,
  onComplete,
}: MathGateModalProps) {
  const [problem] = useState(() =>
    generateMathProblem(difficulty, resourceName, transactionAmount, bankAmount)
  );
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<MathGateResult | null>(null);

  // Timer countdown
  useEffect(() => {
    if (timerSeconds <= 0 || submitted) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up — auto-submit as timed out
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSeconds, submitted]);

  const handleTimeout = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    const r = checkMathAnswer(problem, null, true);
    setResult(r);
    setTimeout(() => onComplete(r), 2000);
  }, [problem, submitted, onComplete]);

  function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    const numAnswer = parseFloat(answer);
    const r = checkMathAnswer(problem, isNaN(numAnswer) ? null : numAnswer);
    setResult(r);
    // Show result briefly, then complete
    setTimeout(() => onComplete(r), 2000);
  }

  const timerPercent = timerSeconds > 0 ? (timeLeft / timerSeconds) * 100 : 100;
  const timerColor =
    timerPercent > 50 ? "bg-green-500" : timerPercent > 25 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-xl border border-blue-700/50 bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900/20 px-6 py-4 border-b border-blue-800/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              🧮 Math Gate
            </h2>
            {timerSeconds > 0 && !submitted && (
              <div className="text-sm font-mono text-white">
                ⏱️ {timeLeft}s
              </div>
            )}
          </div>
          {/* Timer bar */}
          {timerSeconds > 0 && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Problem */}
        <div className="px-6 py-6">
          <div className="text-center mb-6">
            <div className="text-sm text-gray-400 mb-2">Solve to proceed:</div>
            <div className="text-lg font-medium text-white leading-relaxed">
              {problem.question}
            </div>
          </div>

          {/* Answer Input */}
          {!submitted ? (
            <div className="space-y-4">
              <input
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && answer.trim()) handleSubmit();
                }}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-xl text-white text-center placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none tabular-nums"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className={`w-full rounded-lg px-4 py-3 text-sm font-bold transition-all ${
                  answer.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Submit Answer
              </button>
              <div className="text-xs text-gray-500 text-center">
                One attempt only — wrong answer = reduced transaction value
              </div>
            </div>
          ) : (
            /* Result */
            <div className="text-center space-y-3">
              {result?.isCorrect ? (
                <>
                  <div className="text-5xl">✅</div>
                  <div className="text-xl font-bold text-green-400">
                    Correct!
                  </div>
                  <div className="text-sm text-gray-400">
                    Full transaction value applied.
                  </div>
                </>
              ) : result?.timedOut ? (
                <>
                  <div className="text-5xl">⏱️</div>
                  <div className="text-xl font-bold text-yellow-400">
                    Time's Up!
                  </div>
                  <div className="text-sm text-gray-400">
                    Correct answer was {problem.correctAnswer}. Transaction reduced by 20%.
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl">❌</div>
                  <div className="text-xl font-bold text-red-400">
                    Incorrect
                  </div>
                  <div className="text-sm text-gray-400">
                    Correct answer was {problem.correctAnswer}. Transaction reduced by 20%.
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
