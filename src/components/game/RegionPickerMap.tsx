// ============================================
// RegionPickerMap — Leaflet map for region selection
// Dynamically imported (SSR-unsafe) by RegionSelectCard.
// Shows all 12 regions colored by terrain, claimed regions
// colored by team with team label, and lets Architect click to claim.
// ============================================

"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, Tooltip, ZoomControl } from "react-leaflet";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";
import "leaflet/dist/leaflet.css";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// Terrain colour palette — same as rest of the game
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

// Pre-assigned team colours for the picker (matches DM panel palette roughly)
const TEAM_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e",
  "#06b6d4","#8b5cf6","#ec4899","#14b8a6",
  "#f43f5e","#a16207","#3b82f6","#64748b",
];

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
    return { ...geometry, coordinates: geometry.coordinates.map((p) => p.map(normalizeRing)) };
  }
  return geometry;
}

interface WorldFeature extends GeoJSON.Feature {
  properties: {
    name: string | null;
    sub_zone_id: string | null;
    sub_zone_name: string | null;
    terrain_type: string | null;
  };
}

interface TeamInfo {
  teamId: string;
  teamName: string;
  regionId: number;
  isMyTeam: boolean;
}

interface RegionPickerMapProps {
  allTeams: TeamInfo[];
  myTeamId: string;
  myTeamColor: string;
  claimedRegions: Map<number, string>;
  isArchitect: boolean;
  onRegionHover: (regionId: number | null) => void;
  onRegionClick: (regionId: number) => void;
  loading: boolean;
}

export default function RegionPickerMap({
  allTeams,
  myTeamColor,
  claimedRegions,
  isArchitect,
  onRegionHover,
  onRegionClick,
  loading,
}: RegionPickerMapProps) {
  const [features, setFeatures] = useState<WorldFeature[] | null>(null);

  // Build regionId → team index for colour assignment
  const regionTeamMap = useRef<Map<number, { teamName: string; colorIdx: number; isMyTeam: boolean }>>(new Map());

  useEffect(() => {
    const m = new Map<number, { teamName: string; colorIdx: number; isMyTeam: boolean }>();
    allTeams.forEach((t, i) => {
      if (t.regionId > 0) {
        m.set(t.regionId, { teamName: t.teamName, colorIdx: i, isMyTeam: t.isMyTeam });
      }
    });
    regionTeamMap.current = m;
  }, [allTeams]);

  useEffect(() => {
    fetch("/data/world-zones.geojson")
      .then((r) => r.json())
      .then((fc: GeoJSON.FeatureCollection) => setFeatures(fc.features as WorldFeature[]))
      .catch(() => {});
  }, []);

  if (!features) return (
    <div className="flex h-full items-center justify-center bg-stone-950 text-stone-500 text-sm">
      Loading map…
    </div>
  );

  return (
    <MapContainer
      center={[20, 10]}
      zoom={2}
      minZoom={1}
      maxZoom={6}
      zoomControl={false}
      className="h-full w-full"
      style={{ background: "#0a0a0a" }}
      maxBounds={[[-85, -200], [85, 200]]}
      maxBoundsViscosity={1.0}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <ZoomControl position="bottomright" />

      {features.map((feature, idx) => {
        const szId = feature.properties.sub_zone_id;
        if (!szId) return null;
        const regionNum = parseInt(szId.split("-")[0], 10);
        if (isNaN(regionNum)) return null;

        const safeFeature = { ...feature, geometry: sanitizeGeometry(feature.geometry) };
        const claimed = regionTeamMap.current.get(regionNum);
        const terrain = feature.properties.terrain_type;

        const fillColor = claimed
          ? claimed.isMyTeam
            ? myTeamColor
            : TEAM_COLORS[(claimed.colorIdx ?? 0) % TEAM_COLORS.length]
          : terrain
          ? (TERRAIN_COLORS[terrain] ?? "#444")
          : "#374151";

        const fillOpacity = claimed ? 0.6 : 0.35;
        const borderColor = claimed ? (claimed.isMyTeam ? myTeamColor : "#ffffff55") : "#ffffff18";

        const baseStyle: PathOptions = { fillColor, fillOpacity, color: borderColor, weight: claimed ? 1.5 : 0.5 };

        return (
          <GeoJSON
            key={`r-${idx}`}
            data={safeFeature as unknown as GeoJSON.Feature}
            style={() => baseStyle}
            eventHandlers={{
              click: () => {
                if (!isArchitect || loading || !!claimed) return;
                onRegionClick(regionNum);
              },
              mouseover: (e: LeafletMouseEvent) => {
                const layer = e.target as Layer & { setStyle?: (s: PathOptions) => void };
                if (!claimed && isArchitect) {
                  layer.setStyle?.({ fillOpacity: 0.65, weight: 2, color: "#f59e0b" });
                }
                onRegionHover(regionNum);
              },
              mouseout: (e: LeafletMouseEvent) => {
                const layer = e.target as Layer & { setStyle?: (s: PathOptions) => void };
                layer.setStyle?.(baseStyle);
                onRegionHover(null);
              },
            }}
          >
            <Tooltip sticky className="!bg-gray-900 !border-gray-700 !text-white !text-xs">
              <div>
                <div className="font-bold">{feature.properties.sub_zone_name ?? feature.properties.name ?? "Region"}</div>
                {claimed ? (
                  <div className={claimed.isMyTeam ? "text-amber-300" : "text-red-300"}>
                    {claimed.isMyTeam ? "✓ Your team" : `↳ ${claimed.teamName}`}
                  </div>
                ) : (
                  <div className="text-green-400">{isArchitect ? "Click to claim" : "Unclaimed"}</div>
                )}
              </div>
            </Tooltip>
          </GeoJSON>
        );
      })}
    </MapContainer>
  );
}
