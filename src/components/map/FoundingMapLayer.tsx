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
import { GeoJSON } from "react-leaflet";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";

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

        const baseColor = terrain ? (TERRAIN_COLORS[terrain] ?? "#444") : "#1e293b";
        const fillOpacity = isSelected ? 0.75 : isMapped ? 0.45 : 0.12;
        const borderColor = isSelected ? "#f59e0b" : isMapped ? "#ffffff22" : "#ffffff11";
        const borderWeight = isSelected ? 2.5 : 1;

        return (
          <GeoJSON
            key={`${feature.id ?? idx}`}
            data={feature as unknown as GeoJSON.GeoJsonObject}
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
          />
        );
      })}
    </>
  );
}
