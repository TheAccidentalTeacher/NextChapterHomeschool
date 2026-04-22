// ============================================================
// RoundMapSelector — per-round Leaflet map interaction
// ============================================================
// Each classroom round (BUILD / EXPAND / DEFINE / DEFEND) gets a
// map-skill panel. Wraps GameMap with round-type-aware click handling
// that enforces sensible constraints (build on own territory only,
// expand on unclaimed, diplomacy on other civs).
// ============================================================

"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { TeamRegion, SubZoneData, TeamColor } from "@/components/map/GameMap";

const GameMap = dynamic(() => import("@/components/map/GameMap"), { ssr: false });

export type RoundMapMode = "BUILD" | "EXPAND" | "DEFINE" | "DEFEND";

interface RoundMapSelectorProps {
  mode: RoundMapMode;
  myTeamId: string;
  teamRegions?: TeamRegion[];
  teamColors: TeamColor[];
  subZones: SubZoneData[];
  onSelect: (selection: MapSelection) => void;
  selectedSubZoneId?: string | null;
}

export interface MapSelection {
  mode: RoundMapMode;
  subZoneId: string;
  regionId: number;
  targetTeamId?: string;
  terrainType?: string;
  hint?: string;
}

const MODE_PROMPT: Record<RoundMapMode, { emoji: string; label: string; hint: string }> = {
  BUILD: {
    emoji: "🏗️",
    label: "Choose where to build",
    hint: "Click one of your own territories. Think about the terrain — a farm thrives in a river valley, walls matter on a border.",
  },
  EXPAND: {
    emoji: "🧭",
    label: "Choose where to expand",
    hint: "Click an unclaimed territory. Coastal land opens trade; mountains defend but yield less.",
  },
  DEFINE: {
    emoji: "🕊️",
    label: "Choose your diplomatic target",
    hint: "Click another civilization's territory. Who are you speaking to — and why?",
  },
  DEFEND: {
    emoji: "⚔️",
    label: "Choose where to deploy",
    hint: "Click one of your own territories to garrison, or an enemy's territory to raid.",
  },
};

export default function RoundMapSelector(props: RoundMapSelectorProps) {
  const { mode, myTeamId, teamRegions, teamColors, subZones, onSelect, selectedSubZoneId } = props;

  const prompt = MODE_PROMPT[mode];
  const [hint, setHint] = useState<string | null>(null);

  function handleSubZoneClick(sz: SubZoneData) {
    const owningTeamId = sz.controlled_by_team_id ?? null;
    const terrain = sz.terrain_type;
    const isMine = owningTeamId === myTeamId;

    if (mode === "BUILD") {
      if (!isMine) {
        setHint("You can only build on your own territory.");
        return;
      }
      setHint(null);
      onSelect({ mode, subZoneId: sz.id, regionId: sz.region_id, terrainType: terrain, hint: `Build on ${terrain}` });
      return;
    }
    if (mode === "EXPAND") {
      if (owningTeamId) {
        setHint("That territory is already claimed. Pick unclaimed land.");
        return;
      }
      setHint(null);
      onSelect({ mode, subZoneId: sz.id, regionId: sz.region_id, terrainType: terrain, hint: `Expand into ${terrain}` });
      return;
    }
    if (mode === "DEFINE") {
      if (!owningTeamId) {
        setHint("Diplomacy requires a target civilization — click land they control.");
        return;
      }
      if (isMine) {
        setHint("Pick another civilization, not your own.");
        return;
      }
      setHint(null);
      onSelect({ mode, subZoneId: sz.id, regionId: sz.region_id, targetTeamId: owningTeamId, terrainType: terrain, hint: `Approach their civilization` });
      return;
    }
    if (mode === "DEFEND") {
      if (!owningTeamId) {
        setHint("Pick your own territory to garrison, or an enemy civilization to raid.");
        return;
      }
      setHint(null);
      onSelect({
        mode,
        subZoneId: sz.id,
        regionId: sz.region_id,
        targetTeamId: isMine ? undefined : owningTeamId,
        terrainType: terrain,
        hint: isMine ? "Garrison here" : "Raid this enemy",
      });
      return;
    }
  }

  const selectedSummary = useMemo(() => {
    if (!selectedSubZoneId) return null;
    const sz = subZones.find((s) => s.id === selectedSubZoneId);
    if (!sz) return null;
    return `✔ Selected — region ${sz.region_id}, ${sz.terrain_type}`;
  }, [selectedSubZoneId, subZones]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 0.75rem",
          background: "#1a1a2e",
          border: "1px solid #2d2d44",
          borderRadius: 8,
          color: "#f7e8c0",
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>{prompt.emoji}</span>
        <div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{prompt.label}</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>{prompt.hint}</div>
        </div>
      </div>

      <div style={{ height: 340, borderRadius: 8, overflow: "hidden", border: "1px solid #2d2d44" }}>
        <GameMap
          subZones={subZones}
          teamColors={teamColors}
          teamRegions={teamRegions}
          onSubZoneClick={handleSubZoneClick}
          showFog={false}
        />
      </div>

      {(hint || selectedSummary) ? (
        <div
          style={{
            fontSize: "0.8rem",
            color: hint ? "#f7c06a" : "#a7c957",
            padding: "0.4rem 0.6rem",
            background: "#0f0f18",
            borderRadius: 6,
            border: `1px solid ${hint ? "#7a6a4a" : "#3d5a1d"}`,
          }}
        >
          {hint ?? selectedSummary}
        </div>
      ) : null}
    </div>
  );
}
