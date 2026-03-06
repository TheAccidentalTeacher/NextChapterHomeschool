"use client";

/**
 * Warlord Panel — DEFEND round leader
 * Shows: military units, defense status, battle interface
 */

interface MilitaryUnit {
  type: "scout" | "soldier" | "merchant" | "builder";
  count: number;
  subZone: string;
  health: number;
}

interface WarlordPanelProps {
  units: MilitaryUnit[];
  armyStrength: number;
  resilienceAvailable: number;
  warExhaustion: number;
  defenseStatus: { subZone: string; hasWalls: boolean; soldiers: number }[];
  onRecruitUnit?: (type: string) => void;
  onMoveUnit?: (unitType: string, toSubZone: string) => void;
}

const UNIT_INFO: Record<string, { emoji: string; name: string; cost: number; costResource: string }> = {
  scout:    { emoji: "🧭", name: "Scout",    cost: 5, costResource: "reach" },
  soldier:  { emoji: "🛡️", name: "Soldier",  cost: 6, costResource: "resilience" },
  merchant: { emoji: "💰", name: "Merchant", cost: 7, costResource: "reach" },
  builder:  { emoji: "🔨", name: "Builder",  cost: 8, costResource: "production" },
};

export default function WarlordPanel({
  units,
  armyStrength,
  resilienceAvailable,
  warExhaustion,
  defenseStatus,
  onRecruitUnit,
  onMoveUnit,
}: WarlordPanelProps) {
  const totalSoldiers = units
    .filter((u) => u.type === "soldier")
    .reduce((sum, u) => sum + u.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          ⚔️ Warlord — Defend
        </h2>
        <div className="text-sm text-gray-400">
          🛡️ <span className="text-green-400 font-bold">{resilienceAvailable}</span> Resilience
        </div>
      </div>

      {/* Army Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-center">
          <div className="text-xs text-gray-400">Soldiers</div>
          <div className="text-xl font-bold text-white">{totalSoldiers}</div>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-center">
          <div className="text-xs text-gray-400">Army Strength</div>
          <div className="text-xl font-bold text-blue-400">{armyStrength}</div>
        </div>
        <div
          className={`rounded-lg border p-3 text-center ${
            warExhaustion >= 75
              ? "border-red-700 bg-red-900/20"
              : warExhaustion >= 50
              ? "border-yellow-700 bg-yellow-900/20"
              : "border-gray-700 bg-gray-800/50"
          }`}
        >
          <div className="text-xs text-gray-400">War Exhaustion</div>
          <div
            className={`text-xl font-bold ${
              warExhaustion >= 75
                ? "text-red-400"
                : warExhaustion >= 50
                ? "text-yellow-400"
                : "text-green-400"
            }`}
          >
            {warExhaustion}
          </div>
        </div>
      </div>

      {/* Recruit Units */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Recruit Units</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(UNIT_INFO).map(([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => onRecruitUnit?.(key)}
              className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-left hover:border-gray-500 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{info.emoji}</span>
                <span className="text-sm font-medium text-white">
                  {info.name}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Cost: {info.cost} {info.costResource === "reach" ? "🧭" : info.costResource === "resilience" ? "🛡️" : "⚙️"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Units Deployed */}
      {units.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">Deployed Units</h3>
          <div className="space-y-1.5">
            {units.map((u, i) => {
              const info = UNIT_INFO[u.type];
              return (
                <div
                  key={i}
                  className="rounded-lg border border-gray-700 bg-gray-800/50 p-2 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span>{info?.emoji}</span>
                    <span className="text-white">
                      {info?.name} ×{u.count}
                    </span>
                    <span className="text-gray-500">@ {u.subZone}</span>
                  </div>
                  <div className="text-gray-400">HP: {u.health}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Defense Status */}
      {defenseStatus.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">Defense Status</h3>
          <div className="space-y-1.5">
            {defenseStatus.map((d, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-700 bg-gray-800/50 p-2 flex items-center justify-between text-xs"
              >
                <span className="text-white">{d.subZone}</span>
                <div className="flex items-center gap-2">
                  {d.hasWalls && (
                    <span className="text-amber-400">🧱 Walls</span>
                  )}
                  <span className="text-gray-400">
                    🛡️ {d.soldiers} soldiers
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
