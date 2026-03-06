"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VICTORY_TYPES } from "@/lib/constants";

type ClassPeriod = "6th" | "7-8";
type EndgameType = "lunar_race" | "mars_colonization" | "warp_speed";

export default function GameSetupPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [classPeriod, setClassPeriod] = useState<ClassPeriod>("6th");
  const [roundTimer, setRoundTimer] = useState(8);
  const [epochCount, setEpochCount] = useState(15);
  const [endgameType, setEndgameType] = useState<EndgameType>("lunar_race");
  const [victoryConditions, setVictoryConditions] = useState<string[]>(
    VICTORY_TYPES.map((v) => v.key)
  );

  // Update round timer default when class period changes
  const handleClassPeriodChange = (period: ClassPeriod) => {
    setClassPeriod(period);
    setRoundTimer(period === "6th" ? 8 : 5);
  };

  const toggleVictory = (key: string) => {
    setVictoryConditions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Game name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          class_period: classPeriod,
          round_timer_minutes: roundTimer,
          epoch_count: epochCount,
          endgame_epoch_type: endgameType,
          victory_conditions: victoryConditions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create game");
      }

      router.push("/dm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-red-400">Create New Game</h1>
      <p className="mt-1 text-sm text-stone-400">
        Set up a new ClassCiv game for your class.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Game Name */}
        <div>
          <label
            htmlFor="game-name"
            className="block text-sm font-medium text-stone-300"
          >
            Game Name
          </label>
          <input
            id="game-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 6th Grade World History — Spring 2026"
            className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-stone-200 placeholder:text-stone-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Class Period */}
        <div>
          <label className="block text-sm font-medium text-stone-300">
            Class Period
          </label>
          <div className="mt-2 flex gap-3">
            {(["6th", "7-8"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => handleClassPeriodChange(period)}
                className={`rounded-lg border px-5 py-2 text-sm font-medium transition ${
                  classPeriod === period
                    ? "border-red-500 bg-red-500/20 text-red-400"
                    : "border-stone-700 bg-stone-900 text-stone-400 hover:border-stone-500"
                }`}
              >
                {period === "6th" ? "6th Grade" : "7th-8th Grade"}
              </button>
            ))}
          </div>
        </div>

        {/* Round Timer */}
        <div>
          <label
            htmlFor="round-timer"
            className="block text-sm font-medium text-stone-300"
          >
            Round Timer (minutes)
          </label>
          <p className="text-xs text-stone-500">
            Default: {classPeriod === "6th" ? "8" : "5"} min for{" "}
            {classPeriod === "6th" ? "6th grade" : "7-8th grade"}
          </p>
          <input
            id="round-timer"
            type="number"
            min={1}
            max={20}
            value={roundTimer}
            onChange={(e) => setRoundTimer(Number(e.target.value))}
            className="mt-1 w-24 rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-stone-200 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Epoch Count */}
        <div>
          <label
            htmlFor="epoch-count"
            className="block text-sm font-medium text-stone-300"
          >
            Number of Epochs
          </label>
          <p className="text-xs text-stone-500">
            Standard game is 15 epochs
          </p>
          <input
            id="epoch-count"
            type="number"
            min={5}
            max={30}
            value={epochCount}
            onChange={(e) => setEpochCount(Number(e.target.value))}
            className="mt-1 w-24 rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-stone-200 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Victory Conditions */}
        <div>
          <label className="block text-sm font-medium text-stone-300">
            Victory Conditions
          </label>
          <p className="text-xs text-stone-500">
            Select which victory conditions are active for this game
          </p>
          <div className="mt-2 space-y-2">
            {VICTORY_TYPES.map((v) => (
              <label
                key={v.key}
                className="flex items-center gap-3 rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 transition hover:border-stone-600"
              >
                <input
                  type="checkbox"
                  checked={victoryConditions.includes(v.key)}
                  onChange={() => toggleVictory(v.key)}
                  className="size-4 rounded border-stone-600 bg-stone-800 text-red-500 focus:ring-red-500"
                />
                <div>
                  <span className="text-sm font-medium text-stone-200">
                    {v.label}
                  </span>
                  <span className="ml-2 text-xs text-stone-500">
                    {v.description}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Endgame Epoch Type */}
        <div>
          <label className="block text-sm font-medium text-stone-300">
            Endgame Epoch Type
          </label>
          <p className="text-xs text-stone-500">
            The narrative wild-card epoch at the end of the game
          </p>
          <div className="mt-2 space-y-2">
            {[
              {
                key: "lunar_race",
                label: "🌙 Lunar Race",
                desc: "First civilization to reach the moon wins",
              },
              {
                key: "mars_colonization",
                label: "🔴 Mars Colonization",
                desc: "Build a self-sustaining Mars colony",
              },
              {
                key: "warp_speed",
                label: "🚀 Warp Speed",
                desc: "Achieve faster-than-light travel",
              },
            ].map((opt) => (
              <label
                key={opt.key}
                className="flex items-center gap-3 rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 transition hover:border-stone-600"
              >
                <input
                  type="radio"
                  name="endgame-type"
                  checked={endgameType === opt.key}
                  onChange={() => setEndgameType(opt.key as EndgameType)}
                  className="size-4 border-stone-600 bg-stone-800 text-red-500 focus:ring-red-500"
                />
                <div>
                  <span className="text-sm font-medium text-stone-200">
                    {opt.label}
                  </span>
                  <span className="ml-2 text-xs text-stone-500">
                    {opt.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Game"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dm")}
            className="rounded-lg border border-stone-700 px-6 py-2 text-sm text-stone-400 transition hover:border-stone-500 hover:text-stone-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
