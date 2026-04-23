// ============================================
// RoundSubmissionCard — Student round decision UI
// Decision 27: Multiple-choice + justification per round
// Decision 28: 2+ sentence justification requirement
//
// Renders a submission card for a single round where
// the student must:
//   1. Select an option (or free-text if allowed)
//   2. Write a justification (minimum 2 sentences)
//   3. Submit to /api/games/[id]/submissions
//
// The card displays the historical context, prompt text,
// and available options. After submission, it shows a
// confirmation with the selected answer.
// ============================================

"use client";

import { useEffect, useState } from "react";
import JustificationField from "./JustificationField";
import { ROLES } from "@/lib/constants";
import type { RoleName } from "@/types/database";
import RoundMapSelector, { type RoundMapMode } from "@/components/game/RoundMapSelector";

interface QuestionOption {
  id: string;
  label: string;
  description?: string;
}

interface RoundSubmissionCardProps {
  gameId: string;
  teamId: string;
  role: RoleName;
  roundType: string;
  epoch: number;
  promptText: string;
  options: QuestionOption[];
  historicalContext: string;
  allowFreeText: boolean;
  grade: "6th" | "7_8th";
  onSubmitted?: () => void;
  // Phase 4 — map-skill data (optional). When provided, RoundMapSelector
  // renders between options and justification. Kids click the map each round.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subZones?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamColors?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamRegions?: any[];
}

export default function RoundSubmissionCard({
  gameId,
  teamId,
  role,
  roundType,
  epoch,
  promptText,
  options,
  historicalContext,
  allowFreeText,
  grade,
  onSubmitted,
  subZones,
  teamColors,
  teamRegions,
}: RoundSubmissionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  // Phase 4 — map-skill selection per round (Team mode)
  const [mapSelection, setMapSelection] = useState<{
    subZoneId: string;
    regionId: number;
    targetTeamId?: string;
    terrainType?: string;
    hint?: string;
  } | null>(null);
  const hasMapData = Boolean(subZones && subZones.length > 0 && teamColors);
  const roundModeUpper = roundType.toUpperCase();
  const isActionRound =
    roundModeUpper === "BUILD" ||
    roundModeUpper === "EXPAND" ||
    roundModeUpper === "DEFINE" ||
    roundModeUpper === "DEFEND";

  const roleInfo = ROLES[role];
  const sentenceCount = (justification.match(/[.!?]+/g) || []).length;
  const isJustificationValid = sentenceCount >= 2;
  const hasSelection = selectedOption !== null || (allowFreeText && freeText.trim().length > 0);
  const canSubmit = hasSelection && isJustificationValid && !isSubmitting;

  useEffect(() => {
    let active = true;

    async function checkExisting() {
      try {
        const res = await fetch(
          `/api/games/${gameId}/submissions?epoch=${epoch}&team_id=${teamId}&round_type=${roundType}&role=${role}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data) || data.length === 0) return;

        const existing = data[0] as { content?: string | { option_selected?: string | null; justification_text?: string; free_text_action?: string | null } };
        let parsed: { option_selected?: string | null; justification_text?: string; free_text_action?: string | null } | null = null;
        if (typeof existing.content === "string") {
          try {
            parsed = JSON.parse(existing.content);
          } catch {
            parsed = null;
          }
        } else if (existing.content && typeof existing.content === "object") {
          parsed = existing.content;
        }

        setSubmitted(true);
        if (parsed) {
          setSelectedOption(parsed.option_selected ?? null);
          setJustification(parsed.justification_text ?? "");
          setFreeText(parsed.free_text_action ?? "");
        }
      } catch {
        // ignore
      } finally {
        if (active) setCheckingExisting(false);
      }
    }

    checkExisting();
    return () => {
      active = false;
    };
  }, [epoch, gameId, role, roundType, teamId]);

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/games/${gameId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          role,
          round_type: roundType,
          option_selected: selectedOption,
          justification_text: justification,
          free_text_action: freeText || JSON.stringify({ map_selection: mapSelection ?? null }),
          map_selection: mapSelection ?? null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Submission failed");
      }

      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (checkingExisting) {
    return (
      <div className="rounded-xl border border-stone-700 bg-stone-800/40 p-6 text-center">
        <p className="text-sm text-stone-400">Checking your submission…</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-700 bg-green-900/20 p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-green-300 font-medium">Submitted!</p>
        <p className="text-sm text-gray-400 mt-1">
          Waiting for teammates to finish…
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{roleInfo.emoji}</span>
          <span className="text-sm font-bold text-white uppercase tracking-wide">
            {roundType} Round
          </span>
          <span className="text-xs text-gray-500">Epoch {epoch}</span>
        </div>
        <span
          className="rounded-full bg-gray-700 px-3 py-1 text-xs font-medium"
          style={{ color: "#e0e0e0" }}
        >
          {roleInfo.label}
        </span>
      </div>

      {/* Historical Context */}
      <div className="rounded-lg bg-gray-900/50 border border-gray-700 p-3">
        <p className="text-xs text-gray-400 italic">{historicalContext}</p>
      </div>

      {/* Question */}
      <p className="text-sm text-white leading-relaxed">{promptText}</p>

      {/* Options */}
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setSelectedOption(opt.id);
              setFreeText("");
            }}
            className={`
              w-full rounded-lg border p-3 text-left transition-all text-sm
              ${
                selectedOption === opt.id
                  ? "border-blue-500 bg-blue-500/15 text-white"
                  : "border-gray-600 bg-gray-900/30 text-gray-300 hover:border-gray-500"
              }
            `}
          >
            <span className="font-medium">{opt.label}</span>
            {opt.description && (
              <span className="block text-xs text-gray-400 mt-0.5">
                {opt.description}
              </span>
            )}
          </button>
        ))}

        {allowFreeText && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSelectedOption(null)}
              className={`
                w-full rounded-lg border p-3 text-left transition-all text-sm
                ${
                  selectedOption === null && freeText
                    ? "border-purple-500 bg-purple-500/15 text-white"
                    : "border-gray-600 bg-gray-900/30 text-gray-300 hover:border-gray-500"
                }
              `}
            >
              💡 Propose your own action
            </button>
            {selectedOption === null && (
              <input
                type="text"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Describe your proposed action…"
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            )}
          </div>
        )}
      </div>

      {/* Map-skill selector (Phase 4 — Team mode kids click the map each round) */}
      {hasMapData && isActionRound ? (
        <RoundMapSelector
          mode={roundModeUpper as RoundMapMode}
          myTeamId={teamId}
          subZones={subZones!}
          teamColors={teamColors!}
          teamRegions={teamRegions}
          selectedSubZoneId={mapSelection?.subZoneId ?? null}
          onSelect={(sel) => {
            setMapSelection({
              subZoneId: sel.subZoneId,
              regionId: sel.regionId,
              targetTeamId: sel.targetTeamId,
              terrainType: sel.terrainType,
              hint: sel.hint,
            });
          }}
        />
      ) : null}

      {/* Justification */}
      <JustificationField
        grade={grade}
        role={role}
        value={justification}
        onValueChange={setJustification}
      />

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`
          w-full rounded-lg py-3 text-sm font-bold uppercase tracking-wide transition-all
          ${
            canSubmit
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }
        `}
      >
        {isSubmitting ? "Submitting…" : "Submit Decision"}
      </button>
    </div>
  );
}
