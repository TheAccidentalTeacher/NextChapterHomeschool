"use client";

// ============================================
// FoundingModal — Decision 90
// Fires when a team places their FIRST building
// in any sub-zone. Player names the settlement
// and selects a founding claim bonus.
// ============================================

import { useState } from "react";

export type FoundingClaimType = "first_settler" | "resource_hub" | "natural_landmark";

interface FoundingModalProps {
  subZoneName: string;
  terrainType: string;
  dominantResource: string;
  onConfirm: (settlementName: string, claim: FoundingClaimType) => void;
  onCancel: () => void;
}

const CLAIMS: {
  key: FoundingClaimType;
  emoji: string;
  name: string;
  description: string;
}[] = [
  {
    key: "first_settler",
    emoji: "🏕️",
    name: "First Settler",
    description:
      "Small yield bonus that decays at a random hidden rate (1–4 epochs). High risk, high early reward.",
  },
  {
    key: "resource_hub",
    emoji: "⛏️",
    name: "Resource Hub",
    description:
      "Permanent +15% bonus to the dominant terrain resource. Steady, reliable growth.",
  },
  {
    key: "natural_landmark",
    emoji: "⛰️",
    name: "Natural Landmark",
    description:
      "Permanent +2 Legacy every RESOLVE. Your settlement is famous — flag pin visible on projector map.",
  },
];

export default function FoundingModal({
  subZoneName,
  terrainType,
  dominantResource,
  onConfirm,
  onCancel,
}: FoundingModalProps) {
  const [name, setName] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<FoundingClaimType | null>(
    null
  );

  const canSubmit = name.trim().length >= 2 && name.length <= 32 && selectedClaim !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-amber-700/50 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="border-b border-amber-700/30 bg-amber-900/10 px-6 py-4 rounded-t-xl">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            🏛️ Settlement Founded!
          </h2>
          <p className="text-sm text-amber-200/70 mt-1">
            Your civilization's first structure rises in{" "}
            <span className="font-medium text-white">{subZoneName}</span>{" "}
            ({terrainType}).
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Settlement Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Name Your Settlement
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 32))}
              placeholder="e.g. New Glennallen, Copperhold, The Iron Reach..."
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              {name.length}/32 characters — this name appears on the map!
            </div>
          </div>

          {/* Founding Claim Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Choose Your Founding Claim
            </label>
            <div className="space-y-2">
              {CLAIMS.map((claim) => (
                <button
                  key={claim.key}
                  type="button"
                  onClick={() => setSelectedClaim(claim.key)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedClaim === claim.key
                      ? "border-amber-500 bg-amber-900/20 ring-1 ring-amber-500"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{claim.emoji}</span>
                    <span className="text-sm font-bold text-white">
                      {claim.name}
                    </span>
                    {claim.key === "resource_hub" && (
                      <span className="text-xs text-blue-400 ml-auto">
                        +15% {dominantResource}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 ml-7">
                    {claim.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-700 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (canSubmit) onConfirm(name.trim(), selectedClaim!);
            }}
            className={`rounded-lg px-5 py-2 text-sm font-bold transition-all ${
              canSubmit
                ? "bg-amber-600 text-white hover:bg-amber-500"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            🏛️ Found Settlement
          </button>
        </div>
      </div>
    </div>
  );
}
