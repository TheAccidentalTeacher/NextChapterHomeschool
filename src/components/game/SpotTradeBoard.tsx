"use client";

// ============================================
// SpotTradeBoard — Open-market async trading
// Decision 69 (Tier 1): Anonymous fill, 3-epoch expiry
// ============================================

import { useState } from "react";

interface TradeOffer {
  id: string;
  offeringTeam: string;
  offeringResource: string;
  offeringAmount: number;
  requestingResource: string;
  requestingAmount: number;
  isOwn: boolean;
  epochsRemaining: number;
}

interface SpotTradeBoardProps {
  offers: TradeOffer[];
  myTeamId: string;
  hasPottery: boolean;  // Food trade gated behind Pottery tech
  onPostOffer: (offer: {
    offeringResource: string;
    offeringAmount: number;
    requestingResource: string;
    requestingAmount: number;
  }) => void;
  onAcceptOffer: (offerId: string) => void;
  onCancelOffer: (offerId: string) => void;
}

const RESOURCES = [
  { key: "production", emoji: "⚙️", label: "Production" },
  { key: "reach", emoji: "🧭", label: "Reach" },
  { key: "legacy", emoji: "📜", label: "Legacy" },
  { key: "resilience", emoji: "🛡️", label: "Resilience" },
  { key: "food", emoji: "🌾", label: "Food" },
];

export default function SpotTradeBoard({
  offers,
  myTeamId,
  hasPottery,
  onPostOffer,
  onAcceptOffer,
  onCancelOffer,
}: SpotTradeBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [offerRes, setOfferRes] = useState("production");
  const [offerAmt, setOfferAmt] = useState(10);
  const [requestRes, setRequestRes] = useState("reach");
  const [requestAmt, setRequestAmt] = useState(10);

  const availableResources = hasPottery
    ? RESOURCES
    : RESOURCES.filter((r) => r.key !== "food");

  const handleSubmit = () => {
    if (offerRes === requestRes) return;
    if (offerAmt <= 0 || requestAmt <= 0) return;
    onPostOffer({
      offeringResource: offerRes,
      offeringAmount: offerAmt,
      requestingResource: requestRes,
      requestingAmount: requestAmt,
    });
    setShowForm(false);
  };

  const getEmoji = (res: string) =>
    RESOURCES.find((r) => r.key === res)?.emoji ?? "❓";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">📊 Spot Trade Board</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
        >
          {showForm ? "Cancel" : "+ Post Offer"}
        </button>
      </div>

      {/* Post Offer Form */}
      {showForm && (
        <div className="rounded-lg border border-blue-700/30 bg-blue-900/10 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">I offer</label>
              <select
                value={offerRes}
                onChange={(e) => setOfferRes(e.target.value)}
                className="w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
              >
                {availableResources.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.emoji} {r.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={offerAmt}
                onChange={(e) => setOfferAmt(Number(e.target.value))}
                className="mt-1 w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">I want</label>
              <select
                value={requestRes}
                onChange={(e) => setRequestRes(e.target.value)}
                className="w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
              >
                {availableResources.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.emoji} {r.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={requestAmt}
                onChange={(e) => setRequestAmt(Number(e.target.value))}
                className="mt-1 w-full rounded bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1.5"
              />
            </div>
          </div>
          {offerRes === requestRes && (
            <div className="text-[10px] text-red-400">Cannot trade a resource for itself</div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={offerRes === requestRes || offerAmt <= 0 || requestAmt <= 0}
            className="w-full rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500"
          >
            Post Offer
          </button>
        </div>
      )}

      {!hasPottery && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-2 text-[10px] text-gray-500">
          🔒 Food cannot be traded — requires Pottery tech
        </div>
      )}

      {/* Offers List */}
      {offers.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No open trade offers</p>
      ) : (
        <div className="space-y-1.5">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`rounded-lg border p-3 flex items-center justify-between ${
                offer.isOwn
                  ? "border-blue-700/30 bg-blue-900/10"
                  : "border-gray-700 bg-gray-800/50"
              }`}
            >
              <div className="text-xs text-gray-300">
                <span className="text-amber-300 font-medium">
                  {offer.offeringAmount} {getEmoji(offer.offeringResource)}
                </span>
                {" → "}
                <span className="text-blue-300 font-medium">
                  {offer.requestingAmount} {getEmoji(offer.requestingResource)}
                </span>
                <span className="text-gray-600 ml-2">
                  ({offer.epochsRemaining}ep left)
                </span>
              </div>
              <div>
                {offer.isOwn ? (
                  <button
                    type="button"
                    onClick={() => onCancelOffer(offer.id)}
                    className="rounded bg-red-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-600"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAcceptOffer(offer.id)}
                    className="rounded bg-green-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-green-600"
                  >
                    Accept
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
