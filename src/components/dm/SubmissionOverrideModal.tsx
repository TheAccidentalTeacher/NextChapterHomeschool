"use client";

import { useState, useEffect } from "react";
import type { RoleName } from "@/types/database";
import { ROLES } from "@/lib/constants";

interface Submission {
  id: string;
  content: string;
  role: RoleName;
  round_type: string;
  submitted_by: string;
  dm_score: number | null;
  dm_feedback: string | null;
}

interface SubmissionOverrideModalProps {
  gameId: string;
  teamId: string;
  teamName: string;
  role: RoleName;
  epoch: number;
  onClose: () => void;
}

export default function SubmissionOverrideModal({
  gameId,
  teamId,
  teamName,
  role,
  epoch,
  onClose,
}: SubmissionOverrideModalProps) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number>(3);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/games/${gameId}/submissions?epoch=${epoch}&team=${teamId}&role=${role}`
        );
        if (res.ok) {
          const data = await res.json();
          const sub = data.submissions?.[0];
          if (sub) {
            setSubmission(sub);
            setScore(sub.dm_score ?? 3);
            setFeedback(sub.dm_feedback ?? "");
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [gameId, teamId, role, epoch]);

  async function handleSave() {
    if (!submission) return;
    setSaving(true);
    try {
      await fetch(`/api/games/${gameId}/submissions/${submission.id}/score`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dm_score: score,
          dm_feedback: feedback || null,
        }),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-stone-700 bg-stone-900 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-200">Review Submission</h2>
            <p className="text-sm text-stone-400">
              {teamName} · {ROLES[role].emoji} {ROLES[role].label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 transition hover:text-stone-300"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-stone-500">Loading…</p>
        ) : !submission ? (
          <p className="py-8 text-center text-stone-500">
            No submission found for this role.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Submission text */}
            <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
              <p className="whitespace-pre-wrap text-sm text-stone-300">
                {submission.content}
              </p>
            </div>

            {/* Score slider */}
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-400">
                Justification Score (1-5)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center text-lg font-bold text-amber-400">
                  {score}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-stone-600">
                <span>Weak</span>
                <span>Average</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* DM Feedback */}
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-400">
                DM Feedback (optional — shown to student)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:border-red-500 focus:outline-none"
                placeholder="Good historical connection..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-stone-700 px-4 py-2 text-sm text-stone-400 transition hover:border-stone-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Score"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
