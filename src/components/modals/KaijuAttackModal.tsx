"use client";

// ============================================
// KaijuAttackModal — Full-screen animated takeover
// Decision 34: Pure spectacle, zero game impact
// 5-8 second CSS animation per kaiju
// ============================================

import { useState, useEffect, useCallback } from "react";
import { getKaiju, type KaijuDefinition } from "@/lib/game/kaiju";

interface KaijuAttackModalProps {
  kaijuId: string | null;
  onComplete: () => void;
}

export default function KaijuAttackModal({
  kaijuId,
  onComplete,
}: KaijuAttackModalProps) {
  const [phase, setPhase] = useState<"rumble" | "attack" | "fade">("rumble");
  const [kaiju, setKaiju] = useState<KaijuDefinition | null>(null);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!kaijuId) return;
    const found = getKaiju(kaijuId);
    if (!found) return;

    setKaiju(found);
    setPhase("rumble");

    // Phase timing: rumble → attack → fade → done
    const rumbleTimer = setTimeout(() => setPhase("attack"), 1200);
    const fadeTimer = setTimeout(() => setPhase("fade"), found.durationMs - 1500);
    const doneTimer = setTimeout(() => handleComplete(), found.durationMs);

    return () => {
      clearTimeout(rumbleTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [kaijuId, handleComplete]);

  if (!kaijuId || !kaiju) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden"
      style={{
        background: `radial-gradient(circle at center, ${kaiju.colors.secondary}22, ${kaiju.colors.primary}cc)`,
      }}
    >
      {/* Screen shake during rumble */}
      <style>{`
        @keyframes kaiju-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-8px, -6px) rotate(-0.5deg); }
          20% { transform: translate(6px, 8px) rotate(0.5deg); }
          30% { transform: translate(-10px, 4px) rotate(-1deg); }
          40% { transform: translate(8px, -10px) rotate(1deg); }
          50% { transform: translate(-6px, 8px) rotate(-0.5deg); }
          60% { transform: translate(10px, -6px) rotate(0.5deg); }
          70% { transform: translate(-4px, 10px) rotate(-1deg); }
          80% { transform: translate(8px, -8px) rotate(1deg); }
          90% { transform: translate(-10px, 6px) rotate(-0.5deg); }
        }
        @keyframes kaiju-glow-pulse {
          0%, 100% { box-shadow: 0 0 40px ${kaiju.colors.glow}44; }
          50% { box-shadow: 0 0 120px ${kaiju.colors.glow}aa; }
        }
        @keyframes kaiju-emerge {
          0% { transform: scale(0.2) translateY(100vh); opacity: 0; }
          40% { transform: scale(0.8) translateY(20vh); opacity: 0.8; }
          60% { transform: scale(1.2) translateY(-5vh); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes kaiju-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes kaiju-fadeout {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.3) translateY(-50vh); }
        }
        @keyframes lightning-flash {
          0%, 9%, 11%, 29%, 31%, 100% { opacity: 0; }
          10%, 30% { opacity: 1; }
        }
        @keyframes tentacle-wave {
          0% { transform: rotate(-15deg) scaleY(0); }
          30% { transform: rotate(5deg) scaleY(1); }
          60% { transform: rotate(-10deg) scaleY(1); }
          100% { transform: rotate(0deg) scaleY(1); }
        }
        @keyframes boulder-fly {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          50% { transform: translate(30vw, -20vh) scale(1.5) rotate(180deg); }
          100% { transform: translate(60vw, 40vh) scale(0.5) rotate(360deg); }
        }
        @keyframes ufo-beam {
          0% { height: 0; opacity: 0; }
          20% { height: 80vh; opacity: 0.8; }
          80% { height: 80vh; opacity: 0.6; }
          100% { height: 0; opacity: 0; }
        }
        .kaiju-container-shake {
          animation: kaiju-shake 0.15s infinite linear;
        }
      `}</style>

      <div
        className={phase === "rumble" ? "kaiju-container-shake" : ""}
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          animation:
            phase === "fade"
              ? "kaiju-fadeout 1.5s ease-in forwards"
              : undefined,
        }}
      >
        {/* Glow ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: "60vmin",
            height: "60vmin",
            animation: phase === "attack" ? "kaiju-glow-pulse 1s infinite" : undefined,
            background: `radial-gradient(circle, ${kaiju.colors.glow}33, transparent 70%)`,
          }}
        />

        {/* Main kaiju emoji — enormous */}
        <div
          className="relative select-none"
          style={{
            fontSize: "min(40vw, 40vh)",
            lineHeight: 1,
            animation:
              phase === "rumble"
                ? "kaiju-emerge 1.2s ease-out forwards"
                : phase === "attack"
                  ? "kaiju-breathe 2s ease-in-out infinite"
                  : undefined,
            filter: `drop-shadow(0 0 30px ${kaiju.colors.glow})`,
          }}
        >
          {kaiju.emoji}
        </div>

        {/* Kaiju name */}
        <div
          className="mt-4 text-center"
          style={{
            animation:
              phase === "attack"
                ? "kaiju-emerge 0.5s ease-out forwards"
                : undefined,
            opacity: phase === "rumble" ? 0 : 1,
          }}
        >
          <h1
            className="font-black tracking-widest uppercase"
            style={{
              fontSize: "min(10vw, 80px)",
              color: kaiju.colors.glow,
              textShadow: `0 0 20px ${kaiju.colors.glow}, 0 0 40px ${kaiju.colors.primary}`,
              letterSpacing: "0.2em",
            }}
          >
            {kaiju.name}
          </h1>
          <p
            className="mt-2 text-lg opacity-80"
            style={{
              color: kaiju.colors.secondary,
              maxWidth: "600px",
              margin: "8px auto 0",
            }}
          >
            {kaiju.description}
          </p>
        </div>

        {/* Kaiju-specific effects */}
        {kaiju.id === "thunderbird" && phase === "attack" && (
          <div
            className="fixed inset-0 bg-white pointer-events-none"
            style={{ animation: "lightning-flash 2s infinite" }}
          />
        )}

        {kaiju.id === "kraken" && phase === "attack" && (
          <>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  bottom: 0,
                  left: `${10 + i * 15}%`,
                  width: "8vw",
                  height: "50vh",
                  background: `linear-gradient(to top, ${kaiju.colors.secondary}, transparent)`,
                  borderRadius: "50% 50% 0 0",
                  transformOrigin: "bottom center",
                  animation: `tentacle-wave ${1.5 + i * 0.2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0.6,
                }}
              />
            ))}
          </>
        )}

        {kaiju.id === "cyclops" && phase === "attack" && (
          <div
            className="absolute"
            style={{
              width: "10vw",
              height: "10vw",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${kaiju.colors.secondary}, ${kaiju.colors.primary})`,
              animation: "boulder-fly 2s ease-in infinite",
              top: "30%",
              left: "10%",
            }}
          />
        )}

        {kaiju.id === "zorg9" && phase === "attack" && (
          <div
            className="absolute left-1/2 top-0"
            style={{
              width: "20vw",
              transform: "translateX(-50%)",
              background: `linear-gradient(to bottom, ${kaiju.colors.secondary}cc, transparent)`,
              animation: "ufo-beam 3s ease-in-out infinite",
            }}
          />
        )}

        {/* Impact particles */}
        {phase === "attack" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${4 + Math.random() * 8}px`,
                  height: `${4 + Math.random() * 8}px`,
                  background: kaiju.colors.glow,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: 0.6,
                  animation: `kaiju-glow-pulse ${1 + Math.random() * 2}s infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* "Zero impact" disclaimer */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/30">
        This is purely cosmetic. Your civilization is unharmed.
      </div>
    </div>
  );
}
