// ============================================
// GameMap — Interactive Leaflet map component
// Decision 82: CartoDB dark tiles, region-based fog-of-war
// Decision 87: Sub-zone territories with GeoJSON boundaries
//
// Renders the world map using react-leaflet with:
//   - CartoDB Dark Matter tile layer
//   - SubZoneLayer: GeoJSON polygons colored by team ownership
//   - MarkerLayer: unit/building icons per sub-zone
//   - FogState: hidden/revealed per sub-zone
//   - Click handler for sub-zone selection
//
// Uses dynamic import (ssr: false) in all parent components
// because Leaflet requires browser APIs (window, document).
// ============================================

"use client";

import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import SubZoneLayer from "./SubZoneLayer";
import MarkerLayer from "./MarkerLayer";
import RegionLayer, { type TeamRegion } from "./RegionLayer";

export interface SubZoneData {
  id: string;
  name: string;
  region_id: number;
  terrain_type: string;
  geojson: GeoJSON.Geometry;
  yield_modifier: number;
  controlled_by_team_id?: string | null;
  soil_fertility?: number;
  wildlife_stock?: number;
  settlement_name?: string | null;
  buildings?: string[];
}

export interface TeamColor {
  teamId: string;
  color: string;
  name: string;
}

export interface FogEntry {
  sub_zone_id: string;
  state: "hidden" | "revealed";
}

export interface MapMarker {
  id: string;
  type: "scout" | "soldier" | "merchant" | "builder" | "farm" | "barracks" | "market" | "library" | "walls" | "aqueduct" | "granary";
  subZoneId: string;
  teamId: string;
  count: number;
}

export type { TeamRegion };

export interface GameMapProps {
  subZones: SubZoneData[];
  teamColors: TeamColor[];
  teamRegions?: TeamRegion[];
  fogState?: FogEntry[];
  markers?: MapMarker[];
  onSubZoneClick?: (subZone: SubZoneData) => void;
  showFog?: boolean;
  className?: string;
}

/** CartoDB dark tiles for the game aesthetic */
const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

export default function GameMap({
  subZones,
  teamColors,
  teamRegions,
  fogState,
  markers = [],
  onSubZoneClick,
  showFog = true,
  className = "",
}: GameMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={8}
      zoomControl={false}
      className={`h-full w-full ${className}`}
      style={{ background: "#0a0a0a" }}
      maxBounds={[
        [-85, -200],
        [85, 200],
      ]}
      maxBoundsViscosity={1.0}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <ZoomControl position="bottomright" />

      {teamRegions && teamRegions.length > 0 && (
        <RegionLayer teamRegions={teamRegions} />
      )}

      <SubZoneLayer
        subZones={subZones}
        teamColors={teamColors}
        fogState={fogState}
        showFog={showFog}
        onSubZoneClick={onSubZoneClick}
      />

      <MarkerLayer markers={markers} teamColors={teamColors} />
    </MapContainer>
  );
}
