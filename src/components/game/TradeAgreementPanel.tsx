"use client";

// ============================================
// TradeAgreementPanel — Multi-epoch auto-executing contracts
// Decision 69 (Tier 2): Named contracts, DM approval gate
// ============================================

import { useState } from "react";

interface TradeAgreement {
  id: string;
  partnerTeam: string;
  partnerTeamId: string;
  givingResource: string;
  givingAmount: number;
  receivingResource: string;
  receivingAmount: number;
  duration: number;
  epochsRemaining: number;
  autoRenew: boolean;
  status: "pending" | "active" | "awaiting_approval" | "cancelled";
}

interface ProposalInput {
  partnerTeamId: string;
  givingResource: string;
  givingAmount: number;
  receivingResource: string;
  receivingAmount: number;
  duration: number;
  autoRenew: boolean;
}

interface TradeAgreementPanelProps {
  agreements: TradeAgreement[];
  pendingProposals: TradeAgreement[];
  availableTeams: { id: string; name: string }[];
  hasTradeRoutes: boolean;
  onPropose: (proposal: ProposalInput) => void;
  onAccept: (agreementId: string) => void;
  onDecline: (agreementId: string) => void;
  onCancel: (agreementId: string) => void;
}

const RESOURCES = [
  { key: "production", emoji: "⚙️", label: "Production" },
  { key: "reach", emoji: "🧭", label: "Reach" },
  { key: "legacy", emoji: "📜", label: "Legacy" },
  { key: "resilience", emoji: "🛡️", label: "Resilience" },
  { key: "food", emoji: "🌾", label: "Food" },
];

const getEmoji = (res: string) =>
  RESOURCES.find((r) => r.key === res)?.emoji ?? "❓";

export default function TradeAgreementPanel({
  agreements,
  pendingProposals,
  availableTeams,
  hasTradeRoutes,
  onPropose,
  onAccept,
  onDecline,
  onCancel,
}: TradeAgreementPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [partner, setPartner] = useState("");
  const [giveRes, setGiveRes] = useState("production");
  const [giveAmt, setGiveAmt] = useState(5);
  const [recvRes, setRecvRes] = useState("reach");
  const [recvAmt, setRecvAmt] = useState(5);
  const [duration, setDuration] = useState(3);
  const [autoRenew, setAutoRenew] = useState(false);

  if (!hasTradeRoutes) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-3 text-xs text-gray-500">
        🔒 Trade Agreements — requires Trade Routes tech (Tier 3)
      </div>
    );
  }

  const handleSubmit = () => {
    if (!partner || giveRes === recvRes) return;
    onPropose({
      partnerTeamId: partner,
      givingResource: giveRes,
      givingAmount: giveAmt,
      receivingResource: recvRes,
      receivingAmount: recvAmt,
      duration,
      autoRenew,
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">📜 Trade Agreements</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
        >
          {showForm ? "Cancel" : "+ Propose"}
        </button>
      </div>

      {/* Proposal Form */}
      {showForm && (
        <div className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-3 space-y-3">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Partner Civilization</label>
            <select
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              className="w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
            >
              <option value="">Select team...</option>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">I send per epoch</label>
              <select
                value={giveRes}
                onChange={(e) => setGiveRes(e.target.value)}
                className="w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
              >
                {RESOURCES.map((r) => (
                  <option key={r.key} value={r.key}>{r.emoji} {r.label}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={giveAmt}
                onChange={(e) => setGiveAmt(Number(e.target.value))}
                className="mt-1 w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">I receive per epoch</label>
              <select
                value={recvRes}
                onChange={(e) => setRecvRes(e.target.value)}
                className="w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
              >
                {RESOURCES.map((r) => (
                  <option key={r.key} value={r.key}>{r.emoji} {r.label}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={recvAmt}
                onChange={(e) => setRecvAmt(Number(e.target.value))}
                className="mt-1 w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Duration (epochs)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="rounded"
                />
                Auto-renew
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!partner || giveRes === recvRes}
            className="w-full rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500"
          >
            Send Proposal
          </button>
        </div>
      )}

      {/* Incoming Proposals */}
      {pendingProposals.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] text-amber-400 font-medium">Incoming Proposals</h4>
          {pendingProposals.map((p) => (
            <div key={p.id} className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-2 text-xs">
              <div className="text-white font-medium mb-1">
                From {p.partnerTeam}
              </div>
              <div className="text-gray-400">
                You send {p.receivingAmount} {getEmoji(p.receivingResource)} →
                Receive {p.givingAmount} {getEmoji(p.givingResource)} /epoch
                for {p.duration} epochs
              </div>
              <div className="flex gap-1.5 mt-2">
                <button type="button" onClick={() => onAccept(p.id)}
                  className="rounded bg-green-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-green-600">Accept</button>
                <button type="button" onClick={() => onDecline(p.id)}
                  className="rounded bg-red-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-600">Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Agreements */}
      {agreements.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No active trade agreements</p>
      ) : (
        <div className="space-y-1.5">
          {agreements.map((a) => (
            <div key={a.id} className="rounded-lg border border-gray-700 bg-gray-800/50 p-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium">{a.partnerTeam}</span>
                <span className="text-gray-500">{a.epochsRemaining}ep left</span>
              </div>
              <div className="text-gray-400">
                Send {a.givingAmount} {getEmoji(a.givingResource)} → Receive {a.receivingAmount} {getEmoji(a.receivingResource)}
              </div>
              {a.status === "awaiting_approval" && (
                <div className="text-amber-400 text-[10px] mt-1">⏳ Awaiting DM approval</div>
              )}
              <button type="button" onClick={() => onCancel(a.id)}
                className="mt-1 rounded bg-gray-700 px-2 py-0.5 text-[10px] text-gray-400 hover:bg-gray-600">
                Cancel (−10 Rep)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
