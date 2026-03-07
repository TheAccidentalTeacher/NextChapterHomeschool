"use client";

// ============================================
// PurchaseMenu — Decision 39
// Three-tab purchase interface: Buildings / Units / Supplies
// Opens from the resource routing panel when player chooses SPEND.
// Each item shows cost, benefit, tech gate, and a Buy button.
// Building purchases prompt for sub-zone placement.
// ============================================

import { useState } from "react";
import {
  BUILDINGS,
  UNITS,
  SUPPLIES,
  getAdjustedCost,
  type PurchaseItem,
  type AssetCategory,
} from "@/lib/game/purchase-catalog";

interface OwnedSubZone {
  id: string;
  name: string;
  settlementName: string | null;
}

interface PurchaseMenuProps {
  /** Resources currently available for spending */
  resources: Record<string, number>;
  /** Sub-zones owned by this team (for building placement) */
  ownedSubZones: OwnedSubZone[];
  /** Tech keys the team has researched */
  unlockedTechs: string[];
  /** Whether the team has an active Builder unit */
  hasBuilder: boolean;
  /** Keys of assets the team already owns (for non-stackable check) */
  ownedAssetKeys: string[];
  /** Callback when a purchase is confirmed */
  onPurchase: (itemKey: string, subZoneId: string | null) => void;
  /** Callback to close the menu */
  onClose: () => void;
}

const TABS: { key: AssetCategory; label: string; emoji: string }[] = [
  { key: "building", label: "Buildings", emoji: "🏗️" },
  { key: "unit", label: "Units", emoji: "⚔️" },
  { key: "supply", label: "Supplies", emoji: "📦" },
];

const CATEGORY_ITEMS: Record<AssetCategory, PurchaseItem[]> = {
  building: BUILDINGS,
  unit: UNITS,
  supply: SUPPLIES,
};

const RESOURCE_EMOJI: Record<string, string> = {
  production: "⚙️",
  reach: "🧭",
  legacy: "📜",
  resilience: "🛡️",
  food: "🌾",
};

export default function PurchaseMenu({
  resources,
  ownedSubZones,
  unlockedTechs,
  hasBuilder,
  ownedAssetKeys,
  onPurchase,
  onClose,
}: PurchaseMenuProps) {
  const [activeTab, setActiveTab] = useState<AssetCategory>("building");
  const [placingItem, setPlacingItem] = useState<PurchaseItem | null>(null);
  const [selectedSubZone, setSelectedSubZone] = useState<string>("");

  const items = CATEGORY_ITEMS[activeTab];

  function handleBuyClick(item: PurchaseItem) {
    if (item.category === "building") {
      // Buildings require sub-zone selection
      setPlacingItem(item);
      setSelectedSubZone(ownedSubZones[0]?.id ?? "");
    } else {
      // Units and supplies go to home sub-zone (first owned)
      onPurchase(item.key, ownedSubZones[0]?.id ?? null);
    }
  }

  function handleConfirmPlacement() {
    if (!placingItem || !selectedSubZone) return;
    onPurchase(placingItem.key, selectedSubZone);
    setPlacingItem(null);
    setSelectedSubZone("");
  }

  function isUnlocked(item: PurchaseItem): boolean {
    if (!item.techGate) return true;
    return unlockedTechs.includes(item.techGate);
  }

  function canAfford(item: PurchaseItem): boolean {
    const cost = getAdjustedCost(item, hasBuilder);
    return (resources[item.costResource] ?? 0) >= cost;
  }

  function isAlreadyOwned(item: PurchaseItem): boolean {
    if (item.isStackable) return false;
    return ownedAssetKeys.includes(item.key);
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/95 backdrop-blur-sm shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
        <h2 className="text-lg font-bold text-white">🛒 Purchase Menu</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
        >
          ✕
        </button>
      </div>

      {/* Resource Summary */}
      <div className="flex gap-4 px-4 py-2 border-b border-gray-800 text-xs">
        {Object.entries(resources).map(([key, amount]) => (
          <div key={key} className="flex items-center gap-1">
            <span>{RESOURCE_EMOJI[key] ?? "📦"}</span>
            <span className="text-gray-400">{key}:</span>
            <span className="font-bold text-white">{amount}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-white border-b-2 border-blue-500 bg-gray-800/50"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {items.map((item) => {
          const unlocked = isUnlocked(item);
          const affordable = canAfford(item);
          const alreadyOwned = isAlreadyOwned(item);
          const cost = getAdjustedCost(item, hasBuilder);
          const discounted = cost < item.costAmount;

          return (
            <div
              key={item.key}
              className={`rounded-lg border p-3 flex items-center justify-between transition-all ${
                !unlocked
                  ? "border-gray-800 bg-gray-900/50 opacity-40"
                  : alreadyOwned
                  ? "border-green-800 bg-green-900/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    {item.name}
                    {alreadyOwned && (
                      <span className="text-xs text-green-400">✓ Owned</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{item.benefit}</div>
                  {!unlocked && item.techGate && (
                    <div className="text-xs text-red-400 mt-0.5">
                      🔒 Requires: {item.techGate}
                    </div>
                  )}
                  {item.destroyedBy && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      ⚠ Lost by: {item.destroyedBy}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className={`text-xs font-medium ${affordable ? "text-white" : "text-red-400"}`}>
                    {RESOURCE_EMOJI[item.costResource]} {cost}
                    {discounted && (
                      <span className="text-green-400 ml-1 text-[10px]">
                        (-3 🔨)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 capitalize">
                    {item.costResource}
                  </div>
                </div>

                {unlocked && !alreadyOwned && (
                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => handleBuyClick(item)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      affordable
                        ? "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Buy
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-zone Placement Modal */}
      {placingItem && (
        <div className="border-t border-gray-700 p-4 bg-gray-800/80">
          <div className="text-sm font-medium text-white mb-2">
            📍 Place {placingItem.emoji} {placingItem.name} — choose sub-zone:
          </div>
          {ownedSubZones.length === 0 ? (
            <div className="text-xs text-red-400">
              You don't own any sub-zones yet! Expand your territory first.
            </div>
          ) : (
            <>
              <select
                value={selectedSubZone}
                onChange={(e) => setSelectedSubZone(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white mb-2"
              >
                {ownedSubZones.map((sz) => (
                  <option key={sz.id} value={sz.id}>
                    {sz.settlementName ?? sz.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmPlacement}
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-green-500"
                >
                  ✓ Confirm Placement
                </button>
                <button
                  type="button"
                  onClick={() => setPlacingItem(null)}
                  className="rounded-lg bg-gray-700 px-4 py-1.5 text-xs font-bold text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
