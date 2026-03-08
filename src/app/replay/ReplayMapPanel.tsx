// ============================================
// ReplayMapPanel — Territory map for replay viewer
// Fetches real world country GeoJSON from CDN,
// maps ISO A2 country codes → 12 game regions,
// colors by team ownership each epoch.
// Reach resource drives expansion into regions 7-12.
// ============================================

"use client";

import { useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
// @ts-expect-error - leaflet internal
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

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

// ---- Region names ----

const REGION_NAMES: Record<number, string> = {
  1: "Alaska + W. Canada",
  2: "E. Canada + Eastern US",
  3: "Mexico + Central America",
  4: "Caribbean + N. South America",
  5: "Southern South America",
  6: "W. Europe + Mediterranean",
  7: "N. Europe + British Isles",
  8: "N. Africa + Middle East",
  9: "Sub-Saharan Africa",
  10: "Russia + Central Asia",
  11: "South + East Asia",
  12: "Pacific + Japan + Australia",
};

// ISO A2 country code → region ID (1–12)
const COUNTRY_REGION: Record<string, number> = {
  // Region 1 — Alaska + Western Canada
  CA: 1, GL: 1,

  // Region 2 — Eastern US
  US: 2, PM: 2,

  // Region 3 — Mexico + Central America + Caribbean
  MX: 3, GT: 3, BZ: 3, HN: 3, SV: 3, NI: 3, CR: 3, PA: 3,
  CU: 3, JM: 3, HT: 3, DO: 3, PR: 3, TT: 3, BB: 3, LC: 3,
  VC: 3, GD: 3, AG: 3, KN: 3, DM: 3, BS: 3,

  // Region 4 — N. South America
  CO: 4, VE: 4, GY: 4, SR: 4, GF: 4,

  // Region 5 — Southern South America
  BR: 5, AR: 5, CL: 5, PE: 5, BO: 5, PY: 5, UY: 5, EC: 5,

  // Region 6 — W. Europe + Mediterranean
  PT: 6, ES: 6, FR: 6, BE: 6, NL: 6, LU: 6, DE: 6, CH: 6,
  AT: 6, IT: 6, MC: 6, SM: 6, VA: 6, MT: 6, GR: 6, CY: 6,
  AL: 6, BA: 6, HR: 6, ME: 6, RS: 6, MK: 6, SI: 6, XK: 6,

  // Region 7 — N. Europe + British Isles
  GB: 7, IE: 7, IS: 7, NO: 7, SE: 7, DK: 7, FI: 7,
  EE: 7, LV: 7, LT: 7, PL: 7, CZ: 7, SK: 7, HU: 7,
  RO: 7, BG: 7, MD: 7, UA: 7, BY: 7,

  // Region 8 — N. Africa + Middle East
  MA: 8, DZ: 8, TN: 8, LY: 8, EG: 8, MR: 8, SD: 8,
  ER: 8, ET: 8, DJ: 8, SO: 8,
  TR: 8, SY: 8, LB: 8, IL: 8, PS: 8, JO: 8, IQ: 8,
  SA: 8, KW: 8, QA: 8, BH: 8, AE: 8, YE: 8, OM: 8, IR: 8,

  // Region 9 — Sub-Saharan Africa
  ML: 9, NE: 9, TD: 9, CF: 9, NG: 9, CM: 9, GQ: 9, GA: 9,
  CG: 9, CD: 9, SN: 9, GM: 9, GW: 9, GN: 9, SL: 9, LR: 9,
  CI: 9, GH: 9, TG: 9, BJ: 9, BF: 9,
  RW: 9, BI: 9, UG: 9, KE: 9, TZ: 9, MZ: 9, ZM: 9, MW: 9,
  ZW: 9, AO: 9, NA: 9, BW: 9, ZA: 9, LS: 9, SZ: 9,
  MG: 9, MU: 9, KM: 9, SC: 9,

  // Region 10 — Russia + Central Asia
  RU: 10, KZ: 10, UZ: 10, TM: 10, TJ: 10, KG: 10,
  MN: 10, GE: 10, AM: 10, AZ: 10, AF: 10, PK: 10,

  // Region 11 — South + East Asia
  IN: 11, NP: 11, BD: 11, LK: 11, BT: 11, MM: 11,
  TH: 11, LA: 11, VN: 11, KH: 11, MY: 11, SG: 11,
  ID: 11, TL: 11, PH: 11, CN: 11, KP: 11, KR: 11,
  TW: 11, HK: 11, MO: 11,

  // Region 12 — Pacific + Japan + Australia
  JP: 12, AU: 12, NZ: 12, PG: 12, FJ: 12, SB: 12,
  VU: 12, TO: 12, WS: 12, KI: 12, FM: 12, PW: 12,
  MH: 12, NR: 12, TV: 12,
};

// ---- Team colors ----

const TEAM_COLORS = [
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#22c55e", // green
  "#ef4444", // red
  "#a855f7", // purple
  "#22d3ee", // cyan
] as const;

// ---- Territory computation ----

interface TeamInfo {
  teamIdx: number;
  teamName: string;
  color: string;
}

function computeTerritory(snapshot: EpochSnapshot): Map<number, TeamInfo> {
  const territory = new Map<number, TeamInfo>();

  snapshot.teams.forEach((team, idx) => {
    const rid = team.regionId ?? idx + 1;
    territory.set(rid, {
      teamIdx: idx,
      teamName: team.teamName,
      color: TEAM_COLORS[idx % TEAM_COLORS.length],
    });
  });

  // Expansion pool — unowned regions 7–12 first
  const pool: number[] = [];
  for (let rid = 7; rid <= 12; rid++) {
    if (!territory.has(rid)) pool.push(rid);
  }
  for (let rid = 1; rid <= 6; rid++) {
    if (!territory.has(rid)) pool.push(rid);
  }

  const sorted = snapshot.teams
    .map((team, idx) => ({ team, idx, reach: team.resources.reach ?? 0 }))
    .sort((a, b) => b.reach - a.reach);

  for (const { team, idx, reach } of sorted) {
    const expansions = Math.floor(reach / 80);
    for (let e = 0; e < expansions && pool.length > 0; e++) {
      const rid = pool.shift()!;
      territory.set(rid, {
        teamIdx: idx,
        teamName: team.teamName,
        color: TEAM_COLORS[idx % TEAM_COLORS.length],
      });
    }
  }

  return territory;
}

// ---- Legend ----

function TerritoryLegend({ teams, territory }: { teams: SnapshotTeam[]; territory: Map<number, TeamInfo> }) {
  const counts = new Map<string, number>();
  territory.forEach((info) => {
    counts.set(info.teamName, (counts.get(info.teamName) ?? 0) + 1);
  });

  return (
    <div className="absolute bottom-4 right-4 z-[500] rounded-xl border border-stone-700 bg-stone-950/90 p-3 backdrop-blur-sm">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Territory</p>
      <div className="space-y-1.5">
        {teams.map((team, idx) => {
          const color = TEAM_COLORS[idx % TEAM_COLORS.length];
          const count = counts.get(team.teamName) ?? 0;
          return (
            <div key={team.teamId} className="flex items-center gap-2">
              <div className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
              <span className="min-w-0 flex-1 truncate text-xs text-stone-300">{team.teamName}</span>
              <span className="shrink-0 rounded bg-stone-800 px-1.5 text-xs font-bold" style={{ color }}>
                ×{count}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-stone-600">🧭 reach ÷ 80 = expansions</p>
    </div>
  );
}

// ---- Main component ----

export default function ReplayMapPanel({ snapshot }: ReplayMapPanelProps) {
  const [worldGeoJson, setWorldGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    fetch("/data/countries.geojson")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data) => {
        // Log first feature's property keys once to confirm format
        const firstProps = data?.features?.[0]?.properties;
        if (firstProps) console.log("[MapPanel] GeoJSON keys:", Object.keys(firstProps));
        setWorldGeoJson(data);
      })
      .catch(() => setGeoError(true));
  }, []);

  const territory = useMemo(() => computeTerritory(snapshot), [snapshot]);

  // Normalise properties — this GeoJSON uses "ISO3166-1-Alpha-2" and "name"
  const getIso = (props: Record<string, string>) =>
    props?.["ISO3166-1-Alpha-2"] ?? props?.ISO_A2 ?? props?.iso_a2 ?? "";
  const getName = (props: Record<string, string>) =>
    props?.name ?? props?.ADMIN ?? props?.NAME ?? props?.SOVEREIGNT ?? "";

  const styleFeature = (feature?: GeoJSON.Feature) => {
    if (!feature) return {};
    const props = feature.properties as Record<string, string>;
    const iso = getIso(props);
    const regionId = COUNTRY_REGION[iso];
    const owner = regionId ? territory.get(regionId) : undefined;
    if (owner) {
      return { fillColor: owner.color, fillOpacity: 0.5, color: owner.color, weight: 1, opacity: 0.8 };
    }
    return { fillColor: "#1c1917", fillOpacity: 0.7, color: "#44403c", weight: 0.5, opacity: 0.6 };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const props = feature.properties as Record<string, string>;
    const iso = getIso(props);
    const countryName = getName(props) || iso || "Unknown";
    const regionId = COUNTRY_REGION[iso];
    const owner = regionId ? territory.get(regionId) : undefined;
    const regionName = regionId ? REGION_NAMES[regionId] : null;

    const html = owner
      ? `<div style="font-weight:bold;color:${owner.color}">${owner.teamName}</div>
         <div style="color:#a8a29e;font-size:11px">${regionName}</div>
         <div style="color:#78716c;font-size:11px">${countryName}</div>`
      : `<div style="color:#a8a29e">${countryName}</div>
         <div style="color:#57534e;font-size:11px">Unclaimed</div>`;

    (layer as L.Path).bindTooltip(html, {
      sticky: true,
      direction: "top",
      className: "leaflet-tooltip-dark",
    });

    (layer as L.Path).on({
      mouseover(e) {
        const l = e.target as L.Path;
        l.setStyle(owner
          ? { fillOpacity: 0.8, weight: 2, color: owner.color }
          : { fillOpacity: 0.9 });
        l.bringToFront();
      },
      mouseout(e) {
        (e.target as L.Path).setStyle(styleFeature(feature));
      },
    });
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-stone-700">
      <MapContainer
        center={[20, 15]}
        zoom={2}
        minZoom={1}
        maxZoom={6}
        style={{ height: "520px", width: "100%", background: "#0c0a09" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; OSM contributors &copy; CARTO'
          subdomains="abcd"
          maxZoom={20}
        />

        {worldGeoJson && (
          <GeoJSON
            key={snapshot.epoch}
            data={worldGeoJson}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Loading / error overlay — inside the map div but outside MapContainer */}
      {!worldGeoJson && !geoError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="animate-pulse rounded-lg bg-stone-950/80 px-4 py-2 text-sm text-stone-400">
            Loading world map…
          </p>
        </div>
      )}
      {geoError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg bg-stone-950/80 px-4 py-2 text-sm text-red-400">
            Could not load world map
          </p>
        </div>
      )}

      <TerritoryLegend teams={snapshot.teams} territory={territory} />

      <div className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-lg bg-stone-950/90 px-3 py-1.5 backdrop-blur-sm">
        <span className="text-xs font-bold text-amber-400">EPOCH {snapshot.epoch}</span>
        <span className="text-xs text-stone-600">|</span>
        <span className="text-xs text-stone-500">Territory</span>
      </div>

      <style>{`
        .leaflet-tooltip-dark {
          background: #1c1917 !important;
          border: 1px solid #44403c !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.6) !important;
          color: #e7e5e4 !important;
          font-size: 12px !important;
          line-height: 1.5 !important;
        }
        .leaflet-tooltip-dark::before { display: none !important; }
      `}</style>
    </div>
  );
}
