"use client";

/**
 * Lorekeeper Panel — DEFINE round leader (mythology + culture)
 * Shows: creature gallery, current creature prompt, codex, CI score, flag
 */

interface MythCreature {
  name: string;
  description: string;
  imageUrl: string | null;
  epoch: number;
}

interface LorekeeperPanelProps {
  creatures: MythCreature[];
  codex: {
    languageName: string | null;
    deityName: string | null;
    coreBelief: string | null;
    foundingLaw: string | null;
  } | null;
  hasWritingTech: boolean;
  ciScore: number;
  ciSpread: number;
  flagUrl: string | null;
  onCreateCreature?: () => void;
  onEditCodex?: () => void;
  onUploadFlag?: () => void;
}

export default function LorekeeperPanel({
  creatures,
  codex,
  hasWritingTech,
  ciScore,
  ciSpread,
  flagUrl,
  onCreateCreature,
  onEditCodex,
  onUploadFlag,
}: LorekeeperPanelProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        📖 Lorekeeper — Define & Create
      </h2>

      {/* CI Score */}
      <div className="rounded-lg border border-purple-700/30 bg-purple-900/10 p-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">Cultural Influence</div>
          <div className="text-2xl font-bold text-purple-400">🎭 {ciScore}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Spread</div>
          <div className="text-sm font-medium text-purple-300">
            {ciSpread} sub-zones
          </div>
        </div>
      </div>

      {/* Mythology Creatures */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">
            Mythology Gallery
          </h3>
          <button
            type="button"
            onClick={onCreateCreature}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
          >
            + Create Creature
          </button>
        </div>
        {creatures.length === 0 ? (
          <p className="text-xs text-gray-500 italic">
            No creatures created yet — your team decides together!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {creatures.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-700 bg-gray-800/50 p-3"
              >
                {c.imageUrl && (
                  <div className="h-20 w-full rounded bg-gray-700 mb-2 overflow-hidden">
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="text-sm font-medium text-white">{c.name}</div>
                <div className="text-xs text-gray-400">
                  {c.description.slice(0, 80)}…
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Epoch {c.epoch}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Civilization Codex (gated behind Writing tech) */}
      {hasWritingTech ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400">
              Civilization Codex
            </h3>
            <button
              type="button"
              onClick={onEditCodex}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
            >
              Edit Codex
            </button>
          </div>
          {codex ? (
            <div className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-3 space-y-1.5 text-xs">
              {codex.languageName && (
                <div>
                  <span className="text-gray-400">Language: </span>
                  <span className="text-amber-300">{codex.languageName}</span>
                </div>
              )}
              {codex.deityName && (
                <div>
                  <span className="text-gray-400">Deity: </span>
                  <span className="text-amber-300">{codex.deityName}</span>
                </div>
              )}
              {codex.coreBelief && (
                <div>
                  <span className="text-gray-400">Core Belief: </span>
                  <span className="text-amber-300">{codex.coreBelief}</span>
                </div>
              )}
              {codex.foundingLaw && (
                <div>
                  <span className="text-gray-400">Founding Law: </span>
                  <span className="text-amber-300">{codex.foundingLaw}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">
              Complete the codex for +5 Legacy bonus!
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-3 text-xs text-gray-500">
          🔒 Civilization Codex — requires Writing tech (Tier 1)
        </div>
      )}

      {/* Flag */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">
            Civilization Flag
          </h3>
          <button
            type="button"
            onClick={onUploadFlag}
            className="rounded-lg bg-gray-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-500"
          >
            Upload Flag
          </button>
        </div>
        {flagUrl ? (
          <div className="h-24 w-36 rounded border border-gray-700 overflow-hidden">
            <img
              src={flagUrl}
              alt="Civ flag"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No flag uploaded yet</p>
        )}
      </div>
    </div>
  );
}
