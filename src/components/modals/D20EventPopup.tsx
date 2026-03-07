"use client";

// ============================================
// D20EventPopup — Decision 33
// Full-screen takeover modal showing d20 roll
// result and event card. Auto-dismiss after 8s.
// ============================================

import { useEffect, useState } from "react";
import { getSeverityDisplay, type EventDefinition, type EventSeverity } from "@/lib/game/event-deck";

interface D20EventPopupProps {
  roll: number;
  event: EventDefinition;
  onDismiss: () => void;
  autoDismissMs?: number;
}

const D20_FRAMES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function D20EventPopup({
  roll,
  event,
  onDismiss,
  autoDismissMs = 8000,
}: D20EventPopupProps) {
  const [phase, setPhase] = useState<"rolling" | "reveal" | "card">("rolling");
  const [displayNumber, setDisplayNumber] = useState(1);
  const [countdown, setCountdown] = useState(Math.ceil(autoDismissMs / 1000));

  const severity = getSeverityDisplay(event.severity);

  // Rolling animation
  useEffect(() => {
    if (phase !== "rolling") return;
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 20) + 1);
    }, 80);

    const revealTimer = setTimeout(() => {
      clearInterval(interval);
      setDisplayNumber(roll);
      setPhase("reveal");
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(revealTimer);
    };
  }, [phase, roll]);

  // Reveal → Card transition
  useEffect(() => {
    if (phase !== "reveal") return;
    const timer = setTimeout(() => setPhase("card"), 800);
    return () => clearTimeout(timer);
  }, [phase]);

  // Auto-dismiss countdown
  useEffect(() => {
    if (phase !== "card") return;

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          onDismiss();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, onDismiss]);

  // Severity-based border glow
  const glowColor =
    event.severity === "extreme_negative"
      ? "shadow-red-500/50"
      : event.severity === "moderate_negative"
      ? "shadow-orange-500/30"
      : event.severity === "extreme_positive"
      ? "shadow-yellow-500/50"
      : "shadow-green-500/30";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={phase === "card" ? onDismiss : undefined}
    >
      <div className={`max-w-md w-full mx-4 shadow-2xl ${glowColor}`}>
        {/* Rolling Phase */}
        {phase === "rolling" && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4 animate-bounce">🎲</div>
            <div className="text-8xl font-black text-white tabular-nums animate-pulse">
              {displayNumber}
            </div>
            <div className="text-gray-400 text-sm mt-4">Rolling...</div>
          </div>
        )}

        {/* Reveal Phase */}
        {phase === "reveal" && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl mb-4">🎲</div>
            <div
              className={`text-9xl font-black tabular-nums ${severity.color}`}
              style={{
                animation: "pulse 0.5s ease-in-out",
              }}
            >
              {roll}
            </div>
            <div className={`text-lg font-bold mt-4 ${severity.color}`}>
              {severity.label}
            </div>
          </div>
        )}

        {/* Event Card Phase */}
        {phase === "card" && (
          <div
            className={`rounded-xl border overflow-hidden ${
              event.severity.includes("negative")
                ? "border-red-700/50"
                : "border-green-700/50"
            }`}
          >
            {/* Header */}
            <div className={`px-6 py-4 ${severity.bgColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{event.emoji}</span>
                  <div>
                    <div className="text-xl font-bold text-white">
                      {event.name}
                    </div>
                    <div className={`text-sm font-medium ${severity.color}`}>
                      🎲 {roll} — {severity.label}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {countdown}s
                </div>
              </div>
            </div>

            {/* Flavor Text */}
            <div className="px-6 py-4 bg-gray-900">
              <p className="text-sm text-gray-300 italic leading-relaxed">
                &ldquo;{event.flavorText}&rdquo;
              </p>
            </div>

            {/* Effect */}
            <div className="px-6 py-4 bg-gray-900/80 border-t border-gray-800">
              <div className="text-sm font-medium text-white mb-2">Effect:</div>
              <div className="text-sm text-gray-300">{event.description}</div>

              {/* Resource impacts */}
              {Object.keys(event.resourceImpact).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {Object.entries(event.resourceImpact).map(([res, amount]) => (
                    <span
                      key={res}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        (amount ?? 0) > 0
                          ? "bg-green-900/30 text-green-400"
                          : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {(amount ?? 0) > 0 ? "+" : ""}
                      {amount ?? 0} {res}
                    </span>
                  ))}
                </div>
              )}

              {event.populationImpact !== 0 && (
                <div className="mt-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      event.populationImpact > 0
                        ? "bg-green-900/30 text-green-400"
                        : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    {event.populationImpact > 0 ? "+" : ""}
                    {event.populationImpact} 👥 Population
                  </span>
                </div>
              )}

              {event.mitigations.length > 0 && (
                <div className="text-xs text-gray-500 mt-3">
                  💡 Mitigated by: {event.mitigations.join(", ")}
                </div>
              )}
            </div>

            {/* Dismiss */}
            <div className="px-6 py-3 bg-gray-900/60 border-t border-gray-800 text-center">
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Click to dismiss ({countdown}s)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
