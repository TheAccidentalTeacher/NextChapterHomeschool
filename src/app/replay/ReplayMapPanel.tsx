// ============================================
// ReplayMapPanel — Territory map for replay viewer
// Uses the 12 game regions (bounding box polygons)
// colored by which team controls each region that
// epoch. Reach resource drives expansion into
// unowned regions 7-12.
// ============================================

"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// Fix Leaflet default marker icon broken in webpack:
import L from "leaflet";
// @ts-expect-error - leaflet internal
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

import regionsData from "../../../public/data/regions.json";

// ---- Types ----

interface SnapshotTeam {
  teamId: string;
  teamName: string;
  regionId?: number;
  resources: Record<string, number>;
  isDarkAge: boolean;
}

interface EpochSnapshot {
  epoch: number;
  teams: SnapshotTeam[];
}

export interface ReplayMapPanelProps {
  snapshot: EpochSnapshot;
}

// ---- Constants ----

// 6 distinct team colors — ordered by position in snapshot.teams array
const TEAM_COLORS = [
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#22c55e", // green
  "#ef4444", // red
  "#a855f7", // purple
  "#22d3ee", // cyan
] as const;

const NEUTRAL_COLOR = "#1c1917"; // stone-900 — unowned territory
const NEUTRAL_BORDER = "#44403c"; // stone-700

// ---- Territory Computation ----

interface TeamInfo {
  teamIdx: number;
  teamName: string;
  color: string;
}

function computeTerritory(snapshot: EpochSnapshot): Map<number, TeamInfo> {
  const territory = new Map<number, TeamInfo>();

  // Step 1 — assign home regions (regionId from snapshot, fallback to index+1 for old data)
  snapshot.teams.forEach((team, idx) => {
    const rid = team.regionId ?? idx + 1;
    territory.set(rid, {
      teamIdx: idx,
      teamName: team.teamName,
      color: TEAM_COLORS[idx % TEAM_COLORS.length],
    });
  });

  // Step 2 — expansion via reach resource
  // Pool of unclaimed regions — regions 7-12 first (natural expansion zones)
  const expansionPool = [7, 8, 9, 10, 11, 12].filter((rid) => !territory.has(rid));
  // Then any other regions not yet claimed (edge case with more than 6 teams)
  for (let rid = 1; rid <= 12; rid++) {
    if (!territory.has(rid) && !expansionPool.includes(rid)) {
      expansionPool.push(rid);
    }
  }

  // Sort teams by reach (high reach = expands first)
  const sorted = snapshot.teams
    .map((team, idx) => ({ team, idx, reach: team.resources.reach ?? 0 }))
    .sort((a, b) => b.reach - a.reach);

  for (const { team, idx, reach } of sorted) {
    const expansions = Math.floor(reach / 80);
    for (let e = 0; e < expansions && expansionPool.length > 0; e++) {
      const rid = expansionPool.shift()!;
      territory.set(rid, {
        teamIdx: idx,
        teamName: team.teamName,
        color: TEAM_COLORS[idx % TEAM_COLORS.length],
      });
    }
  }

  return territory;
}

// ---- Region Legend ----

function TerritoryLegend({
  teams,
  territory,
}: {
  teams: SnapshotTeam[];
  territory: Map<number, TeamInfo>;
}) {
  // Count controlled regions per team
  const controlCounts = new Map<string, number>();
  territory.forEach((info) => {
    controlCounts.set(info.teamName, (controlCounts.get(info.teamName) ?? 0) + 1);
  });

  return (
    <div className="absolute bottom-4 right-4 z-[500] rounded-xl border border-stone-700 bg-stone-950/90 p-3 backdrop-blur-sm">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Territory</p>
      <div className="space-y-1.5">
        {teams.map((team, idx) => {
          const count = controlCounts.get(team.teamName) ?? 0;
          const color = TEAM_COLORS[idx % TEAM_COLORS.length];
          return (
            <div key={team.teamId} className="flex items-center gap-2">
              <div
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="min-w-0 text-xs text-stone-300 truncate">{team.teamName}</span>
              <span className="shrink-0 text-xs font-bold text-stone-400">×{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Main Component ----

export default function ReplayMapPanel({ snapshot }: ReplayMapPanelProps) {
  const territory = useMemo(() => computeTerritory(snapshot), [snapshot]);

  // Build one GeoJSON Feature per region
  const geoJsonData = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: regionsData.map((region) => ({
        type: "Feature" as const,
        properties: {
          id: region.id,
          name: region.name,
        },
        geometry: region.geojson,
      })),
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-stone-700">
      <MapContainer
        // World view, slightly tilted toward populated regions
        center={[20, 10]}
        zoom={2}
        minZoom={1}
        maxZoom={5}
        style={{ height: "480px", width: "100%", background: "#0c0a09" }}
        scrollWheelZoom={false}
        worldCopyJump={false}
        maxBounds={[[-90, -210], [90, 210]]}
      >
        {/* CartoDB dark tile layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Territory polygons */}
        <GeoJSON
          key={snapshot.epoch} // re-render when epoch changes
          data={geoJsonData}
          style={(feature) => {
            if (!feature) return {};
            const regionId = feature.properties?.id as number;
            const owner = territory.get(regionId);
            if (owner) {
              return {
                fillColor: owner.color,
                fillOpacity: 0.45,
                color: owner.color,
                weight: 2,
                opacity: 0.8,
              };
            }
            return {
              fillColor: NEUTRAL_COLOR,
              fillOpacity: 0.2,
              color: NEUTRAL_BORDER,
              weight: 1,
              opacity: 0.5,
            };
          }}
          onEachFeature={(feature, layer) => {
            const regionId = feature.properties?.id as number;
            const name = feature.properties?.name as string;
            const owner = territory.get(regionId);
            const tooltipContent = owner
              ? `<strong style="color:${owner.color}">${owner.teamName}</strong><br/><span style="color:#a8a29e">${name}</span>`
              : `<span style="color:#78716c">${name}</span><br/><span style="color:#57534e">Unclaimed</span>`;
            layer.bindTooltip(tooltipContent, {
              permanent: false,
              direction: "center",
              className: "!bg-stone-900 !border-stone-700 !text-stone-200 !text-xs !rounded-lg !shadow-xl",
            });
          }}
        />
      </MapContainer>

      {/* Legend overlay */}
      <TerritoryLegend teams={snapshot.teams} territory={territory} />

      {/* Epoch badge */}
      <div className="absolute left-3 top-3 z-[500] rounded-lg bg-stone-950/90 px-3 py-1.5 backdrop-blur-sm">
        <span className="text-xs font-bold text-amber-400">EPOCH {snapshot.epoch}</span>
        <span className="ml-2 text-xs text-stone-500">Territory</span>
      </div>
    </div>
  );
}
