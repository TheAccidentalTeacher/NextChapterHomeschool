// ============================================
// RegionSelectCard — Risk-style starting draft during login step
//
// Flow each team's turn (in draft_order):
//   1. Architect enters civilization name
//   2. Architect claims a starting region on the world map
//
// Non-active teams watch a live turn queue.
// Non-architects on the active team see prompts to talk to their Architect.
// ============================================

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { RoleName } from "@/types/database";

// Each region has a display name, terrain summary, pros, cons, and geographic hint
const REGION_INFO: Record<number, {
  name: string; area: string; terrain: string; emoji: string; tip: string;
  pros: string[]; cons: string[];
}> = {
  1:  { name: "Pacific Northwest",       area: "Alaska & Cascadia",           terrain: "coastal / forest",    emoji: "🌲",
        tip: "Salmon-rich coasts and dense rainforest — resilient and productive",
        pros: ["High food from fishing & forests", "Strong natural resilience", "Defensible coastline"],
        cons: ["Isolated — hard to reach other civs", "Limited flat land for expansion", "Cold winters reduce growth"] },
  2:  { name: "Eastern North America",   area: "Great Lakes & Atlantic",      terrain: "plains / river",      emoji: "🌊",
        tip: "Major river systems and fertile plains — ideal for trade networks",
        pros: ["Excellent river trade routes", "Fertile plains for food growth", "Central location for alliances"],
        cons: ["Few natural barriers — easy to invade", "Prone to conflict with neighbors", "Moderate resources, nothing exceptional"] },
  3:  { name: "Mesoamerica",             area: "Mexico & Central America",    terrain: "jungle / highland",   emoji: "🌿",
        tip: "The birthplace of maize — jungle civilizations with deep legacy",
        pros: ["Maize agriculture — huge food potential", "Strong legacy & cultural identity", "Highland fortresses are defensible"],
        cons: ["Dense jungle slows expansion", "Disease reduces resilience", "Difficult terrain limits trade reach"] },
  4:  { name: "Caribbean & Orinoco",     area: "N. South America",            terrain: "coastal / jungle",    emoji: "⛵",
        tip: "Island chains and river deltas rich in reach and trade",
        pros: ["Best sea trade reach in the Americas", "River deltas provide food", "Island chains are hard to conquer"],
        cons: ["Vulnerable to storms and raids", "Fragmented territory limits land expansion", "Low production resources"] },
  5:  { name: "South America",           area: "Andes & Pampas",              terrain: "mountain / plains",   emoji: "⛰️",
        tip: "High Andes fortresses and vast grasslands for expansion",
        pros: ["Andes mountains are near-impenetrable defense", "Vast pampas for expansion and food", "Isolated from Old World conflicts"],
        cons: ["Mountains block trade routes", "Far from other civilizations — low diplomatic reach", "Hard to move armies quickly"] },
  6:  { name: "Mediterranean Europe",    area: "Italy, Greece & Iberia",      terrain: "coastal / plains",    emoji: "🏛",
        tip: "Cradle of Western civilization — trade, culture, and legacy",
        pros: ["Best trade reach of any region", "High legacy — great for culture victories", "Cross-roads of three continents"],
        cons: ["Central location means everyone is your neighbor (and rival)", "Contested — other teams may target you", "Requires active diplomacy to survive"] },
  7:  { name: "Northern Europe",         area: "Scandinavia & British Isles", terrain: "coastal / tundra",    emoji: "🧊",
        tip: "Seafaring raiders and traders — high resilience, low food",
        pros: ["Exceptional sea reach for raids and trade", "High resilience — hard to conquer", "Isolated islands are defensible"],
        cons: ["Very low food — population growth is slow", "Cold tundra limits production", "Distance makes alliances hard"] },
  8:  { name: "Middle East & N. Africa", area: "Nile, Tigris & Arabia",       terrain: "river / desert",      emoji: "🌙",
        tip: "First cities rose here — river valleys in a desert landscape",
        pros: ["River valleys give strong food + legacy", "Historically first to urbanize — head start on tech", "Controls trade routes between continents"],
        cons: ["Desert surrounds your rivers — limited expansion", "Surrounded by rivals on all sides", "Droughts can devastate food supply"] },
  9:  { name: "Sub-Saharan Africa",      area: "Sahel, Congo & East Africa",  terrain: "jungle / plains",     emoji: "🦁",
        tip: "Vast continent, rich in food and legacy — hard to conquer",
        pros: ["Enormous territory — room for expansion", "Rich food in jungle and savanna", "Difficult to invade — natural barriers everywhere"],
        cons: ["Sahara desert cuts off northern trade", "Jungle slows movement", "Low production in early epochs"] },
  10: { name: "Central Asia",            area: "Steppe, Siberia & Caucasus",  terrain: "steppe / mountain",   emoji: "🐎",
        tip: "The great Eurasian heartland — mobile and militaristic",
        pros: ["Best military mobility — steppe cavalry range", "Controls the land bridge between East and West", "Mountain borders are easily defended"],
        cons: ["Very low food and legacy", "Harsh climate reduces resilience", "Distance from coasts limits trade reach"] },
  11: { name: "South & East Asia",       area: "India & China",               terrain: "river / plains",      emoji: "🌾",
        tip: "Most populous regions — food surplus drives population booms",
        pros: ["Highest food potential of any region", "Population booms fuel production and expansion", "River plains support dense cities"],
        cons: ["Monsoon floods can wipe food stores", "Hard to defend — large borders everywhere", "Neighbors are powerful and numerous"] },
  12: { name: "East Asia & Pacific",     area: "Japan, Indonesia & Pacific",  terrain: "coastal / jungle",    emoji: "🌊",
        tip: "Island civilizations with sea reach — spread across the ocean",
        pros: ["Islands are nearly impossible to invade", "Wide sea reach — can trade with everyone", "Jungle resources are abundant"],
        cons: ["Low production on island terrain", "Isolated — hard to form land alliances", "Typhoons can devastate coastal settlements"] },
};

// Lazy-load the Leaflet map (SSR-unsafe)
const RegionPickerMap = dynamic(() => import("./RegionPickerMap"), { ssr: false });

interface TeamDraftStatus {
  teamId: string;
  teamName: string;           // raw slot name e.g. "Team 3"
  civilizationName: string | null;
  regionId: number;           // 0 = not yet chosen
  draftOrder: number | null;  // null = teacher hasn't randomized yet
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
  onRegionChosen: (regionId: number) => void;
}

const PALETTE = [
  "#ef4444","#f97316","#eab308","#22c55e",
  "#06b6d4","#8b5cf6","#ec4899","#14b8a6",
];

export default function RegionSelectCard({
  gameId,
  teamId,
  teamName,
  teamColor,
  accessibleRoles,
  onRegionChosen,
}: RegionSelectCardProps) {
  const [allTeams, setAllTeams] = useState<TeamDraftStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
  const [pendingRegion, setPendingRegion] = useState<number | null>(null); // selected but not locked in
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const isArchitect = accessibleRoles.includes("architect");

  // ── data fetch ──────────────────────────────────────────────────────────────
  async function fetchTeams() {
    try {
      const res = await fetch(`/api/games/${gameId}/map-data`);
      if (!res.ok) return;
      const data = await res.json();
      const teams: TeamDraftStatus[] = (data.teams ?? []).map(
        (
          t: {
            id: string;
            name: string;
            civilization_name: string | null;
            region_id: number;
            draft_order: number | null;
          },
          i: number
        ) => ({
          teamId: t.id,
          teamName: t.name,
          civilizationName: t.civilization_name,
          regionId: t.region_id ?? 0,
          draftOrder: t.draft_order,
          color: t.id === teamId ? teamColor : PALETTE[i % PALETTE.length],
          isMyTeam: t.id === teamId,
        })
      );
      setAllTeams(teams);
    } catch {
      // ignore network blip
    }
  }

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, teamId]);

  // ── derived state ────────────────────────────────────────────────────────────
  const sortedTeams = [...allTeams].sort((a, b) => {
    if (a.draftOrder == null && b.draftOrder == null) return 0;
    if (a.draftOrder == null) return 1;
    if (b.draftOrder == null) return -1;
    return a.draftOrder - b.draftOrder;
  });

  const myTeamData = allTeams.find((t) => t.isMyTeam);
  const myRegionId = myTeamData?.regionId ?? 0;
  const myHasName = !!(myTeamData?.civilizationName);
  const draftStarted = sortedTeams.some((t) => t.draftOrder != null);

  // Active team = first in draft order that hasn't claimed a region yet
  const activeTeam = draftStarted
    ? sortedTeams.find((t) => t.regionId === 0) ?? null
    : null;
  const isMyTurn = activeTeam?.teamId === teamId;

  // Map for region picker: regionId → display label
  const claimedRegions = new Map<number, string>();
  for (const t of allTeams) {
    if (t.regionId > 0) {
      claimedRegions.set(t.regionId, t.civilizationName ?? t.teamName);
    }
  }

  type Phase = "waiting-start" | "waiting-turn" | "naming" | "picking" | "done";
  const phase: Phase =
    myRegionId > 0  ? "done"
    : !draftStarted ? "waiting-start"
    : !isMyTurn     ? "waiting-turn"
    : !myHasName    ? "naming"
    : "picking";

  const totalDone = sortedTeams.filter((t) => t.regionId > 0).length;
  const totalTeams = sortedTeams.length;
  // Priority: hovered > pending > already-claimed (done view)
  const infoRegion = hoveredRegion ?? pendingRegion ?? (myRegionId > 0 ? myRegionId : null);

  // ── actions ──────────────────────────────────────────────────────────────────
  async function saveName() {
    if (!nameInput.trim() || nameSaving) return;
    setNameSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameId}/teams/${teamId}/name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save name");
      } else {
        setNameInput("");
        await fetchTeams();
      }
    } finally {
      setNameSaving(false);
    }
  }

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

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 rounded-xl border border-amber-700/40 bg-amber-950/20 p-4">

      {/* ── Header ── */}
      <div>
        <h2 className="text-lg font-bold text-amber-300">🌍 Starting Region Draft</h2>
        <p className="mt-0.5 text-sm text-stone-400">
          Teams take turns naming their civilization and choosing their starting region.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-400">
          <span className="rounded bg-stone-800 px-2 py-0.5">
            {totalDone}/{totalTeams} regions chosen
          </span>
          {myRegionId > 0 && (
            <span className="rounded bg-green-900/60 px-2 py-0.5 text-green-300">
              ✓ {myTeamData?.civilizationName ?? teamName}: {REGION_INFO[myRegionId]?.name}
            </span>
          )}
        </div>
      </div>

      {/* ── Turn queue (shown once draft has started) ── */}
      {draftStarted && (
        <div className="rounded-lg border border-stone-700 bg-stone-900/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            Turn Order
          </p>
          <div className="flex flex-wrap gap-2">
            {sortedTeams.map((t, i) => {
              const isActive = t.teamId === activeTeam?.teamId;
              const isDone = t.regionId > 0;
              const label = t.civilizationName ?? t.teamName;
              return (
                <div
                  key={t.teamId}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition ${
                    isDone
                      ? "border-green-800/40 bg-green-900/30 text-green-400"
                      : isActive
                      ? "animate-pulse border-amber-600 bg-amber-900/50 text-amber-200"
                      : "border-stone-700/50 bg-stone-800/50 text-stone-500"
                  }`}
                >
                  <span className="font-bold">{i + 1}.</span>
                  <span>{label}</span>
                  {isDone && (
                    <span className="ml-0.5">
                      {REGION_INFO[t.regionId]?.emoji} {REGION_INFO[t.regionId]?.name}
                    </span>
                  )}
                  {isActive && !isDone && (
                    <span className="ml-0.5 text-amber-400">← picking…</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Phase: waiting for teacher to hit Randomize Order ── */}
      {phase === "waiting-start" && (
        <div className="rounded-lg border border-stone-700 bg-stone-900/40 p-4 text-center">
          <p className="text-sm text-stone-400">
            ⏳ Waiting for your teacher to randomize the turn order…
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Your teacher will click{" "}
            <strong className="text-stone-400">🎲 Randomize Order</strong> in the DM panel to start the draft.
          </p>
        </div>
      )}

      {/* ── Phase: waiting for another team's turn ── */}
      {phase === "waiting-turn" && activeTeam && (
        <div className="rounded-lg border border-stone-700 bg-stone-900/40 p-4 text-center text-sm">
          <p className="text-stone-300">
            Waiting for{" "}
            <strong>{activeTeam.civilizationName ?? activeTeam.teamName}</strong> to
            {!activeTeam.civilizationName ? " name their civilization…" : " pick their region…"}
          </p>
        </div>
      )}

      {/* ── Phase: naming (my turn, no civ name yet) ── */}
      {phase === "naming" && (
        <div className="rounded-lg border border-amber-600/50 bg-amber-900/20 p-4 space-y-3">
          {isArchitect ? (
            <>
              <p className="text-sm font-bold text-amber-300">🏛 Step 1 of 2 — Name your civilization</p>
              <p className="text-xs text-stone-400">
                Discuss with your team, then type your civilization name here.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={40}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  placeholder="e.g. Roman Empire, Aztec Confederation…"
                  className="flex-1 rounded-lg border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={saveName}
                  disabled={nameSaving || !nameInput.trim()}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
                >
                  {nameSaving ? "Saving…" : "Confirm →"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-base font-semibold text-amber-300">🎯 It&apos;s your team&apos;s turn!</p>
              <p className="text-sm text-stone-400">
                Tell your <strong className="text-stone-200">Architect</strong> to name your civilization.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Phase: picking region (my turn, named) ── */}
      {phase === "picking" && (
        <>
          <div className="rounded-lg border border-green-700/50 bg-green-900/10 px-3 py-2 text-sm text-green-300">
            ✓ <strong>{myTeamData?.civilizationName}</strong>
            {isArchitect
              ? " — click a region to preview it, then lock in your choice."
              : " — watch your Architect choose your starting region."}
          </div>

          {/* Map + info panel side by side on larger screens */}
          <div className="grid gap-3 lg:grid-cols-5">

            {/* Map — takes 3 cols */}
            <div className="lg:col-span-3 overflow-hidden rounded-xl border border-stone-800" style={{ height: 300 }}>
              <RegionPickerMap
                allTeams={allTeams}
                myTeamId={teamId}
                myTeamColor={teamColor}
                claimedRegions={claimedRegions}
                isArchitect={isArchitect}
                onRegionHover={setHoveredRegion}
                onRegionClick={(id) => {
                  if (isArchitect && !claimedRegions.has(id)) {
                    setPendingRegion(id);
                  }
                }}
                loading={loading}
              />
            </div>

            {/* Info panel — takes 2 cols */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {infoRegion !== null && infoRegion > 0 && REGION_INFO[infoRegion] ? (
                <div className="flex-1 rounded-xl border border-stone-700 bg-stone-900/70 p-3 text-sm flex flex-col gap-2">
                  {/* Region header */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{REGION_INFO[infoRegion].emoji}</span>
                    <div>
                      <div className="font-bold text-stone-100 leading-tight">{REGION_INFO[infoRegion].name}</div>
                      <div className="text-xs text-stone-400">{REGION_INFO[infoRegion].area}</div>
                      <div className="text-xs text-stone-500 italic">{REGION_INFO[infoRegion].terrain}</div>
                    </div>
                    {claimedRegions.has(infoRegion) && (
                      <span className="ml-auto rounded bg-red-900/50 px-2 py-0.5 text-xs text-red-300 whitespace-nowrap">
                        Taken by {claimedRegions.get(infoRegion)}
                      </span>
                    )}
                    {pendingRegion === infoRegion && !claimedRegions.has(infoRegion) && isArchitect && (
                      <span className="ml-auto rounded bg-amber-800/60 px-2 py-0.5 text-xs text-amber-300 whitespace-nowrap">
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Pros */}
                  <div>
                    <p className="text-xs font-semibold text-green-400 mb-1">✅ Advantages</p>
                    <ul className="space-y-0.5">
                      {REGION_INFO[infoRegion].pros.map((p, i) => (
                        <li key={i} className="text-xs text-stone-300 flex gap-1.5">
                          <span className="text-green-500 shrink-0">+</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-1">⚠️ Disadvantages</p>
                    <ul className="space-y-0.5">
                      {REGION_INFO[infoRegion].cons.map((c, i) => (
                        <li key={i} className="text-xs text-stone-300 flex gap-1.5">
                          <span className="text-red-500 shrink-0">−</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-stone-500 italic border-t border-stone-800 pt-2">
                    💡 {REGION_INFO[infoRegion].tip}
                  </p>
                </div>
              ) : (
                <div className="flex-1 rounded-xl border border-stone-800 bg-stone-900/40 p-4 flex items-center justify-center text-center">
                  <p className="text-xs text-stone-500">
                    {isArchitect
                      ? "Click a region on the map or grid to see its strengths and weaknesses."
                      : "Hover over a region to see details."}
                  </p>
                </div>
              )}

              {/* Lock In button */}
              {isArchitect && pendingRegion !== null && !claimedRegions.has(pendingRegion) && (
                <button
                  onClick={() => claimRegion(pendingRegion)}
                  disabled={loading}
                  className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-amber-500 active:scale-95 disabled:opacity-50 transition"
                >
                  {loading
                    ? "Locking in…"
                    : `🔒 Lock In ${REGION_INFO[pendingRegion]?.name ?? "Region"}`}
                </button>
              )}
              {isArchitect && pendingRegion === null && !infoRegion && (
                <div className="rounded-xl border border-dashed border-stone-700 py-3 text-center text-xs text-stone-600">
                  No region selected yet
                </div>
              )}
            </div>
          </div>

          {/* Region grid — browse all 12 */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(REGION_INFO).map(([idStr, info]) => {
              const id = parseInt(idStr, 10);
              const claimed = claimedRegions.get(id);
              const isPending = pendingRegion === id;
              return (
                <button
                  key={id}
                  disabled={!!claimed || loading || !isArchitect}
                  onClick={() => {
                    if (isArchitect && !claimed) setPendingRegion(id);
                  }}
                  onMouseEnter={() => setHoveredRegion(id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className={`rounded-lg border p-2 text-left text-xs transition ${
                    isPending
                      ? "border-amber-500 bg-amber-900/50 text-amber-200 ring-1 ring-amber-500"
                      : claimed
                      ? "cursor-not-allowed border-stone-700 bg-stone-900/30 text-stone-600"
                      : isArchitect
                      ? "cursor-pointer border-stone-600 bg-stone-900/40 text-stone-300 hover:border-amber-600 hover:bg-amber-900/20 hover:text-amber-200"
                      : "cursor-default border-stone-700 bg-stone-900/30 text-stone-400"
                  }`}
                >
                  <span className="text-base">{info.emoji}</span>
                  <div className="mt-0.5 font-semibold leading-tight">{info.name}</div>
                  <div className="mt-0.5 leading-tight text-stone-500">{info.area}</div>
                  {isPending && <div className="mt-1 font-bold text-amber-400">← selected</div>}
                  {claimed && <div className="mt-1 text-red-400/80">↳ {claimed}</div>}
                  {!claimed && !isPending && isArchitect && (
                    <div className="mt-1 text-green-500/70">Available</div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Phase: done ── */}
      {phase === "done" && (
        <div className="rounded-lg border border-green-700/50 bg-green-900/20 p-3 text-sm text-green-300">
          ✅ <strong>{myTeamData?.civilizationName ?? teamName}</strong> has chosen{" "}
          <strong>{REGION_INFO[myRegionId]?.name}</strong>.{" "}
          {totalDone < totalTeams
            ? "Waiting for other teams to finish…"
            : "All teams have chosen — your teacher will start the game!"}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
    </div>
  );
}
