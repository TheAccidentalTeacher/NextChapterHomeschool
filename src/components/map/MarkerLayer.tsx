// ============================================
// MarkerLayer — Unit & building map markers
// Renders emoji-based Leaflet markers for scouts,
// soldiers, merchants, farms, barracks, etc.
// Colored per team using DivIcon with emoji text.
//
// Centroid calc: uses the average of GeoJSON polygon ring vertices.
// SubZones are passed in so we can look up GeoJSON without a DB call.
// ============================================

"use client";

import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { MapMarker, TeamColor, SubZoneData } from "./GameMap";

interface MarkerLayerProps {
  markers: MapMarker[];
  teamColors: TeamColor[];
  subZones?: SubZoneData[];  // for centroid lookup
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
 * Compute the centroid of a GeoJSON Polygon or MultiPolygon.
 * Returns [lat, lng] (Leaflet order).
 */
function computeCentroid(geojson: GeoJSON.Geometry): [number, number] | null {
  let rings: number[][][] = [];

  if (geojson.type === "Polygon") {
    rings = geojson.coordinates as number[][][];
  } else if (geojson.type === "MultiPolygon") {
    // Use the first polygon
    const coords = geojson.coordinates as number[][][][];
    if (coords.length > 0) rings = coords[0];
  }

  if (rings.length === 0) return null;

  // Average the outer ring vertices (GeoJSON = [lng, lat])
  const ring = rings[0];
  if (ring.length === 0) return null;

  let sumLng = 0;
  let sumLat = 0;
  let count = 0;
  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
    count++;
  }

  return [sumLat / count, sumLng / count];  // [lat, lng] for Leaflet
}

export default function MarkerLayer({ markers, teamColors, subZones = [] }: MarkerLayerProps) {
  // Build sub-zone centroid cache from GeoJSON
  const centroidCache = new Map<string, [number, number]>();
  for (const sz of subZones) {
    if (sz.geojson) {
      const c = computeCentroid(sz.geojson);
      if (c) centroidCache.set(sz.id, c);
    }
  }

  const colorMap = Object.fromEntries(
    teamColors.map((tc) => [tc.teamId, tc.color])
  );

  return (
    <>
      {markers.map((marker, idx) => {
        const teamColor = colorMap[marker.teamId] ?? "#888";
        const center = centroidCache.get(marker.subZoneId);

        if (!center) return null;

        const icon = createMarkerIcon(marker.type, teamColor, marker.count);
        const label = MARKER_LABELS[marker.type] ?? marker.type;

        return (
          <Marker key={marker.id ?? `${idx}`} position={center} icon={icon}>
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
