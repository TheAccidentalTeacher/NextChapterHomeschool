"use client";

/**
 * Merchant Panel — EXPAND round leader
 * Shows: trade board, active agreements, embargo status, expansion
 */

interface TradeOffer {
  id: string;
  offeringTeam: string;
  offeringResource: string;
  offeringAmount: number;
  requestingResource: string;
  requestingAmount: number;
  isOwn: boolean;
}

interface TradeAgreement {
  id: string;
  partnerTeam: string;
  giving: { resource: string; amount: number };
  receiving: { resource: string; amount: number };
  epochsRemaining: number;
}

interface MerchantPanelProps {
  reachAvailable: number;
  tradeOffers: TradeOffer[];
  activeAgreements: TradeAgreement[];
  isEmbargoActive: boolean;
  unlockedTechs: string[];
  onPostTrade?: () => void;
  onAcceptTrade?: (offerId: string) => void;
}

const RESOURCE_EMOJI: Record<string, string> = {
  production: "⚙️",
  reach: "🧭",
  legacy: "📜",
  resilience: "🛡️",
  food: "🌾",
};

export default function MerchantPanel({
  reachAvailable,
  tradeOffers,
  activeAgreements,
  isEmbargoActive,
  unlockedTechs,
  onPostTrade,
  onAcceptTrade,
}: MerchantPanelProps) {
  const hasPottery = unlockedTechs.includes("pottery");
  const hasTradeRoutes = unlockedTechs.includes("trade_routes");
  const hasSailing = unlockedTechs.includes("sailing");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          💰 Merchant — Expand & Trade
        </h2>
        <div className="text-sm text-gray-400">
          🧭 <span className="text-blue-400 font-bold">{reachAvailable}</span> Reach available
        </div>
      </div>

      {isEmbargoActive && (
        <div className="rounded-lg border border-red-700 bg-red-900/20 p-3 text-sm text-red-300">
          ⚠️ Your civilization is under embargo — trade restricted
        </div>
      )}

      {/* Spot Trade Board */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">Spot Trade Board</h3>
          <button
            type="button"
            onClick={onPostTrade}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
          >
            + Post Offer
          </button>
        </div>

        {!hasPottery && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-3 text-xs text-gray-500">
            🔒 Food trading — requires Pottery tech (Tier 1)
          </div>
        )}

        {tradeOffers.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No open trade offers</p>
        ) : (
          <div className="space-y-1.5">
            {tradeOffers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 flex items-center justify-between"
              >
                <div className="text-xs text-gray-300">
                  <span className="text-white font-medium">{offer.offeringTeam}</span>
                  {" offers "}
                  <span className="text-amber-300">
                    {offer.offeringAmount} {RESOURCE_EMOJI[offer.offeringResource]}
                  </span>
                  {" for "}
                  <span className="text-blue-300">
                    {offer.requestingAmount} {RESOURCE_EMOJI[offer.requestingResource]}
                  </span>
                </div>
                {!offer.isOwn && (
                  <button
                    type="button"
                    onClick={() => onAcceptTrade?.(offer.id)}
                    className="rounded bg-green-700 px-2 py-1 text-xs font-bold text-white hover:bg-green-600"
                  >
                    Accept
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Trade Agreements */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Active Agreements</h3>
        {!hasTradeRoutes ? (
          <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-3 text-xs text-gray-500">
            🔒 Formal Trade Agreements — requires Trade Routes tech (Tier 3)
          </div>
        ) : activeAgreements.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No active agreements</p>
        ) : (
          <div className="space-y-1.5">
            {activeAgreements.map((agr) => (
              <div
                key={agr.id}
                className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-xs text-gray-300"
              >
                <div className="font-medium text-white mb-1">
                  Agreement with {agr.partnerTeam}
                </div>
                <div>
                  You send: {agr.giving.amount}{" "}
                  {RESOURCE_EMOJI[agr.giving.resource]} → Receive:{" "}
                  {agr.receiving.amount}{" "}
                  {RESOURCE_EMOJI[agr.receiving.resource]}
                </div>
                <div className="text-gray-500 mt-1">
                  {agr.epochsRemaining} epochs remaining
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sea Routes */}
      {!hasSailing && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-3 text-xs text-gray-500">
          🔒 Sea Trade Routes — requires Sailing tech (Tier 1)
        </div>
      )}
      {hasSailing && (
        <div className="rounded-lg border border-blue-700/30 bg-blue-900/10 p-3 text-xs text-blue-300">
          ⛵ Sea routes are open — coastal trade enabled
        </div>
      )}
    </div>
  );
}
