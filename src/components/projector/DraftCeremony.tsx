// ============================================================
// DraftCeremony — Projector draft order reveal ceremony
// ============================================================
// Realms v1.5 — projector-side animation for the draft order reveal.
// One name at a time, 2s hold per name, then shrinks to queue position.
// Audio: plays drumbeat per reveal IF the Arm Ceremony gesture was satisfied
// on the projector tab (see §7 + Mira C3 fix). Audio blocked silently if
// the audio context has not been unlocked by a prior user gesture on
// this tab — the visual drumbeat glyph pulses as a fallback.
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";

interface DraftEntry {
  team_id: string;
  civ_name: string;
  flag_color: string;
  draft_order: number;
}

interface DraftCeremonyProps {
  entries: DraftEntry[];            // order: draft_order ascending
  revealStepMs?: number;            // default 4000 per name (2s reveal + 2s hold)
  audioUnlocked: boolean;           // must be set true after Arm Ceremony button click
  onComplete?: () => void;
}

export default function DraftCeremony(props: DraftCeremonyProps) {
  const { entries, revealStepMs = 4000, audioUnlocked, onComplete } = props;
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [pulse, setPulse] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Start ticker once entries load
  useEffect(() => {
    if (entries.length === 0) return;
    setRevealedIndex(0);
  }, [entries.length]);

  // Advance ticker
  useEffect(() => {
    if (revealedIndex < 0 || revealedIndex >= entries.length) return;

    // Fire audio pulse for this reveal
    setPulse(true);
    const pulseTimer = setTimeout(() => setPulse(false), 800);

    if (audioUnlocked) {
      try {
        if (!audioCtxRef.current) {
          const Ctx =
            (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
              .AudioContext ??
            (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
              .webkitAudioContext;
          if (Ctx) audioCtxRef.current = new Ctx();
        }
        const ctx = audioCtxRef.current;
        if (ctx) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(110, ctx.currentTime); // drum-ish low note
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
          osc.connect(gain).connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }
      } catch {
        // Silent fallback — the visual pulse is still visible
      }
    }

    // Move to next or fire completion
    const advance = setTimeout(() => {
      if (revealedIndex + 1 >= entries.length) {
        onComplete?.();
      } else {
        setRevealedIndex(revealedIndex + 1);
      }
    }, revealStepMs);

    return () => {
      clearTimeout(pulseTimer);
      clearTimeout(advance);
    };
  }, [revealedIndex, entries, revealStepMs, audioUnlocked, onComplete]);

  const current = revealedIndex >= 0 ? entries[revealedIndex] : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        minHeight: "70vh",
        background: "linear-gradient(180deg, #0d0d16 0%, #1a1a2e 100%)",
        color: "#f7e8c0",
        fontFamily: "serif",
      }}
    >
      <div style={{ fontSize: "1.5rem", letterSpacing: "0.3em", opacity: 0.7, marginBottom: "2rem" }}>
        THE FOUNDING
      </div>

      {!audioUnlocked ? (
        <div style={{ fontSize: "0.85rem", color: "#f7c06a", marginBottom: "1rem", opacity: 0.85 }}>
          Audio blocked — the Arm Ceremony button was not clicked on this projector tab. Visual drumbeat only.
        </div>
      ) : null}

      <div
        style={{
          fontSize: "4.5rem",
          fontWeight: 700,
          minHeight: "6rem",
          textAlign: "center",
          textShadow: current ? `0 0 30px ${current.flag_color}88` : "none",
          transform: pulse ? "scale(1.05)" : "scale(1)",
          transition: "transform 400ms ease-out",
        }}
      >
        {current ? current.civ_name : "…"}
      </div>

      <div style={{ fontSize: "1.3rem", marginTop: "0.5rem", opacity: 0.7 }}>
        {current ? `Draft Position ${current.draft_order}` : ""}
      </div>

      <div style={{ fontSize: "2rem", marginTop: "1.5rem", opacity: pulse ? 1 : 0.3, transition: "opacity 200ms" }}>
        🥁
      </div>

      {/* Queue list — revealed entries shrink to this row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginTop: "2.5rem",
          maxWidth: "80%",
          justifyContent: "center",
        }}
      >
        {entries.slice(0, revealedIndex).map((e) => (
          <div
            key={e.team_id}
            style={{
              padding: "0.3rem 0.7rem",
              borderRadius: 6,
              background: `${e.flag_color}22`,
              border: `1px solid ${e.flag_color}`,
              fontSize: "0.9rem",
            }}
          >
            {e.draft_order}. {e.civ_name}
          </div>
        ))}
      </div>
    </div>
  );
}
