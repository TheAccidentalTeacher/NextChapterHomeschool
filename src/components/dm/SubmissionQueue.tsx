"use client";

import { useState, useEffect } from "react";
import { ROLES } from "@/lib/constants";
import type { RoleName } from "@/types/database";

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-300">
          Submissions — {roundType}
        </h3>
        {allDone && (
          <span className="rounded bg-green-800/40 px-2 py-0.5 text-xs text-green-400">
            ✓ All In
          </span>
        )}
      </div>

      {teams.length === 0 ? (
        <p className="text-xs text-stone-600">No teams found</p>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <div
              key={team.team_id}
              className={`rounded-lg border p-3 transition ${
                team.all_submitted
                  ? "border-green-800 bg-green-900/20"
                  : "border-stone-800 bg-stone-900/50"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-stone-200">
                  {team.civilization_name ?? team.team_name}
                </span>
                <span
                  className={`text-xs ${
                    team.all_submitted ? "text-green-400" : "text-amber-400"
                  }`}
                >
                  {team.roles_submitted.length}/
                  {team.roles_submitted.length + team.roles_pending.length}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(
                  Object.keys(ROLES) as RoleName[]
                ).map((role) => {
                  const submitted = team.roles_submitted.includes(role);
                  const pending = team.roles_pending.includes(role);
                  if (!submitted && !pending) return null;
                  return (
                    <button
                      key={role}
                      onClick={() =>
                        submitted && onOpenOverride?.(team.team_id, role)
                      }
                      disabled={!submitted}
                      className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs transition ${
                        submitted
                          ? "bg-green-800/40 text-green-400 cursor-pointer hover:bg-green-700/50"
                          : "bg-stone-800 text-stone-500 cursor-default"
                      }`}
                    >
                      <span>
                        {ROLES[role].emoji}
                      </span>
                      <span className="capitalize">{role}</span>
                      {submitted ? " ✓" : " …"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
