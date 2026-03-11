// ============================================================
// FoundingMap — standalone Leaflet map for the city-founding
// screen. Uses FoundingMapLayer (actual country polygons)
// instead of the rectangular SubZoneLayer.
//
// Must be loaded with dynamic({ ssr: false }) — see
// FoundingMapWrapper.tsx.
// ============================================================

"use client";

import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import FoundingMapLayer from "./FoundingMapLayer";

const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

interface SubZoneSummary {
  id: string;
  name: string;
  terrain_type: string;
  yield_modifier: number;
}

interface FoundingMapProps {
  subZones: SubZoneSummary[];
  selectedSubZoneId?: string | null;
  onSubZoneClick?: (sz: SubZoneSummary) => void;
  className?: string;
}

export default function FoundingMap({
  subZones,
  selectedSubZoneId,
  onSubZoneClick,
  className = "",
}: FoundingMapProps) {
  return (
    <MapContainer
      center={[20, 10]}
      zoom={2}
      minZoom={2}
      maxZoom={7}
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
      <FoundingMapLayer
        subZones={subZones}
        selectedSubZoneId={selectedSubZoneId}
        onSubZoneClick={onSubZoneClick}
      />
    </MapContainer>
  );
}
