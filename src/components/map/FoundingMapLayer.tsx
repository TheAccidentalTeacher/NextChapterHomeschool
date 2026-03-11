// ============================================================
// FoundingMapLayer — renders world countries as actual
// geographic polygons for the city-founding screen.
//
// Uses world-zones.geojson (pre-built at build time) which tags
// every country with its sub-zone ID and terrain type.
// Replaces the rectangular SubZoneLayer for the founding step.
// ============================================================

"use client";

import { useEffect, useState, useRef } from "react";
import { GeoJSON, Tooltip } from "react-leaflet";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";

// Terrain tooltip info keyed by terrain_type
const TERRAIN_INFO: Record<string, { emoji: string; resource: string; amount: string; quality: string; tip: string }> = {
  river_valley: { emoji: "🌊", resource: "Food",       amount: "+15", quality: "Excellent", tip: "Fertile floodplains feed large populations — the first cities rose here." },
  coastal:      { emoji: "⛵", resource: "Reach",      amount: "+10", quality: "Excellent", tip: "Sea access opens trade routes — coastal cities grew wealthy." },
  plains:       { emoji: "🌾", resource: "Food",        amount: "+8",  quality: "Good",      tip: "Open grasslands support early agriculture." },
  forest:       { emoji: "🌲", resource: "Production", amount: "+10", quality: "Good",      tip: "Timber for construction — early civilizations near forests built faster." },
  mountain:     { emoji: "⛰️", resource: "Resilience", amount: "+10", quality: "OK",        tip: "Natural fortress — mountain cities were nearly impregnable." },
  jungle:       { emoji: "🌿", resource: "Legacy",     amount: "+8",  quality: "OK",        tip: "Rich biodiversity fueled cultural development — the Maya thrived here." },
  desert:       { emoji: "🏜️", resource: "Resilience", amount: "+4",  quality: "Poor",      tip: "Harsh land, scarce water. Survival is possible but difficult." },
  tundra:       { emoji: "❄️", resource: "Resilience", amount: "+4",  quality: "Poor",      tip: "Frozen frontier — very few civilizations thrived this far north." },
};

const QUALITY_COLOR: Record<string, string> = {
  Excellent: "#22c55e",
  Good:      "#84cc16",
  OK:        "#eab308",
  Poor:      "#ef4444",
};

// Terrain colours — must match TERRAIN constant in lib/constants.ts
const TERRAIN_COLORS: Record<string, string> = {
  plains:       "#a3d977",
  forest:       "#2d6a4f",
  mountain:     "#8d99ae",
  desert:       "#e9c46a",
  coastal:      "#48cae4",
  river_valley: "#7ecf8e",
  tundra:       "#caf0f8",
  jungle:       "#1b4332",
};

interface WorldFeature extends GeoJSON.Feature {
  properties: {
    name: string | null;
    sub_zone_id: string | null;
    sub_zone_name: string | null;
    terrain_type: string | null;
    yield_modifier: number | null;
  };
}

// ── Antimeridian fix ───────────────────────────────────────────
// When a polygon ring has consecutive vertices that jump > 180° in
// longitude it straddles the antimeridian. Leaflet draws a horizontal
// artifact line across the map in that case.
//
// Fix: instead of dropping the ring, normalise its longitudes so they
// are continuous (e.g. +170 → -170 becomes +170 → +190). Leaflet
// handles longitudes outside ±180 correctly — the tiles wrap, so
// Russia's Far East renders in the right place without the artifact.
function normalizeRing(ring: number[][]): number[][] {
  if (ring.length === 0) return ring;
  const result: number[][] = [[...ring[0]]];
  for (let i = 1; i < ring.length; i++) {
    let lng = ring[i][0];
    const prevLng = result[i - 1][0];
    while (lng - prevLng > 180) lng -= 360;
    while (prevLng - lng > 180) lng += 360;
    result.push([lng, ring[i][1]]);
  }
  return result;
}

function sanitizeGeometry(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
  if (geometry.type === "Polygon") {
    return { ...geometry, coordinates: geometry.coordinates.map(normalizeRing) };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((poly) => poly.map(normalizeRing)),
    };
  }
  return geometry;
}

interface SubZoneSummary {
  id: string;
  name: string;
  terrain_type: string;
  yield_modifier: number;
}

interface FoundingMapLayerProps {
  subZones: SubZoneSummary[];
  selectedSubZoneId?: string | null;
  onSubZoneClick?: (sz: SubZoneSummary) => void;
}

type GeoJSONLayer = Layer & {
  setStyle?: (s: PathOptions) => void;
  feature?: WorldFeature;
};

export default function FoundingMapLayer({
  subZones,
  selectedSubZoneId,
  onSubZoneClick,
}: FoundingMapLayerProps) {
  const [features, setFeatures] = useState<WorldFeature[] | null>(null);

  // Build a quick lookup from sub_zone_id → full SubZone
  const szMap = useRef<Map<string, SubZoneSummary>>(new Map());
  useEffect(() => {
    szMap.current = new Map(subZones.map((sz) => [sz.id, sz]));
  }, [subZones]);

  // Load the pre-built GeoJSON on mount
  useEffect(() => {
    fetch("/data/world-zones.geojson")
      .then((r) => r.json())
      .then((fc: GeoJSON.FeatureCollection) => {
        setFeatures(fc.features as WorldFeature[]);
      })
      .catch((err) => console.error("Failed to load world-zones.geojson", err));
  }, []);

  if (!features) return null;

  return (
    <>
      {features.map((feature, idx) => {
        const szId = feature.properties.sub_zone_id;
        const terrain = feature.properties.terrain_type;
        const isSelected = !!szId && szId === selectedSubZoneId;
        const isMapped = !!szId;

        // Normalise antimeridian-crossing rings so Russia / Alaska render correctly
        const safeGeometry = sanitizeGeometry(feature.geometry);

        const baseColor = terrain ? (TERRAIN_COLORS[terrain] ?? "#444") : "#1e293b";
        const fillOpacity = isSelected ? 0.75 : isMapped ? 0.45 : 0.12;
        const borderColor = isSelected ? "#f59e0b" : isMapped ? "#ffffff22" : "#ffffff11";
        const borderWeight = isSelected ? 2.5 : 1;

        const info = terrain ? TERRAIN_INFO[terrain] : null;
        const szName = feature.properties.sub_zone_name ?? feature.properties.name ?? "Unknown territory";

        return (
          <GeoJSON
            key={`${feature.id ?? idx}`}
            data={{ ...feature, geometry: safeGeometry } as unknown as GeoJSON.GeoJsonObject}
            style={() => ({
              fillColor: isSelected ? "#f59e0b" : baseColor,
              fillOpacity,
              color: borderColor,
              weight: borderWeight,
            })}
            eventHandlers={{
              click: () => {
                if (!isMapped || !onSubZoneClick) return;
                const sz = szMap.current.get(szId!);
                if (sz) onSubZoneClick(sz);
              },
              mouseover: (e: LeafletMouseEvent) => {
                if (!isMapped) return;
                const layer = e.target as GeoJSONLayer;
                layer.setStyle?.({
                  fillOpacity: isSelected ? 0.85 : 0.65,
                  weight: isSelected ? 2.5 : 1.5,
                });
              },
              mouseout: (e: LeafletMouseEvent) => {
                const layer = e.target as GeoJSONLayer;
                layer.setStyle?.({ fillOpacity, weight: borderWeight });
              },
            }}
          >
            {isMapped && info && (
              <Tooltip sticky className="founding-tooltip">
                <div style={{ minWidth: 200, maxWidth: 240, fontFamily: "inherit" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: "#f1f5f9" }}>
                    {szName}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, textTransform: "capitalize" }}>
                    {terrain?.replace("_", " ")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{info.emoji}</span>
                    <span style={{ fontWeight: 600, color: "#fbbf24", fontSize: 13 }}>
                      {info.amount} {info.resource}
                    </span>
                    <span style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      fontWeight: 600,
                      color: QUALITY_COLOR[info.quality] ?? "#94a3b8",
                    }}>
                      {info.quality}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.4 }}>
                    {info.tip}
                  </div>
                </div>
              </Tooltip>
            )}
          </GeoJSON>
        );
      })}
    </>
  );
}
