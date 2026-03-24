// ============================================
// RegionSelectCard — Starting region selection during login step
// The Architect picks which of the 12 geographic regions their team
// will start in. Other teams' choices are shown in real time.
// Non-architects see a "waiting for your Architect" view.
// ============================================

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { RoleName } from "@/types/database";

// Each region has a display name, terrain summary, and geographic hint
const REGION_INFO: Record<number, { name: string; area: string; terrain: string; emoji: string; tip: string }> = {
  1:  { name: "Pacific Northwest",       area: "Alaska & Cascadia",          terrain: "coastal / forest",    emoji: "🌲", tip: "Salmon-rich coasts and dense rainforest — resilient and productive" },
  2:  { name: "Eastern North America",   area: "Great Lakes & Atlantic",     terrain: "plains / river",      emoji: "🌊", tip: "Major river systems and fertile plains — ideal for trade networks" },
  3:  { name: "Mesoamerica",             area: "Mexico & Central America",   terrain: "jungle / highland",   emoji: "🌿", tip: "The birthplace of maize — jungle civilizations with deep legacy" },
  4:  { name: "Caribbean & Orinoco",     area: "N. South America",           terrain: "coastal / jungle",    emoji: "⛵", tip: "Island chains and river deltas rich in reach and trade" },
  5:  { name: "South America",           area: "Andes & Pampas",             terrain: "mountain / plains",   emoji: "⛰️", tip: "High Andes fortresses and vast grasslands for expansion" },
  6:  { name: "Mediterranean Europe",    area: "Italy, Greece & Iberia",     terrain: "coastal / plains",    emoji: "🏛", tip: "Cradle of Western civilization — trade, culture, and legacy" },
  7:  { name: "Northern Europe",         area: "Scandinavia & British Isles",terrain: "coastal / tundra",    emoji: "🧊", tip: "Seafaring raiders and traders — high resilience, low food" },
  8:  { name: "Middle East & N. Africa", area: "Nile, Tigris & Arabia",      terrain: "river / desert",      emoji: "🌙", tip: "First cities rose here — river valleys in a desert landscape" },
  9:  { name: "Sub-Saharan Africa",      area: "Sahel, Congo & East Africa", terrain: "jungle / plains",     emoji: "🦁", tip: "Vast continent, rich in food and legacy — hard to conquer" },
  10: { name: "Central Asia",            area: "Steppe, Siberia & Caucasus", terrain: "steppe / mountain",   emoji: "🐎", tip: "The great Eurasian heartland — mobile and militaristic" },
  11: { name: "South & East Asia",       area: "India & China",              terrain: "river / plains",      emoji: "🌾", tip: "Most populous regions — food surplus drives population booms" },
  12: { name: "East Asia & Pacific",     area: "Japan, Indonesia & Pacific", terrain: "coastal / jungle",    emoji: "🌊", tip: "Island civilizations with sea reach — spread across the ocean" },
};

// Lazy-load the Leaflet map (SSR-unsafe)
const RegionPickerMap = dynamic(() => import("./RegionPickerMap"), { ssr: false });

interface TeamRegionStatus {
  teamId: string;
  teamName: string;
  regionId: number;  // 0 = not yet chosen
  color: string;
  isMyTeam: boolean;
}

interface RegionSelectCardProps {
  gameId: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  role: RoleName;
  accessibleRoles: RoleName[];
  onRegionChosen: (regionId: number) => void;   // fires after success so parent re-fetches
}

export default function RegionSelectCard({
  gameId,
  teamId,
  teamName,
  teamColor,
  role,
  accessibleRoles,
  onRegionChosen,
}: RegionSelectCardProps) {
  const [allTeams, setAllTeams] = useState<TeamRegionStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);

  const isArchitect = accessibleRoles.includes("architect");

  // Fetch all teams + their current region choices
  async function fetchTeams() {
    try {
      const res = await fetch(`/api/games/${gameId}/map-data`);
      if (!res.ok) return;
      const data = await res.json();
      const teams: TeamRegionStatus[] = (data.teams ?? []).map(
        (t: { id: string; name: string; region_id: number }) => ({
          teamId: t.id,
          teamName: t.name,
          regionId: t.region_id ?? 0,
          color: "", // will be assigned client-side
          isMyTeam: t.id === teamId,
        })
      );
      setAllTeams(teams);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, teamId]);

  async function claimRegion(regionId: number) {
    if (!isArchitect || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameId}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region_id: regionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to claim region");
      } else {
        onRegionChosen(regionId);
      }
    } finally {
      setLoading(false);
    }
  }

  const myTeam = allTeams.find((t) => t.isMyTeam);
  const myRegionId = myTeam?.regionId ?? 0;
  const claimedRegions = new Map<number, string>(); // regionId → teamName
  for (const t of allTeams) {
    if (t.regionId > 0) claimedRegions.set(t.regionId, t.teamName);
  }
  const totalChosen = [...claimedRegions.values()].length;
  const totalTeams = allTeams.length;

  const infoRegion = hoveredRegion ?? myRegionId ?? null;

  return (
    <div className="space-y-4 rounded-xl border border-amber-700/40 bg-amber-950/20 p-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-amber-300">🌍 Choose Your Starting Region</h2>
        <p className="mt-0.5 text-sm text-stone-400">
          {isArchitect
            ? "As Architect, click a region on the map or from the list below to claim it for your team. Your teammates can see your choice."
            : `Your Architect will pick your team's starting region. Watch the map!`}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-stone-400">
          <span className="rounded bg-stone-800 px-2 py-0.5">{totalChosen}/{totalTeams} teams have chosen</span>
          {myRegionId > 0 && (
            <span className="rounded bg-green-900/60 px-2 py-0.5 text-green-300">
              ✓ Your team: {REGION_INFO[myRegionId]?.name}
            </span>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-xl border border-stone-800" style={{ height: 320 }}>
        <RegionPickerMap
          allTeams={allTeams}
          myTeamId={teamId}
          myTeamColor={teamColor}
          claimedRegions={claimedRegions}
          isArchitect={isArchitect}
          onRegionHover={setHoveredRegion}
          onRegionClick={claimRegion}
          loading={loading}
        />
      </div>

      {/* Hover / selection info panel */}
      {infoRegion !== null && infoRegion > 0 && REGION_INFO[infoRegion] && (
        <div className="rounded-lg border border-stone-700 bg-stone-900/60 p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">{REGION_INFO[infoRegion].emoji}</span>
            <div>
              <div className="font-bold text-stone-100">{REGION_INFO[infoRegion].name}</div>
              <div className="text-xs text-stone-400">{REGION_INFO[infoRegion].area} · {REGION_INFO[infoRegion].terrain}</div>
            </div>
            {claimedRegions.has(infoRegion) && !allTeams.find((t) => t.isMyTeam && t.regionId === infoRegion) && (
              <span className="ml-auto rounded bg-red-900/40 px-2 py-0.5 text-xs text-red-300">
                Taken by {claimedRegions.get(infoRegion)}
              </span>
            )}
            {isArchitect && !claimedRegions.has(infoRegion) && infoRegion !== myRegionId && (
              <button
                onClick={() => claimRegion(infoRegion)}
                disabled={loading}
                className="ml-auto rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {loading ? "Claiming…" : "Claim This Region"}
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-stone-400">💡 {REGION_INFO[infoRegion].tip}</p>
        </div>
      )}

      {/* Grid of all regions */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(REGION_INFO).map(([idStr, info]) => {
          const id = parseInt(idStr, 10);
          const claimed = claimedRegions.get(id);
          const isMine = myRegionId === id;
          const isAvailable = !claimed;

          return (
            <button
              key={id}
              disabled={!!claimed || loading || !isArchitect}
              onClick={() => claimRegion(id)}
              onMouseEnter={() => setHoveredRegion(id)}
              onMouseLeave={() => setHoveredRegion(null)}
              className={`rounded-lg border p-2 text-left text-xs transition ${
                isMine
                  ? "border-amber-500 bg-amber-900/40 text-amber-200"
                  : claimed
                  ? "border-stone-700 bg-stone-900/30 text-stone-600 cursor-not-allowed"
                  : isArchitect
                  ? "border-stone-600 bg-stone-900/40 text-stone-300 hover:border-amber-600 hover:bg-amber-900/20 hover:text-amber-200 cursor-pointer"
                  : "border-stone-700 bg-stone-900/30 text-stone-400 cursor-default"
              }`}
            >
              <span className="text-base">{info.emoji}</span>
              <div className="mt-0.5 font-semibold leading-tight">{info.name}</div>
              <div className="mt-0.5 text-stone-500 leading-tight">{info.area}</div>
              {isMine && <div className="mt-1 font-bold text-amber-400">✓ Your choice</div>}
              {claimed && !isMine && <div className="mt-1 text-red-400/80">↳ {claimed}</div>}
              {isAvailable && !isMine && isArchitect && (
                <div className="mt-1 text-green-500/70">Available</div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      {myRegionId > 0 && (
        <div className="rounded-lg border border-green-700/50 bg-green-900/20 p-3 text-sm text-green-300">
          ✅ <strong>{teamName}</strong> has chosen <strong>{REGION_INFO[myRegionId]?.name}</strong>.{" "}
          {isArchitect
            ? "Wait for the other teams to choose, then your teacher will start the game."
            : "Your Architect has locked in your starting region. Get ready!"}
        </div>
      )}
    </div>
  );
}
