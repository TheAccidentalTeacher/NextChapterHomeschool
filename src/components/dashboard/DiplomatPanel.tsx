"use client";

/**
 * Diplomat Panel — DEFINE round leader (laws & diplomacy)
 */

interface Alliance {
  id: string;
  partnerTeam: string;
  type: "alliance" | "non_aggression" | "trade_pact";
  epochsActive: number;
}

interface DiplomatPanelProps {
  alliances: Alliance[];
  laws: { name: string; effect: string }[];
  pendingProposals: { id: string; from: string; type: string }[];
  warExhaustion: number;
  unlockedTechs: string[];
  onProposeLaw?: () => void;
  onSendProposal?: () => void;
  onAcceptProposal?: (id: string) => void;
  onRejectProposal?: (id: string) => void;
}

export default function DiplomatPanel({
  alliances,
  laws,
  pendingProposals,
  warExhaustion,
  unlockedTechs,
  onProposeLaw,
  onSendProposal,
  onAcceptProposal,
  onRejectProposal,
}: DiplomatPanelProps) {
  const hasPhilosophy = unlockedTechs.includes("philosophy");
  const hasFeudalismTech = unlockedTechs.includes("feudalism");
  const hasDiplomaticCorps = unlockedTechs.includes("diplomatic_corps");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        🤝 Diplomat — Define & Negotiate
      </h2>

      {/* War Exhaustion Warning */}
      {warExhaustion >= 50 && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            warExhaustion >= 75
              ? "border-red-700 bg-red-900/20 text-red-300"
              : "border-yellow-700 bg-yellow-900/20 text-yellow-300"
          }`}
        >
          ⚠️ War Exhaustion: {warExhaustion}
          {warExhaustion >= 75 && " — Trade blocked! Seek peace immediately."}
        </div>
      )}

      {/* Laws */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">Civilization Laws</h3>
          {hasPhilosophy ? (
            <button
              type="button"
              onClick={onProposeLaw}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
            >
              + Propose Law
            </button>
          ) : (
            <span className="text-[10px] text-gray-600">🔒 Philosophy</span>
          )}
        </div>
        {!hasPhilosophy ? (
          <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-3 text-xs text-gray-500">
            🔒 Government &amp; Law System — requires Philosophy tech (Tier 3)
          </div>
        ) : laws.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No laws enacted yet</p>
        ) : (
          <div className="space-y-1.5">
            {laws.map((law, i) => (
              <div
                key={i}
                className="rounded-lg border border-purple-700/50 bg-purple-900/10 p-3 text-xs"
              >
                <div className="font-medium text-purple-300">{law.name}</div>
                <div className="text-gray-400">{law.effect}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diplomatic Proposals */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">Incoming Proposals</h3>
          <button
            type="button"
            onClick={onSendProposal}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
          >
            + Send Proposal
          </button>
        </div>
        {pendingProposals.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No pending proposals</p>
        ) : (
          <div className="space-y-1.5">
            {pendingProposals.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 flex items-center justify-between"
              >
                <div className="text-xs text-gray-300">
                  <span className="text-white font-medium">{p.from}</span>
                  {" proposes "}
                  <span className="text-blue-300">{p.type}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAcceptProposal?.(p.id)}
                    className="rounded bg-green-700 px-2 py-1 text-xs font-bold text-white hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onRejectProposal?.(p.id)}
                    className="rounded bg-red-700 px-2 py-1 text-xs font-bold text-white hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alliances */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Active Alliances</h3>
        {!hasDiplomaticCorps ? (
          <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-3 text-xs text-gray-500">
            🔒 Advanced Diplomacy — requires Diplomatic Corps tech (Tier 5)
          </div>
        ) : alliances.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No alliances</p>
        ) : (
          <div className="space-y-1.5">
            {alliances.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-green-700/30 bg-green-900/10 p-3 text-xs"
              >
                <div className="text-green-300 font-medium">
                  {a.type.replace("_", " ")} with {a.partnerTeam}
                </div>
                <div className="text-gray-500">{a.epochsActive} epochs</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feudalism / Vassal System */}
      {!hasFeudalismTech ? (
        <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-3 text-xs text-gray-500">
          🔒 Vassal System — requires Feudalism tech (Tier 4)
        </div>
      ) : (
        <div className="rounded-lg border border-cyan-700/30 bg-cyan-900/10 p-3 text-xs text-cyan-300">
          👑 Feudalism unlocked — Vassal states available
        </div>
      )}
    </div>
  );
}
