"use client";

// ============================================
// BattleRoundPanel — Warlord's battle interface
// Decision 59: Strategy + d20 + modifiers → territory
// ============================================

import { useState } from "react";

interface BattleInfo {
  id: string;
  opponentTeam: string;
  opponentSoldiers: number;
  isAttacker: boolean;
  deEscalationOpen: boolean;
  deEscalationOffer: string | null;
  phase: "de_escalation" | "strategy" | "resolved";
  result?: {
    won: boolean;
    yourScore: number;
    theirScore: number;
    soldiersLost: number;
    resilienceLost: number;
    territoryTransferred: boolean;
  };
}

interface BattleRoundPanelProps {
  battle: BattleInfo | null;
  mySoldiers: number;
  myResources: Record<string, number>;
  onSubmitStrategy: (strategy: string, justification: string) => void;
  onAcceptDeEscalation: () => void;
  onRejectDeEscalation: () => void;
}

export default function BattleRoundPanel({
  battle,
  mySoldiers,
  myResources,
  onSubmitStrategy,
  onAcceptDeEscalation,
  onRejectDeEscalation,
}: BattleRoundPanelProps) {
  const [strategy, setStrategy] = useState("");
  const [justification, setJustification] = useState("");

  if (!battle) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-4 text-center text-sm text-gray-500">
        ⚔️ No active battle this round
      </div>
    );
  }

  // --- DE-ESCALATION PHASE ---
  if (battle.phase === "de_escalation" && battle.deEscalationOpen) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-700 bg-amber-900/20 p-4 space-y-3">
          <h3 className="text-sm font-bold text-amber-300">
            🕊️ De-Escalation Window — 3 minutes
          </h3>
          <p className="text-xs text-gray-300">
            {battle.isAttacker
              ? "Your Diplomat can send a final peace offer before battle begins."
              : "The attacking civilization has offered terms:"}
          </p>
          {battle.deEscalationOffer && (
            <div className="rounded border border-gray-600 bg-gray-800 p-2 text-xs text-gray-300 italic">
              &quot;{battle.deEscalationOffer}&quot;
            </div>
          )}
          {!battle.isAttacker && battle.deEscalationOffer && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onAcceptDeEscalation}
                className="rounded-lg bg-green-700 px-4 py-2 text-xs font-bold text-white hover:bg-green-600"
              >
                ✅ Accept Peace (+5 Resilience)
              </button>
              <button
                type="button"
                onClick={onRejectDeEscalation}
                className="rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-600"
              >
                ❌ Reject — Proceed to Battle
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- STRATEGY PHASE ---
  if (battle.phase === "strategy") {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-red-700 bg-red-900/20 p-4 space-y-3">
          <h3 className="text-sm font-bold text-red-300">
            ⚔️ Battle Round — {battle.isAttacker ? "ATTACK" : "DEFEND"}
          </h3>
          <div className="text-xs text-gray-400">
            vs <span className="text-white font-medium">{battle.opponentTeam}</span>
            {" ("}{battle.opponentSoldiers} soldiers)
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded border border-gray-700 bg-gray-800/50 p-2">
              <div className="text-xs text-gray-500">Your Soldiers</div>
              <div className="text-xl font-bold text-white">🛡️ {mySoldiers}</div>
            </div>
            <div className="rounded border border-gray-700 bg-gray-800/50 p-2">
              <div className="text-xs text-gray-500">Resilience</div>
              <div className="text-xl font-bold text-green-400">
                {myResources.resilience ?? 0}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 block mb-1">
              Military Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
            >
              <option value="">Select strategy...</option>
              <option value="frontal_assault">Frontal Assault — all-in force</option>
              <option value="flanking">Flanking Maneuver — surprise angle</option>
              <option value="siege">Siege — starve them out</option>
              <option value="defensive_hold">Defensive Hold — wait and counter</option>
              <option value="guerrilla">Guerrilla Tactics — hit and run</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 block mb-1">
              Justification — Why will this strategy succeed?
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain your reasoning... (graded by DM for 0.5×-2.0× multiplier)"
              rows={3}
              className="w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={() => onSubmitStrategy(strategy, justification)}
            disabled={!strategy || justification.length < 20}
            className="w-full rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500"
          >
            ⚔️ Submit Battle Strategy
          </button>
        </div>
      </div>
    );
  }

  // --- RESOLVED PHASE ---
  if (battle.phase === "resolved" && battle.result) {
    const r = battle.result;
    return (
      <div className="space-y-3">
        <div
          className={`rounded-lg border p-4 space-y-3 ${
            r.won
              ? "border-green-700 bg-green-900/20"
              : "border-red-700 bg-red-900/20"
          }`}
        >
          <h3
            className={`text-sm font-bold ${
              r.won ? "text-green-300" : "text-red-300"
            }`}
          >
            {r.won ? "🎉 Victory!" : "💀 Defeat"}
          </h3>

          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="rounded border border-gray-700 bg-gray-800/50 p-2">
              <div className="text-gray-500">Your Score</div>
              <div className="text-lg font-bold text-white">{r.yourScore}</div>
            </div>
            <div className="rounded border border-gray-700 bg-gray-800/50 p-2">
              <div className="text-gray-500">Their Score</div>
              <div className="text-lg font-bold text-white">{r.theirScore}</div>
            </div>
          </div>

          {!r.won && (
            <div className="space-y-1 text-xs text-red-300">
              <div>🛡️ Lost {r.soldiersLost} soldier(s)</div>
              <div>💔 Lost {r.resilienceLost} Resilience</div>
              {r.territoryTransferred && (
                <div>🗺️ Border sub-zone transferred to enemy</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
