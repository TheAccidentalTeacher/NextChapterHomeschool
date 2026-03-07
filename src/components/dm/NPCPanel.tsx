"use client";

// ============================================
// NPCPanel — DM controls for NPC system
// Decision 64: Spawn, override, give orders,
// dissolve NPCs. WAKE ROME button.
// ============================================

import { useState, useEffect } from "react";
import {
  NPC_ARCHETYPES,
  type NPCArchetype,
  type NPCLifecycleStage,
} from "@/lib/game/npc-engine";
import { getReputationTier } from "@/lib/game/reputation-engine";

interface NPCData {
  id: string;
  archetype: NPCArchetype;
  name: string;
  stage: NPCLifecycleStage;
  subZoneIds: string[];
  lastAction?: string;
  activatedAtEpoch?: number;
}

interface TeamReputation {
  teamId: string;
  teamName: string;
  reputation: number;
}

interface NPCPanelProps {
  gameId: string;
  npcs: NPCData[];
  teamReputations: Record<string, TeamReputation[]>; // npcId → reputations
  onRefresh: () => void;
}

export default function NPCPanel({
  gameId,
  npcs,
  teamReputations,
  onRefresh,
}: NPCPanelProps) {
  const [tab, setTab] = useState<"roster" | "spawn">("roster");
  const [spawning, setSpawning] = useState(false);
  const [spawnForm, setSpawnForm] = useState({
    archetype: "sanctuary" as NPCArchetype,
    name: "",
    subZoneIds: "",
    route: "",
  });
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(onRefresh, 30_000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  async function handleSpawn() {
    setSpawning(true);
    try {
      await fetch(`/api/games/${gameId}/npcs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "spawn",
          archetype: spawnForm.archetype,
          name: spawnForm.name || NPC_ARCHETYPES[spawnForm.archetype].name,
          subZoneIds: spawnForm.subZoneIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          route: spawnForm.route
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      onRefresh();
      setTab("roster");
      setSpawnForm({ archetype: "sanctuary", name: "", subZoneIds: "", route: "" });
    } catch (err) {
      console.error("Spawn failed:", err);
    } finally {
      setSpawning(false);
    }
  }

  async function handleAction(npcId: string, action: string, payload?: Record<string, unknown>) {
    setActionInProgress(npcId);
    try {
      await fetch(`/api/games/${gameId}/npcs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, npcId, ...payload }),
      });
      onRefresh();
    } catch (err) {
      console.error(`NPC action ${action} failed:`, err);
    } finally {
      setActionInProgress(null);
    }
  }

  const hasRome = npcs.some(
    (n) => n.archetype === "colossus" && n.stage === "dormant"
  );

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-amber-400">🏛️ NPC Civilizations</h2>
        <div className="flex gap-2">
          {/* Tab buttons */}
          <button
            type="button"
            onClick={() => setTab("roster")}
            className={`rounded-md px-3 py-1 text-sm ${
              tab === "roster"
                ? "bg-amber-900/50 text-amber-300 border border-amber-700"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Roster ({npcs.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("spawn")}
            className={`rounded-md px-3 py-1 text-sm ${
              tab === "spawn"
                ? "bg-green-900/50 text-green-300 border border-green-700"
                : "text-gray-400 hover:text-white"
            }`}
          >
            + Spawn
          </button>
        </div>
      </div>

      {/* WAKE ROME button */}
      {hasRome && (
        <button
          type="button"
          onClick={() => {
            const rome = npcs.find((n) => n.archetype === "colossus" && n.stage === "dormant");
            if (rome) handleAction(rome.id, "wake_rome");
          }}
          className="mb-4 w-full rounded-lg bg-gradient-to-r from-red-900 to-amber-900 py-2 text-center font-black text-amber-200 uppercase tracking-widest hover:from-red-800 hover:to-amber-800 transition-all shadow-lg border border-amber-700"
        >
          ⚔️ WAKE ROME
        </button>
      )}

      {/* Roster Tab */}
      {tab === "roster" && (
        <div className="space-y-3">
          {npcs.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              No NPCs spawned. Use the Spawn tab to add civilizations.
            </p>
          )}

          {npcs.map((npc) => {
            const def = NPC_ARCHETYPES[npc.archetype];
            const reps = teamReputations[npc.id] ?? [];
            const isProcessing = actionInProgress === npc.id;

            return (
              <div
                key={npc.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-lg mr-1">{def.emoji}</span>
                    <span className="font-bold text-white">{npc.name}</span>
                    <span className="ml-2 text-xs text-gray-500 uppercase">
                      {npc.archetype}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      npc.stage === "dormant"
                        ? "bg-gray-700 text-gray-300"
                        : npc.stage === "active" || npc.stage === "imperial"
                          ? "bg-green-900/50 text-green-400"
                          : npc.stage === "peak"
                            ? "bg-amber-900/50 text-amber-400"
                            : npc.stage === "declining"
                              ? "bg-red-900/50 text-red-400"
                              : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {npc.stage}
                  </span>
                </div>

                {/* Territory */}
                {npc.subZoneIds.length > 0 && (
                  <p className="text-xs text-gray-400 mb-1">
                    📍 Territory: {npc.subZoneIds.length} sub-zone{npc.subZoneIds.length > 1 ? "s" : ""}
                  </p>
                )}

                {/* Last action */}
                {npc.lastAction && (
                  <p className="text-xs text-gray-500 mb-2 italic">
                    Last: {npc.lastAction}
                  </p>
                )}

                {/* Reputation summary */}
                {reps.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 uppercase mb-1">Reputation</p>
                    <div className="flex flex-wrap gap-1">
                      {reps.map((r) => {
                        const tier = getReputationTier(r.reputation);
                        return (
                          <span
                            key={r.teamId}
                            className={`text-xs rounded px-1.5 py-0.5 ${tier.color} bg-gray-900`}
                            title={`${r.teamName}: ${r.reputation}/100 (${tier.label})`}
                          >
                            {tier.emoji} {r.teamName}: {r.reputation}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {npc.stage !== "dissolved" && npc.stage !== "fallen" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAction(npc.id, "override")}
                        disabled={isProcessing}
                        className="rounded bg-blue-900/50 px-2 py-1 text-xs text-blue-300 hover:bg-blue-800/50 disabled:opacity-50"
                      >
                        Override
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(npc.id, "give_orders")}
                        disabled={isProcessing}
                        className="rounded bg-purple-900/50 px-2 py-1 text-xs text-purple-300 hover:bg-purple-800/50 disabled:opacity-50"
                      >
                        Orders
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAction(npc.id, "dissolve")}
                    disabled={isProcessing}
                    className="rounded bg-red-900/50 px-2 py-1 text-xs text-red-400 hover:bg-red-800/50 disabled:opacity-50"
                  >
                    Dissolve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Spawn Tab */}
      {tab === "spawn" && (
        <div className="space-y-4">
          {/* Archetype selection */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Archetype</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(NPC_ARCHETYPES) as NPCArchetype[]).map((a) => {
                const def = NPC_ARCHETYPES[a];
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setSpawnForm((p) => ({ ...p, archetype: a }))}
                    className={`rounded-lg border p-2 text-left text-sm ${
                      spawnForm.archetype === a
                        ? "border-amber-500 bg-amber-900/30 text-white"
                        : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    <span className="text-lg mr-1">{def.emoji}</span>
                    <span className="font-medium">{def.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{def.behavior.substring(0, 50)}...</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Name (leave blank for default)
            </label>
            <input
              type="text"
              value={spawnForm.name}
              onChange={(e) => setSpawnForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={NPC_ARCHETYPES[spawnForm.archetype].name}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-600"
            />
          </div>

          {/* Sub-zone IDs (for territory NPCs) */}
          {NPC_ARCHETYPES[spawnForm.archetype].hasTerritory && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Sub-zone IDs (comma-separated)
              </label>
              <input
                type="text"
                value={spawnForm.subZoneIds}
                onChange={(e) => setSpawnForm((p) => ({ ...p, subZoneIds: e.target.value }))}
                placeholder="e.g. med-01, med-02, med-03"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-600"
              />
            </div>
          )}

          {/* Route (for Caravan) */}
          {spawnForm.archetype === "caravan" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Route (comma-separated sub-zone IDs)
              </label>
              <input
                type="text"
                value={spawnForm.route}
                onChange={(e) => setSpawnForm((p) => ({ ...p, route: e.target.value }))}
                placeholder="e.g. asia-01, asia-02, asia-03, africa-01"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-600"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleSpawn}
            disabled={spawning}
            className="w-full rounded-lg bg-green-800 py-2 text-center font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-all"
          >
            {spawning ? "Spawning..." : `Spawn ${NPC_ARCHETYPES[spawnForm.archetype].emoji} ${spawnForm.name || NPC_ARCHETYPES[spawnForm.archetype].name}`}
          </button>
        </div>
      )}
    </div>
  );
}
