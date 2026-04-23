// ============================================================
// RulerDashboard — Realms v2 main student dashboard (game_mode='realms')
// ============================================================
// Supersedes the five role-specific panels (Architect/Merchant/Diplomat/
// Lorekeeper/Warlord) for Realms games. Each student rules one civilization
// end-to-end — no role rotation.
//
// Shows (per Polgara's Guardrail 3):
//   - Civilization identity (name, flag color, sub-zone)
//   - Current epoch + round prompt
//   - Resources (Production, Reach, Legacy, Resilience, Food)
//   - Population + war-exhaustion banner
//   - THREE victory progress strips visible from Epoch 1:
//       • Cultural (wisdom)
//       • Economic (wealth)
//       • Domination (might) — the strip itself visible from E1, the
//         domination track unlocks E6 when wars open
//   - DiplomacyPanel (grayed-locked E1-E3, unlocks E4+)
//   - Active alliance / vassalage banners if any
// ============================================================

"use client";

import { useMemo, useState } from "react";
import DiplomacyPanel from "@/components/realms/DiplomacyPanel";
import RoundMapSelector, { type RoundMapMode, type MapSelection } from "@/components/game/RoundMapSelector";
import type { SubZoneData, TeamColor, TeamRegion } from "@/components/map/GameMap";

interface RulerDashboardProps {
  civName: string;
  civFlagColor: string;
  subZoneName: string | null;
  currentEpoch: number;
  totalEpochs: number;
  currentRound: string;
  roundPrompt: string;
  resources: {
    production: number;
    reach: number;
    legacy: number;
    resilience: number;
    food: number;
  };
  population: number;
  warExhaustionLevel: number;
  // Victory progress (0-100 scaled for each path)
  culturalProgress: number;
  economicProgress: number;
  dominationProgress: number;
  // Game context
  gameId: string;
  teamId: string;
  otherTeams: Array<{ id: string; name: string; civilization_name: string | null }>;
  activeAlliances: Array<{ id: string; partner_team_id: string; partner_civ_name: string }>;
  vassalageState: { isVassal: boolean; liegeCivName?: string } | null;
  // Map-skill data (optional — when supplied, RoundMapSelector renders in the round prompt)
  subZones?: SubZoneData[];
  teamColors?: TeamColor[];
  teamRegions?: TeamRegion[];
  onMapSelect?: (selection: MapSelection) => void;
}

function VictoryStrip({
  label,
  emoji,
  progress,
  locked,
  lockedText,
  tint,
}: {
  label: string;
  emoji: string;
  progress: number;
  locked?: boolean;
  lockedText?: string;
  tint: string;
}) {
  const clampedPct = Math.max(0, Math.min(100, progress));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.5rem 0.75rem",
        borderRadius: 8,
        background: "#f4f1e8",
        border: `1px solid ${tint}`,
        opacity: locked ? 0.5 : 1,
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#2c2c2c",
            letterSpacing: "0.02em",
            marginBottom: 2,
          }}
        >
          {label}
          {locked && lockedText ? (
            <span style={{ fontWeight: 400, fontSize: "0.7rem", marginLeft: 6, color: "#777" }}>
              — {lockedText}
            </span>
          ) : null}
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: "#ddd6c3",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${clampedPct}%`,
              height: "100%",
              background: tint,
              transition: "width 400ms ease-out",
            }}
          />
        </div>
      </div>
      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: tint, minWidth: 40, textAlign: "right" }}>
        {Math.round(clampedPct)}%
      </span>
    </div>
  );
}

export default function RulerDashboard(props: RulerDashboardProps) {
  const {
    civName,
    civFlagColor,
    subZoneName,
    currentEpoch,
    totalEpochs,
    currentRound,
    roundPrompt,
    resources,
    population,
    warExhaustionLevel,
    culturalProgress,
    economicProgress,
    dominationProgress,
    gameId,
    teamId,
    otherTeams,
    activeAlliances,
    vassalageState,
    subZones,
    teamColors,
    teamRegions,
    onMapSelect,
  } = props;

  const [mapSelectedId, setMapSelectedId] = useState<string | null>(null);
  const mapMode: RoundMapMode | null = (() => {
    const r = currentRound?.toUpperCase?.();
    if (r === "BUILD" || r === "EXPAND" || r === "DEFINE" || r === "DEFEND") return r;
    return null;
  })();

  const dominationLocked = currentEpoch < 6;
  const warExhaustionTier = useMemo(() => {
    if (warExhaustionLevel >= 100) return { label: "Civil Unrest", color: "#8b0000" };
    if (warExhaustionLevel >= 75) return { label: "Crisis", color: "#c13e3e" };
    if (warExhaustionLevel >= 50) return { label: "Strained", color: "#d97706" };
    return null;
  }, [warExhaustionLevel]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem", maxWidth: 860 }}>
      {/* Civ identity header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          borderRadius: 10,
          background: "#fff",
          borderLeft: `6px solid ${civFlagColor}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1a1a1a" }}>
            {civName || "(Civilization unnamed)"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#555" }}>
            {subZoneName ? `Settled at ${subZoneName}` : "Awaiting founding"} · Epoch {currentEpoch} of {totalEpochs}
          </div>
        </div>
        {vassalageState?.isVassal && vassalageState.liegeCivName ? (
          <div
            style={{
              marginLeft: "auto",
              padding: "0.3rem 0.6rem",
              borderRadius: 6,
              background: "#3b2a2a",
              color: "#f3d6b0",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
            title="Your civilization pays tribute to this liege"
          >
            Vassal of {vassalageState.liegeCivName}
          </div>
        ) : null}
      </div>

      {/* Victory paths (Polgara Guardrail 3 — always visible from E1) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#444", letterSpacing: "0.04em" }}>
          Your civilization can triumph through wisdom, wealth, or might. All three paths are open to you.
        </div>
        <VictoryStrip label="Cultural Victory (wisdom)" emoji="🎭" progress={culturalProgress} tint="#6a4c93" />
        <VictoryStrip label="Economic Victory (wealth)" emoji="💰" progress={economicProgress} tint="#b08900" />
        <VictoryStrip
          label="Domination Victory (might)"
          emoji="⚔️"
          progress={dominationProgress}
          tint="#9c2a2a"
          locked={dominationLocked}
          lockedText={dominationLocked ? `unlocks Epoch 6 (you are in ${currentEpoch})` : undefined}
        />
      </div>

      {/* Resources + Population */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr) 1fr",
          gap: "0.5rem",
          padding: "0.75rem",
          borderRadius: 10,
          background: "#faf7ef",
          border: "1px solid #ddd6c3",
        }}
      >
        <ResourceCell label="Production" value={resources.production} />
        <ResourceCell label="Reach" value={resources.reach} />
        <ResourceCell label="Legacy" value={resources.legacy} />
        <ResourceCell label="Resilience" value={resources.resilience} />
        <ResourceCell label="Food" value={resources.food} />
        <ResourceCell label="Population" value={population} highlight />
      </div>

      {warExhaustionTier ? (
        <div
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            background: warExhaustionTier.color,
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
        >
          War Exhaustion: {warExhaustionTier.label} ({warExhaustionLevel})
        </div>
      ) : null}

      {/* Round prompt */}
      <div
        style={{
          padding: "1rem",
          borderRadius: 10,
          background: "#fff",
          border: "1px solid #e5dfd2",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#7a6a4a", letterSpacing: "0.05em" }}>
          {currentRound.toUpperCase()} ROUND
        </div>
        <div style={{ fontSize: "1.05rem", color: "#1a1a1a", marginTop: 4 }}>{roundPrompt || "—"}</div>
      </div>

      {/* Map-skill selector — shown when map data is available and the round
          is an action round. Per Scott's Phase 2 ask: children use the map
          every round, not only Founding. */}
      {mapMode && subZones && subZones.length > 0 && teamColors ? (
        <RoundMapSelector
          mode={mapMode}
          myTeamId={teamId}
          teamColors={teamColors}
          teamRegions={teamRegions}
          subZones={subZones}
          selectedSubZoneId={mapSelectedId}
          onSelect={(sel) => {
            setMapSelectedId(sel.subZoneId);
            onMapSelect?.(sel);
          }}
        />
      ) : null}

      {/* Diplomacy panel */}
      <DiplomacyPanel
        currentEpoch={currentEpoch}
        gameId={gameId}
        teamId={teamId}
        otherTeams={otherTeams}
        activeAlliances={activeAlliances}
        isVassal={vassalageState?.isVassal ?? false}
      />
    </div>
  );
}

function ResourceCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "0.3rem",
        borderRadius: 6,
        background: highlight ? "#2a9d8f" : "transparent",
        color: highlight ? "#fff" : "#2c2c2c",
      }}
    >
      <div style={{ fontSize: "0.65rem", letterSpacing: "0.04em", opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{value === 0 ? "—" : value}</div>
    </div>
  );
}
