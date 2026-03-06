"use client";

import { useEffect, useState } from "react";
import { ROLES } from "@/lib/constants";
import type { RoleName } from "@/types/database";
import { createBrowserClient } from "@supabase/ssr";

interface SubmissionStatusProps {
  gameId: string;
  teamId: string;
  currentRound: string;
}

interface RoleStatus {
  role: RoleName;
  submitted: boolean;
}

export default function SubmissionStatus({
  gameId,
  teamId,
  currentRound,
}: SubmissionStatusProps) {
  const [roleStatuses, setRoleStatuses] = useState<RoleStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/games/${gameId}/submissions/status`);
      if (!res.ok) return;
      const data = await res.json();

      const teamStatus = data.find(
        (t: { team_id: string }) => t.team_id === teamId
      );
      if (teamStatus) {
        const allRoles: RoleName[] = [
          "architect",
          "merchant",
          "diplomat",
          "lorekeeper",
          "warlord",
        ];
        setRoleStatuses(
          allRoles.map((role) => ({
            role,
            submitted: teamStatus.roles_submitted.includes(role),
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();

    // Subscribe to submissions Realtime
    const channel = supabase
      .channel(`submissions-${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "epoch_submissions",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, teamId, currentRound]);

  const allSubmitted = roleStatuses.every((r) => r.submitted);
  const pending = roleStatuses.filter((r) => !r.submitted);

  if (loading) {
    return (
      <div className="text-xs text-gray-500 animate-pulse">
        Checking submissions…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/40 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
        <span>Team Submissions</span>
        {allSubmitted && (
          <span className="text-green-400">✓ All submitted!</span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {roleStatuses.map(({ role, submitted }) => {
          const info = ROLES[role];
          return (
            <div
              key={role}
              className={`
                flex items-center gap-1 rounded-full px-2.5 py-1 text-xs
                ${
                  submitted
                    ? "bg-green-900/40 text-green-300 border border-green-700"
                    : "bg-gray-800 text-gray-500 border border-gray-700"
                }
              `}
            >
              <span>{info.emoji}</span>
              <span>{info.label}</span>
              <span>{submitted ? "✓" : "…"}</span>
            </div>
          );
        })}
      </div>

      {!allSubmitted && pending.length > 0 && (
        <p className="text-xs text-gray-500">
          Waiting for:{" "}
          {pending.map((p) => ROLES[p.role].label).join(", ")}
        </p>
      )}
    </div>
  );
}
