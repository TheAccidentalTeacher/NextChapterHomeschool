// ============================================================
// ContactMap — First-contact projector overlay
// ============================================================
// Realms v1.5 — shows which civ-pairs have "met." Important for
// low-density classes (15 students on 12 regions).
//
// State transitions (per Mira C5):
//   - First contact: both flags pulse simultaneously for 2 seconds, an
//     animated line draws between their sub-zones.
//   - After: a subtle dotted edge persists for the rest of the game.
//
// This component is DISPLAY-ONLY — parent feeds it the flag positions
// and the contact events. The underlying detection lives in
// contact-engine.ts (existing) and/or the DM Global Event firing.
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";

interface FlagPosition {
  team_id: string;
  civ_name: string;
  flag_color: string;
  x: number; // 0..100 pct of viewport
  y: number; // 0..100 pct
}

interface ContactEdge {
  a_team_id: string;
  b_team_id: string;
  contact_epoch: number;
  is_fresh?: boolean; // true when just fired, pulses for 2s then becomes persistent dotted edge
}

interface ContactMapProps {
  flags: FlagPosition[];
  edges: ContactEdge[];
  currentEpoch: number;
}

export default function ContactMap(props: ContactMapProps) {
  const { flags, edges, currentEpoch } = props;
  const [freshMap, setFreshMap] = useState<Record<string, boolean>>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function edgeKey(e: ContactEdge) {
    return [e.a_team_id, e.b_team_id].sort().join(":");
  }

  // Watch for newly-fresh edges — fire pulse then decay
  useEffect(() => {
    for (const e of edges) {
      if (!e.is_fresh) continue;
      const k = edgeKey(e);
      if (freshMap[k]) continue;
      setFreshMap((prev) => ({ ...prev, [k]: true }));
      timersRef.current[k] = setTimeout(() => {
        setFreshMap((prev) => {
          const { [k]: _omit, ...rest } = prev;
          void _omit;
          return rest;
        });
      }, 2000);
    }
    return () => {
      for (const t of Object.values(timersRef.current)) clearTimeout(t);
      timersRef.current = {};
    };
  }, [edges, freshMap]);

  const flagById = new Map(flags.map((f) => [f.team_id, f]));

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2/1",
        background: "#0d0d16",
        overflow: "hidden",
        borderRadius: 8,
      }}
    >
      {/* Edge lines */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 50"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {edges.map((e) => {
          const a = flagById.get(e.a_team_id);
          const b = flagById.get(e.b_team_id);
          if (!a || !b) return null;
          const fresh = freshMap[edgeKey(e)];
          return (
            <line
              key={edgeKey(e)}
              x1={a.x}
              y1={a.y / 2}
              x2={b.x}
              y2={b.y / 2}
              stroke={fresh ? "#f7c06a" : "#7a6a4a"}
              strokeWidth={fresh ? 0.4 : 0.15}
              strokeDasharray={fresh ? "0" : "0.6 0.6"}
              opacity={fresh ? 1 : 0.55}
            >
              {fresh ? (
                <animate attributeName="stroke-width" values="0.2;0.6;0.2" dur="2s" repeatCount="1" />
              ) : null}
            </line>
          );
        })}
      </svg>

      {/* Flags */}
      {flags.map((f) => {
        const isPulsing = edges.some((e) => {
          const fresh = freshMap[edgeKey(e)];
          return fresh && (e.a_team_id === f.team_id || e.b_team_id === f.team_id);
        });
        return (
          <div
            key={f.team_id}
            style={{
              position: "absolute",
              left: `${f.x}%`,
              top: `${f.y}%`,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              transition: "transform 200ms",
            }}
          >
            <div
              style={{
                width: isPulsing ? 22 : 16,
                height: isPulsing ? 22 : 16,
                borderRadius: "50%",
                background: f.flag_color,
                boxShadow: isPulsing ? `0 0 18px ${f.flag_color}` : "none",
                transition: "all 300ms ease-out",
              }}
            />
            <div style={{ fontSize: "0.7rem", color: "#f7e8c0", textAlign: "center", maxWidth: 80 }}>
              {f.civ_name}
            </div>
          </div>
        );
      })}

      <div style={{ position: "absolute", top: 8, right: 12, fontSize: "0.75rem", color: "#7a6a4a" }}>
        Epoch {currentEpoch}
      </div>
    </div>
  );
}
