// ============================================================
// VassalBanner — Liege overlay indicator for vassalized civilizations
// ============================================================
// Realms v1.5 Pass 5 — renders a subtle banner on a vassal's civ flag
// or in their header, showing they pay tribute to a liege. Per Polgara's
// Guardrail 2 the vassal keeps her civ-name, her flag color, her
// submissions. The banner is additive, never a replacement.
//
// Used by:
//   - Student's own dashboard header (small banner below civ name)
//   - Projector map overlay (small icon adjacent to flag)
//   - DM roster view (inline badge)
// ============================================================

"use client";

interface VassalBannerProps {
  liegeCivName: string;
  liegeFlagColor: string;
  tributePercent: number;
  epochsRemaining?: number | null; // null = open-ended / revolt-eligible
  variant?: "header" | "inline" | "map";
}

export default function VassalBanner(props: VassalBannerProps) {
  const { liegeCivName, liegeFlagColor, tributePercent, epochsRemaining, variant = "inline" } = props;

  if (variant === "map") {
    return (
      <div
        style={{
          padding: "2px 4px",
          borderRadius: 4,
          background: "#3b2a2a",
          color: liegeFlagColor,
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          border: `1px solid ${liegeFlagColor}`,
        }}
        title={`Vassal of ${liegeCivName} — ${tributePercent}% tribute`}
      >
        ⛓ {liegeCivName}
      </div>
    );
  }

  if (variant === "header") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "0.25rem 0.55rem",
          borderRadius: 6,
          background: "#3b2a2a",
          color: "#f3d6b0",
          fontSize: "0.75rem",
          fontWeight: 600,
          borderLeft: `3px solid ${liegeFlagColor}`,
        }}
      >
        <span>⛓</span>
        <span>
          Vassal of {liegeCivName} ({tributePercent}% tribute)
        </span>
        {epochsRemaining !== null && epochsRemaining !== undefined ? (
          <span style={{ opacity: 0.7, fontWeight: 400 }}>· {epochsRemaining} epoch(s) left</span>
        ) : null}
      </div>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "1px 6px",
        borderRadius: 4,
        background: `${liegeFlagColor}22`,
        color: liegeFlagColor,
        fontSize: "0.7rem",
        fontWeight: 600,
      }}
      title={`Vassal of ${liegeCivName} — ${tributePercent}%`}
    >
      ⛓ {liegeCivName}
    </span>
  );
}
