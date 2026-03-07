"use client";

// ============================================
// EmbargoPanel — Warlord files trade embargo
// Decision 69: One embargo per epoch, mutual cost
// ============================================

import { useState } from "react";

interface EmbargoInfo {
  targetTeamId: string;
  targetTeamName: string;
  filedEpoch: number;
  isActive: boolean;
}

interface EmbargoPanelProps {
  activeEmbargoes: EmbargoInfo[];
  embargoedBy: EmbargoInfo[]; // embargoes filed against us
  availableTeams: { id: string; name: string }[];
  canFileThisEpoch: boolean;
  onFileEmbargo: (targetTeamId: string) => void;
  onLiftEmbargo: (targetTeamId: string) => void;
}

export default function EmbargoPanel({
  activeEmbargoes,
  embargoedBy,
  availableTeams,
  canFileThisEpoch,
  onFileEmbargo,
  onLiftEmbargo,
}: EmbargoPanelProps) {
  const [selectedTarget, setSelectedTarget] = useState("");

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
        🚫 Trade Embargo
      </h3>

      {/* Embargoed by others */}
      {embargoedBy.length > 0 && (
        <div className="space-y-1.5">
          {embargoedBy.map((e) => (
            <div
              key={e.targetTeamId}
              className="rounded-lg border border-red-700 bg-red-900/20 p-2 text-xs text-red-300"
            >
              ⚠️ <span className="font-medium">{e.targetTeamName}</span> has
              embargoed your civilization — trade restricted
            </div>
          ))}
        </div>
      )}

      {/* Active embargoes we filed */}
      {activeEmbargoes.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] text-gray-500 font-medium">Your Active Embargoes</h4>
          {activeEmbargoes.map((e) => (
            <div
              key={e.targetTeamId}
              className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-2 flex items-center justify-between text-xs"
            >
              <span className="text-amber-300">
                🚫 {e.targetTeamName} (since epoch {e.filedEpoch})
              </span>
              <button
                type="button"
                onClick={() => onLiftEmbargo(e.targetTeamId)}
                className="rounded bg-gray-700 px-2 py-0.5 text-[10px] text-gray-400 hover:bg-gray-600"
              >
                Lift
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File new embargo */}
      {canFileThisEpoch ? (
        <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-3 space-y-2">
          <label className="text-[10px] text-gray-500 block">File Embargo Against</label>
          <div className="flex gap-2">
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="flex-1 rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
            >
              <option value="">Select target...</option>
              {availableTeams
                .filter(
                  (t) =>
                    !activeEmbargoes.some((e) => e.targetTeamId === t.id)
                )
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (selectedTarget) {
                  onFileEmbargo(selectedTarget);
                  setSelectedTarget("");
                }
              }}
              disabled={!selectedTarget}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500"
            >
              File
            </button>
          </div>
          <div className="text-[9px] text-gray-600">
            ⚠️ Embargo blocks their trade AND yours with them
          </div>
        </div>
      ) : (
        <div className="text-[10px] text-gray-600">
          Already filed an embargo this epoch
        </div>
      )}
    </div>
  );
}
