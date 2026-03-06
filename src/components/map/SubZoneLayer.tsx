// ============================================
// SubZoneLayer — GeoJSON territory polygons
// Renders sub-zone boundaries on the Leaflet map
// with team-color fills, fog-of-war masking,
// terrain-based styling, and depletion tier colors.
// Decision 87: Sub-zone depletion mechanics.
// ============================================

"use client";

import { GeoJSON, Tooltip } from "react-leaflet";
import type { SubZoneData, TeamColor, FogEntry } from "./GameMap";
import { TERRAIN } from "@/lib/constants";
import { getDepletionTier, DEPLETION_COLORS } from "@/lib/game/depletion-engine";
import type { TerrainType } from "@/types/database";
import type { Layer, LeafletMouseEvent } from "leaflet";

interface SubZoneLayerProps {
  subZones: SubZoneData[];
  teamColors: TeamColor[];
  fogState?: FogEntry[];
  showFog: boolean;
  onSubZoneClick?: (subZone: SubZoneData) => void;
}

export default function SubZoneLayer({
  subZones,
  teamColors,
  fogState,
  showFog,
  onSubZoneClick,
}: SubZoneLayerProps) {
  const colorMap = Object.fromEntries(
    teamColors.map((tc) => [tc.teamId, tc.color])
  );
  const fogMap = fogState
    ? Object.fromEntries(fogState.map((f) => [f.sub_zone_id, f.state]))
    : null;

  return (
    <>
      {subZones.map((sz) => {
        const isHidden = showFog && fogMap && fogMap[sz.id] === "hidden";
        const teamColor = sz.controlled_by_team_id
          ? colorMap[sz.controlled_by_team_id]
          : null;

        // Depletion visual
        const depletionTier = getDepletionTier(
          sz.soil_fertility ?? 100,
          sz.wildlife_stock ?? 100
        );

        // Style
        const fillColor = isHidden
          ? "#1a1a2e"
          : teamColor ?? TERRAIN[sz.terrain_type as TerrainType]?.color ?? "#444";
        const fillOpacity = isHidden ? 0.85 : 0.45;

        // Depletion overlay color (blended)
        const depletionOverlay =
          !isHidden && depletionTier !== "healthy"
            ? DEPLETION_COLORS[depletionTier]
            : undefined;

        const terrainInfo = TERRAIN[sz.terrain_type as TerrainType];
        const ownerTeam = teamColors.find(
          (tc) => tc.teamId === sz.controlled_by_team_id
        );

        return (
          <GeoJSON
            key={sz.id}
            data={{
              type: "Feature" as const,
              geometry: sz.geojson,
              properties: { id: sz.id },
            } as GeoJSON.Feature}
            style={() => ({
              fillColor,
              fillOpacity,
              color: isHidden ? "#1a1a2e" : "#ffffff30",
              weight: 1,
              dashArray: isHidden ? undefined : undefined,
            })}
            eventHandlers={{
              click: () => {
                if (!isHidden && onSubZoneClick) {
                  onSubZoneClick(sz);
                }
              },
              mouseover: (e: LeafletMouseEvent) => {
                const layer = e.target as Layer & {
                  setStyle?: (s: Record<string, unknown>) => void;
                };
                if (!isHidden && layer.setStyle) {
                  layer.setStyle({ fillOpacity: 0.7, weight: 2 });
                }
              },
              mouseout: (e: LeafletMouseEvent) => {
                const layer = e.target as Layer & {
                  setStyle?: (s: Record<string, unknown>) => void;
                };
                if (layer.setStyle) {
                  layer.setStyle({ fillOpacity, weight: 1 });
                }
              },
            }}
          >
            {/* Depletion overlay GeoJSON on top */}
            {depletionOverlay && (
              <GeoJSON
                data={{
                  type: "Feature" as const,
                  geometry: sz.geojson,
                  properties: {},
                } as GeoJSON.Feature}
                style={() => ({
                  fillColor: depletionOverlay,
                  fillOpacity: 0.5,
                  color: "transparent",
                  weight: 0,
                })}
              />
            )}

            {!isHidden && (
              <Tooltip
                direction="top"
                sticky
                className="!bg-gray-900 !border-gray-700 !text-white !text-xs !rounded-lg !px-3 !py-2"
              >
                <div className="space-y-1">
                  <div className="font-bold">
                    {sz.settlement_name ?? sz.name}
                  </div>
                  <div className="text-gray-300">
                    {terrainInfo?.emoji} {terrainInfo?.label ?? sz.terrain_type}
                  </div>
                  {ownerTeam && (
                    <div className="text-gray-300">
                      Owner:{" "}
                      <span style={{ color: ownerTeam.color }}>
                        {ownerTeam.name}
                      </span>
                    </div>
                  )}
                  {sz.buildings && sz.buildings.length > 0 && (
                    <div className="text-gray-300">
                      Buildings: {sz.buildings.join(", ")}
                    </div>
                  )}
                  {depletionTier !== "healthy" && (
                    <div
                      className={
                        depletionTier === "critical"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }
                    >
                      ⚠️ {depletionTier === "critical" ? "Critically" : ""}{" "}
                      Depleted
                    </div>
                  )}
                </div>
              </Tooltip>
            )}
          </GeoJSON>
        );
      })}
    </>
  );
}
