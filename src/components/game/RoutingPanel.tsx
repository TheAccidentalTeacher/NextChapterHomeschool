// ============================================
// RoutingPanel — Resource allocation splitter
// Lets the leading-role student split earned
// resources into spend / contribute / bank buckets
// after each round. Decision 37: Resource routing.
// ============================================

"use client";

import { useState } from "react";
import { RESOURCES } from "@/lib/constants";
import type { ResourceType } from "@/types/database";

interface RoutingPanelProps {
  gameId: string;
  teamId: string;
  roundType: string;
  totalEarned: number;
  resourceType: ResourceType;
  onComplete: () => void;
}

type SplitKey = "spend" | "contribute" | "bank";

export default function RoutingPanel({
  gameId,
  teamId,
  roundType,
  totalEarned,
  resourceType,
  onComplete,
}: RoutingPanelProps) {
  const [split, setSplit] = useState<Record<SplitKey, number>>({
    spend: Math.ceil(totalEarned * 0.5),
    contribute: Math.floor(totalEarned * 0.3),
    bank: Math.floor(totalEarned * 0.2),
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const total = split.spend + split.contribute + split.bank;
  const isValid = total === totalEarned;

  function adjust(key: SplitKey, delta: number) {
    setSplit((prev) => {
      const newVal = Math.max(0, Math.min(totalEarned, prev[key] + delta));
      const diff = newVal - prev[key];
      // Redistribute the difference from the other two keys proportionally
      const otherKeys = (["spend", "contribute", "bank"] as SplitKey[]).filter(
        (k) => k !== key
      );
      const otherTotal = otherKeys.reduce((s, k) => s + prev[k], 0);
      const next = { ...prev, [key]: newVal };

      if (otherTotal > 0 && diff !== 0) {
        let remaining = -diff;
        for (const ok of otherKeys) {
          const portion = Math.round((prev[ok] / otherTotal) * remaining);
          next[ok] = Math.max(0, prev[ok] + portion);
        }
        // Fix rounding
        const nextTotal = next.spend + next.contribute + next.bank;
        if (nextTotal !== totalEarned) {
          next[otherKeys[0]] += totalEarned - nextTotal;
        }
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/games/${gameId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          round_type: roundType,
          total_earned: totalEarned,
          spend: split.spend,
          contribute: split.contribute,
          bank: split.bank,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        onComplete();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-800 bg-green-900/20 p-6 text-center">
        <span className="text-3xl">✅</span>
        <p className="mt-2 text-sm text-green-400">Resources routed!</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-300">
          Route {RESOURCES[resourceType]?.emoji}{" "}
          {RESOURCES[resourceType]?.label ?? resourceType}
        </h3>
        <span
          className={`rounded px-2 py-0.5 text-xs font-bold ${
            isValid
              ? "bg-green-800/30 text-green-400"
              : "bg-red-800/30 text-red-400"
          }`}
        >
          {total} / {totalEarned}
        </span>
      </div>

      <div className="space-y-4">
        {([
          { key: "spend" as SplitKey, label: "⚡ Spend Now", desc: "Use immediately for buildings, units, or actions" },
          { key: "contribute" as SplitKey, label: "🏆 Contribute to Wonder", desc: "Invest in a collaborative wonder project" },
          { key: "bank" as SplitKey, label: "🏦 Bank", desc: "Save for later (10% decay per epoch)" },
        ]).map(({ key, label, desc }) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-stone-200">
                  {label}
                </span>
                <p className="text-xs text-stone-500">{desc}</p>
              </div>
              <span className="text-lg font-bold text-stone-200">
                {split[key]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjust(key, -1)}
                className="rounded bg-stone-800 px-2 py-0.5 text-sm text-stone-400 hover:bg-stone-700"
              >
                −
              </button>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-stone-800">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{
                      width: `${
                        totalEarned > 0 ? (split[key] / totalEarned) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => adjust(key, 1)}
                className="rounded bg-stone-800 px-2 py-0.5 text-sm text-stone-400 hover:bg-stone-700"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className="mt-4 w-full rounded-lg bg-amber-600 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
      >
        {submitting ? "Routing…" : "Confirm Routing"}
      </button>
    </div>
  );
}
