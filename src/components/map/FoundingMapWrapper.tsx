// Dynamic import wrapper — Leaflet requires browser APIs (no SSR).
// All parent components import FROM HERE, not from FoundingMap directly.

"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type FoundingMap from "./FoundingMap";

const FoundingMapDynamic = dynamic(() => import("./FoundingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-900 rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <span className="text-sm text-gray-400">Loading world map…</span>
      </div>
    </div>
  ),
});

export default function FoundingMapWrapper(
  props: ComponentProps<typeof FoundingMap>
) {
  return <FoundingMapDynamic {...props} />;
}
