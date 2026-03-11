// ============================================
// FitBoundsToRegion — Zooms the Leaflet map to a specific world region.
// Reads world-zones.geojson, finds all features whose sub_zone_id
// starts with "<regionId>-", computes their combined bounding box,
// and calls map.fitBounds() once on mount.
// ============================================

"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";

interface FitBoundsToRegionProps {
  regionId: number;
}

interface WorldZoneFeature {
  type: "Feature";
  geometry: GeoJSON.Geometry;
  properties: { sub_zone_id: string };
}

function extractCoords(geometry: GeoJSON.Geometry): Array<[number, number]> {
  const coords: Array<[number, number]> = [];

  function walk(c: unknown): void {
    if (Array.isArray(c)) {
      if (typeof c[0] === "number") {
        coords.push([c[1] as number, c[0] as number]);
      } else {
        c.forEach(walk);
      }
    }
  }

  if ("coordinates" in geometry) {
    walk(geometry.coordinates);
  }
  return coords;
}

export default function FitBoundsToRegion({ regionId }: FitBoundsToRegionProps) {
  const map = useMap();

  useEffect(() => {
    const prefix = `${regionId}-`;

    fetch("/data/world-zones.geojson")
      .then((r) => r.json())
      .then((data: { features: WorldZoneFeature[] }) => {
        const allCoords: Array<[number, number]> = [];

        for (const feature of data.features) {
          if (feature.properties?.sub_zone_id?.startsWith(prefix)) {
            allCoords.push(...extractCoords(feature.geometry));
          }
        }

        if (allCoords.length === 0) return;

        const lats = allCoords.map((c) => c[0]);
        const lngs = allCoords.map((c) => c[1]);
        const bounds: LatLngBoundsExpression = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ];

        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 5, animate: false });
      })
      .catch(() => {/* ignore */});
  // Only run once on mount — regionId won't change for a given student
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
