// ============================================
// SubmissionQueue — DM submission review grid
// Live view of which roles on each team have
// submitted vs. pending for the current round.
// Click a team row to expand and see each
// submission's chosen option + justification.
// ============================================

"use client";

import { useState, useEffect } from "react";
import { ROLES } from "@/lib/constants";
import type { RoleName } from "@/types/database";

interface SubmissionDetail {
  role: RoleName;
  option_selected: string | null;
  justification_text: string | null;
  free_text_action: string | null;
  submitted_at: string | null;
  score: number | null;
}

interface TeamSubmissionStatus {
  team_id: string;
  team_name: string;
  civilization_name: string | null;
  roles_submitted: RoleName[];
  roles_pending: RoleName[];
  all_submitted: boolean;
}

interface SubmissionQueueProps {
  gameId: string;
  epoch: number;
  roundType: string;
  onOpenOverride?: (teamId: string, role: RoleName) => void;
}

export default function SubmissionQueue({
  gameId,
  epoch,
  roundType,
  onOpenOverride,
}: SubmissionQueueProps) {
  const [teams, setTeams] = useState<TeamSubmissionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, SubmissionDetail[]>>({}); // teamId → details
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  async function clearSubmissions() {
    if (!confirm("Clear ALL submissions for the current round? This cannot be undone.")) return;
    setClearing(true);
    try {
      await fetch(`/api/games/${gameId}/submissions/status`, { method: "DELETE" });
      setTeams([]);
      setDetails({});
      setExpandedTeam(null);
      await fetchStatus();
    } finally {
      setClearing(false);
    }
  }

  async function fetchStatus() {
    try {
      const res = await fetch(
        `/api/games/${gameId}/submissions/status?epoch=${epoch}&round=${roundType}`
      );
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function fetchDetails(teamId: string) {
    if (details[teamId]) {
      // toggle off if already loaded
      setExpandedTeam(prev => prev === teamId ? null : teamId);
      return;
    }
    setDetailsLoading(teamId);
    setExpandedTeam(teamId);
    try {
      const res = await fetch(
        `/api/games/${gameId}/submissions?epoch=${epoch}&round_type=${roundType}&team_id=${teamId}`
      );
      if (res.ok) {
        const data = await res.json();
        const subs: SubmissionDetail[] = (data.submissions ?? []).map((s: {
          role: RoleName;
          content: string;
          submitted_at: string | null;
          score: number | null;
        }) => {
          let parsed: { option_selected?: string; justification_text?: string; free_text_action?: string } = {};
          try { parsed = JSON.parse(s.content ?? "{}"); } catch { /* ignore */ }
          return {
            role: s.role,
            option_selected: parsed.option_selected ?? null,
            justification_text: parsed.justification_text ?? null,
            free_text_action: parsed.free_text_action ?? null,
            submitted_at: s.submitted_at ?? null,
            score: s.score ?? null,
          };
        });
        setDetails(prev => ({ ...prev, [teamId]: subs }));
      }
    } finally {
      setDetailsLoading(null);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, epoch, roundType]);

  if (loading) {
    return (
      <div className="p-4 text-stone-500 text-sm">Loading submissions…</div>
    );
  }

  const allDone = teams.length > 0 && teams.every((t) => t.all_submitted);
  const sortedTeams = [...teams].sort((a, b) => Number(b.all_submitted) - Number(a.all_submitted));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-300">
          Submissions — {roundType}
        </h3>
        <div className="flex items-center gap-2">
          <span className="rounded bg-stone-800 px-2 py-0.5 text-xs text-stone-300">
            {teams.filter((t) => t.all_submitted).length}/{teams.length} teams ready
          </span>
          {allDone && (
            <span className="rounded bg-green-800/40 px-2 py-0.5 text-xs text-green-400">
              ✓ All In
            </span>
          )}
          <button
            type="button"
            onClick={clearSubmissions}
            disabled={clearing}
            title="Clear stale submissions from a previous session"
            className="rounded bg-red-900/40 px-2 py-0.5 text-xs text-red-400 hover:bg-red-800/60 transition disabled:opacity-50"
          >
            {clearing ? "Clearing…" : "🗑 Clear"}
          </button>
        </div>
      </div>

      {teams.length > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-stone-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${(teams.filter((t) => t.all_submitted).length / teams.length) * 100}%` }}
          />
        </div>
      )}

      {teams.length === 0 ? (
        <p className="text-xs text-stone-600">No teams found</p>
      ) : (
        <div className="space-y-2">
          {sortedTeams.map((team) => {
            const isExpanded = expandedTeam === team.team_id;
            const teamDetails = details[team.team_id] ?? [];
            const isLoadingDetails = detailsLoading === team.team_id;
            return (
              <div
                key={team.team_id}
                className={`rounded-lg border transition ${
                  team.all_submitted
                    ? "border-green-800 bg-green-900/20"
                    : "border-stone-800 bg-stone-900/50"
                }`}
              >
                {/* Header row — click to expand */}
                <button
                  type="button"
                  onClick={() => fetchDetails(team.team_id)}
                  className="w-full text-left p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-stone-200">
                        {team.civilization_name ?? team.team_name}
                      </span>
                      <div className="mt-0.5 text-xs text-stone-500">
                        {team.all_submitted ? "Ready for routing" : "Still submitting"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className={`text-xs font-semibold ${team.all_submitted ? "text-green-400" : "text-amber-400"}`}>
                          {team.roles_submitted.length}/{team.roles_submitted.length + team.roles_pending.length}
                        </div>
                        <div className={`text-[11px] ${team.all_submitted ? "text-green-400" : "text-stone-500"}`}>
                          {team.all_submitted ? "✓ TEAM IN" : `${team.roles_pending.length} pending`}
                        </div>
                      </div>
                      <span className="text-stone-600 text-xs">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(ROLES) as RoleName[]).map((role) => {
                      const submitted = team.roles_submitted.includes(role);
                      const pending = team.roles_pending.includes(role);
                      if (!submitted && !pending) return null;
                      return (
                        <span
                          key={role}
                          className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs ${
                            submitted
                              ? "bg-green-800/40 text-green-400"
                              : "bg-stone-800 text-stone-500"
                          }`}
                        >
                          <span>{ROLES[role].emoji}</span>
                          <span className="capitalize">{role}</span>
                          {submitted ? " ✓" : " …"}
                        </span>
                      );
                    })}
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="border-t border-stone-800 px-3 pb-3 pt-2 space-y-3">
                    {isLoadingDetails && (
                      <p className="text-xs text-stone-500">Loading submissions…</p>
                    )}
                    {!isLoadingDetails && team.roles_pending.length > 0 && (
                      <div className="rounded bg-stone-900 px-3 py-2">
                        <p className="text-xs font-semibold text-stone-400 mb-1">⏳ Still waiting on:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {team.roles_pending.map((role) => (
                            <span key={role} className="rounded bg-stone-800 px-2 py-0.5 text-xs text-stone-400 capitalize">
                              {ROLES[role]?.emoji} {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!isLoadingDetails && teamDetails.map((sub) => (
                      <div key={sub.role} className="rounded border border-stone-700 bg-stone-900/60 px-3 py-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-stone-300 capitalize">
                            {ROLES[sub.role]?.emoji} {sub.role}
                          </span>
                          <div className="flex items-center gap-2">
                            {sub.score !== null && (
                              <span className="rounded bg-amber-900/50 px-1.5 py-0.5 text-xs text-amber-300">
                                {sub.score} pts
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onOpenOverride?.(team.team_id, sub.role); }}
                              className="rounded bg-stone-700 px-2 py-0.5 text-xs text-stone-300 hover:bg-stone-600 transition"
                            >
                              Override
                            </button>
                          </div>
                        </div>
                        {sub.option_selected && (
                          <p className="text-xs text-amber-300">
                            <span className="text-stone-500">Action: </span>{sub.option_selected}
                          </p>
                        )}
                        {sub.free_text_action && (
                          <p className="text-xs text-sky-300">
                            <span className="text-stone-500">Proposed: </span>{sub.free_text_action}
                          </p>
                        )}
                        {sub.justification_text && (
                          <p className="text-xs text-stone-300 leading-relaxed">
                            <span className="text-stone-500">Justification: </span>{sub.justification_text}
                          </p>
                        )}
                      </div>
                    ))}
                    {!isLoadingDetails && teamDetails.length === 0 && team.roles_submitted.length === 0 && (
                      <p className="text-xs text-stone-600 italic">No submissions yet</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
