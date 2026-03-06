"use client";

interface PopulationBarProps {
  population: number;
  foodStored: number;
  growthRate: number; // positive = growing, negative = declining
  maxPop?: number;
}

export default function PopulationBar({
  population,
  foodStored,
  growthRate,
  maxPop = 30,
}: PopulationBarProps) {
  const percent = Math.min((population / maxPop) * 100, 100);
  const isGrowing = growthRate > 0;
  const isDeclining = growthRate < 0;

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-300">👥 Population</h3>
        <span className="text-lg font-bold text-stone-200">{population}</span>
      </div>

      {/* Pop bar */}
      <div className="mb-3 h-3 overflow-hidden rounded-full bg-stone-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDeclining
              ? "bg-red-500"
              : isGrowing
              ? "bg-green-500"
              : "bg-stone-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-stone-800/50 p-2">
          <p className="text-stone-500">Food Stored</p>
          <p className="text-base font-bold text-lime-400">🌾 {foodStored}</p>
        </div>
        <div className="rounded-lg bg-stone-800/50 p-2">
          <p className="text-stone-500">Consumption</p>
          <p className="text-base font-bold text-amber-400">{population}/epoch</p>
        </div>
        <div className="rounded-lg bg-stone-800/50 p-2">
          <p className="text-stone-500">Growth</p>
          <p
            className={`text-base font-bold ${
              isGrowing
                ? "text-green-400"
                : isDeclining
                ? "text-red-400"
                : "text-stone-400"
            }`}
          >
            {growthRate > 0 ? "+" : ""}
            {growthRate}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {foodStored < population && (
        <div className="mt-2 rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-1.5 text-xs text-red-400">
          ⚠️ Food shortage! Population will decline without more farms.
        </div>
      )}
    </div>
  );
}
