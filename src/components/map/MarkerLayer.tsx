// ============================================
// MarkerLayer — Unit & building map markers
// Renders emoji-based Leaflet markers for scouts,
// soldiers, merchants, farms, barracks, etc.
// Colored per team using DivIcon with emoji text.
// ============================================

"use client";

import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { MapMarker, TeamColor } from "./GameMap";

interface MarkerLayerProps {
  markers: MapMarker[];
  teamColors: TeamColor[];
}

/** Emoji icons for each marker type */
const MARKER_ICONS: Record<string, string> = {
  scout: "🧭",
  soldier: "🛡️",
  merchant: "💰",
  builder: "🔨",
  farm: "🌾",
  barracks: "⚔️",
  market: "🏪",
  library: "📚",
  walls: "🧱",
  aqueduct: "💧",
  granary: "🏛️",
};

const MARKER_LABELS: Record<string, string> = {
  scout: "Scout",
  soldier: "Soldier",
  merchant: "Merchant",
  builder: "Builder",
  farm: "Farm",
  barracks: "Barracks",
  market: "Market",
  library: "Library",
  walls: "Walls",
  aqueduct: "Aqueduct",
  granary: "Granary",
};

/**
 * Create a DivIcon with emoji and team color badge
 */
function createMarkerIcon(
  type: string,
  teamColor: string,
  count: number
): L.DivIcon {
  const emoji = MARKER_ICONS[type] ?? "📌";
  return L.divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${teamColor}40;
        border: 2px solid ${teamColor};
        font-size: 14px;
        position: relative;
      ">
        ${emoji}
        ${
          count > 1
            ? `<span style="
                position: absolute;
                top: -6px;
                right: -6px;
                background: ${teamColor};
                color: #000;
                font-size: 10px;
                font-weight: bold;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">${count}</span>`
            : ""
        }
      </div>
    `,
    className: "classciv-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/**
 * Simple center-of-polygon calculation for marker placement
 */
function getSubZoneCenter(subZoneId: string): [number, number] | null {
  // In a full impl this would look up the GeoJSON centroid.
  // For now, markers are positioned by the SubZone data passed in.
  // This is a placeholder — real centroid calc comes from GeoJSON data.
  void subZoneId;
  return null;
}

export default function MarkerLayer({ markers, teamColors }: MarkerLayerProps) {
  const colorMap = Object.fromEntries(
    teamColors.map((tc) => [tc.teamId, tc.color])
  );

  // Group markers by sub-zone for offset stacking
  const bySubZone = new Map<string, MapMarker[]>();
  for (const m of markers) {
    const arr = bySubZone.get(m.subZoneId) ?? [];
    arr.push(m);
    bySubZone.set(m.subZoneId, arr);
  }

  return (
    <>
      {markers.map((marker, idx) => {
        const teamColor = colorMap[marker.teamId] ?? "#888";
        const center = getSubZoneCenter(marker.subZoneId);

        // Skip if we can't determine position (need GeoJSON centroid in production)
        if (!center) return null;

        const icon = createMarkerIcon(marker.type, teamColor, marker.count);
        const label = MARKER_LABELS[marker.type] ?? marker.type;

        return (
          <Marker key={marker.id ?? idx} position={center} icon={icon}>
            <Tooltip direction="top" offset={[0, -14]}>
              <span className="text-xs">
                {label} ×{marker.count}
              </span>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
