"use client";

/**
 * Architect Panel — BUILD round leader
 * Shows: available buildings, build queue, building status, purchase menu trigger
 * Phase 7: Integrated with purchase catalog and asset system
 */

import { useState } from "react";
import PurchaseMenu from "@/components/game/PurchaseMenu";
import { BUILDINGS, type PurchaseItem } from "@/lib/game/purchase-catalog";

interface OwnedBuilding {
  key: string;
  subZone: string;
  subZoneName: string;
  isActive: boolean;
}

interface OwnedSubZone {
  id: string;
  name: string;
  settlementName: string | null;
}

interface ArchitectPanelProps {
  teamBuildings: OwnedBuilding[];
  resources: Record<string, number>;
  ownedSubZones: OwnedSubZone[];
  unlockedTechs: string[];
  hasBuilder: boolean;
  ownedAssetKeys: string[];
  onBuild?: (buildingKey: string) => void;
  onPurchase?: (itemKey: string, subZoneId: string | null) => void;
}

export default function ArchitectPanel({
  teamBuildings,
  resources,
  ownedSubZones,
  unlockedTechs,
  hasBuilder,
  ownedAssetKeys,
  onBuild,
  onPurchase,
}: ArchitectPanelProps) {
  const [showPurchaseMenu, setShowPurchaseMenu] = useState(false);
  const productionAvailable = resources.production ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          🏗️ Architect — Build
        </h2>
        <div className="text-sm text-gray-400">
          ⚙️ <span className="text-amber-400 font-bold">{productionAvailable}</span> Production available
        </div>
      </div>

      {/* Open Full Purchase Menu */}
      <button
        type="button"
        onClick={() => setShowPurchaseMenu(true)}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 active:bg-blue-700 transition-all flex items-center justify-center gap-2"
      >
        🛒 Open Purchase Menu
      </button>

      {/* Quick-Build: Buildings Only */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Quick Build — Buildings</h3>
        <div className="grid gap-2">
          {BUILDINGS.map((b) => {
            const owned = teamBuildings.filter((tb) => tb.key === b.key);
            const canAfford = productionAvailable >= b.costAmount;
            const alreadyOwned = !b.isStackable && owned.length > 0;

            return (
              <div
                key={b.key}
                className={`
                  rounded-lg border p-3 flex items-center justify-between
                  ${b.techGate && !unlockedTechs.includes(b.techGate)
                    ? "border-gray-800 bg-gray-900/50 opacity-50"
                    : "border-gray-700 bg-gray-800/50"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{b.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{b.name}</div>
                    <div className="text-xs text-gray-400">{b.benefit}</div>
                    {owned.length > 0 && (
                      <div className="text-xs text-green-400">
                        Built: {owned.length}
                        {owned.some((o) => !o.isActive) && (
                          <span className="text-red-400 ml-1">
                            ({owned.filter((o) => !o.isActive).length} damaged)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    ⚙️ {b.costAmount}
                    {hasBuilder && (
                      <span className="text-green-400 ml-1">(-3)</span>
                    )}
                  </span>
                  {!alreadyOwned && (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onBuild?.(b.key)}
                      className={`
                        rounded-lg px-3 py-1.5 text-xs font-bold transition-all
                        ${canAfford
                          ? "bg-blue-600 text-white hover:bg-blue-500"
                          : "bg-gray-700 text-gray-500 cursor-not-allowed"
                        }
                      `}
                    >
                      Build
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Buildings */}
      {teamBuildings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">Your Buildings</h3>
          <div className="flex flex-wrap gap-2">
            {teamBuildings.map((tb, i) => {
              const info = BUILDINGS.find((b) => b.key === tb.key);
              return (
                <div
                  key={i}
                  className={`
                    rounded-lg border px-3 py-2 text-xs
                    ${tb.isActive
                      ? "border-green-700 bg-green-900/20 text-green-300"
                      : "border-red-700 bg-red-900/20 text-red-300"
                    }
                  `}
                >
                  {info?.emoji ?? "🏗️"} {info?.name ?? tb.key}
                  {!tb.isActive && " (damaged)"}
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    📍 {tb.subZoneName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Purchase Menu Modal */}
      {showPurchaseMenu && onPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg">
            <PurchaseMenu
              resources={resources}
              ownedSubZones={ownedSubZones}
              unlockedTechs={unlockedTechs}
              hasBuilder={hasBuilder}
              ownedAssetKeys={ownedAssetKeys}
              onPurchase={(itemKey, subZoneId) => {
                onPurchase(itemKey, subZoneId);
                setShowPurchaseMenu(false);
              }}
              onClose={() => setShowPurchaseMenu(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
