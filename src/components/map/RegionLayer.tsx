// ============================================
// RegionLayer — Renders world-zone polygons colored by team ownership
// Uses public/data/world-zones.geojson which has features with
// properties.sub_zone_id in the format "regionNumber-subzoneNumber".
// A team with region_id=6 owns all features where sub_zone_id starts with "6-".
// ============================================

"use client";

import { useState, useEffect } from "react";
import { GeoJSON, Tooltip } from "react-leaflet";

export interface TeamRegion {
  teamId: string;
  regionId: number;
  color: string;
  name: string;
}

interface RegionLayerProps {
  teamRegions: TeamRegion[];
}

interface WorldZoneFeature {
  type: "Feature";
  id?: string | number;
  geometry: GeoJSON.Geometry;
  properties: {
    name: string;
    sub_zone_id: string;
    sub_zone_name: string;
    terrain_type: string;
    yield_modifier: number;
  };
}

interface WorldZoneCollection {
  type: "FeatureCollection";
  features: WorldZoneFeature[];
}

export default function RegionLayer({ teamRegions }: RegionLayerProps) {
  const [geojson, setGeojson] = useState<WorldZoneCollection | null>(null);

  useEffect(() => {
    fetch("/data/world-zones.geojson")
      .then((r) => r.json())
      .then((data: WorldZoneCollection) => setGeojson(data))
      .catch(() => {/* ignore */});
  }, []);

  if (!geojson || teamRegions.length === 0) return null;

  // Build lookup: regionId (number) → { color, name }
  const regionMap = new Map<number, { color: string; name: string }>();
  for (const tr of teamRegions) {
    regionMap.set(tr.regionId, { color: tr.color, name: tr.name });
  }

  // Group distinct features by (geometry hash = first coord string) to avoid
  // rendering duplicates — world-zones has some countries sharing sub_zone_ids.
  // We just render every feature; overlapping same-color polygons look fine.
  return (
    <>
      {geojson.features.map((feature, idx) => {
        const subZoneId: string = feature.properties?.sub_zone_id ?? "";
        const regionNum = parseInt(subZoneId.split("-")[0], 10);
        const team = regionMap.get(regionNum);

        if (!team) {
          // No team owns this region — render subtle neutral style
          return (
            <GeoJSON
              key={`neutral-${idx}`}
              data={feature}
              style={() => ({
                fillColor: "#374151",
                fillOpacity: 0.2,
                color: "#ffffff18",
                weight: 0.5,
              })}
            />
          );
        }

        return (
          <GeoJSON
            key={`team-${regionNum}-${idx}`}
            data={feature}
            style={() => ({
              fillColor: team.color,
              fillOpacity: 0.45,
              color: team.color,
              weight: 1,
              opacity: 0.7,
            })}
          >
            <Tooltip sticky>
              <span className="text-xs font-semibold">{team.name}</span>
              <br />
              <span className="text-xs text-gray-400">{feature.properties.sub_zone_name}</span>
            </Tooltip>
          </GeoJSON>
        );
      })}
    </>
  );
}
