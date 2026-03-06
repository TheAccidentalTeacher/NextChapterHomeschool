"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type GameMapComponent from "./GameMap";

/**
 * Dynamic import wrapper for Leaflet — SSR-safe.
 * Leaflet requires `window` which doesn't exist during SSR.
 */
const GameMap = dynamic(() => import("./GameMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="text-sm text-gray-400">Loading map…</span>
      </div>
    </div>
  ),
});

export type MapWrapperProps = ComponentProps<typeof GameMapComponent>;

export default function MapWrapper(props: MapWrapperProps) {
  return <GameMap {...props} />;
}
