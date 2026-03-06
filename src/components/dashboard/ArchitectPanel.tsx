"use client";

/**
 * Architect Panel — BUILD round leader
 * Shows: available buildings, build queue, building status
 */

interface Building {
  key: string;
  name: string;
  emoji: string;
  cost: number;
  costResource: string;
  benefit: string;
  techGate?: string;
  isUnlocked: boolean;
}

const BUILDINGS: Building[] = [
  { key: "farm", name: "Farm", emoji: "🌾", cost: 6, costResource: "production", benefit: "+3 Food/epoch", isUnlocked: true },
  { key: "granary", name: "Granary", emoji: "🏛️", cost: 8, costResource: "production", benefit: "Food decay halved", isUnlocked: true },
  { key: "barracks", name: "Barracks", emoji: "⚔️", cost: 10, costResource: "production", benefit: "Soldiers cost 4 instead of 6", isUnlocked: true },
  { key: "market", name: "Market", emoji: "🏪", cost: 8, costResource: "production", benefit: "Trade routes +50% Reach", isUnlocked: true },
  { key: "aqueduct", name: "Aqueduct", emoji: "💧", cost: 12, costResource: "production", benefit: "Immune to disease/drought", isUnlocked: true },
  { key: "library", name: "Library", emoji: "📚", cost: 10, costResource: "production", benefit: "+25% Legacy permanently", isUnlocked: true },
  { key: "walls", name: "Walls", emoji: "🧱", cost: 14, costResource: "production", benefit: "First attack/epoch absorbed", isUnlocked: true },
];

interface ArchitectPanelProps {
  teamBuildings: { key: string; subZone: string; isActive: boolean }[];
  productionAvailable: number;
  onBuild?: (buildingKey: string) => void;
}

export default function ArchitectPanel({
  teamBuildings,
  productionAvailable,
  onBuild,
}: ArchitectPanelProps) {
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

      {/* Available Buildings */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Available Buildings</h3>
        <div className="grid gap-2">
          {BUILDINGS.map((b) => {
            const owned = teamBuildings.filter((tb) => tb.key === b.key);
            const canAfford = productionAvailable >= b.cost;

            return (
              <div
                key={b.key}
                className={`
                  rounded-lg border p-3 flex items-center justify-between
                  ${b.isUnlocked
                    ? "border-gray-700 bg-gray-800/50"
                    : "border-gray-800 bg-gray-900/50 opacity-50"
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
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    ⚙️ {b.cost}
                  </span>
                  {b.isUnlocked && (
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
                  {info?.emoji} {info?.name ?? tb.key}
                  {!tb.isActive && " (damaged)"}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
