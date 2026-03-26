"use client";
// ============================================
// DMRosterPanel — Live attendance & role management
// Shows every team's members with:
//   - Green  = online  (heartbeat < 2 min ago)
//   - Yellow = stale   (2–5 min ago — may have closed laptop)
//   - Red    = offline (> 5 min or never pinged)
//   - Strikethrough = marked absent by DM
// DM can: toggle absent, change role, trigger auto-cover
// ============================================

import { useState, useEffect, useCallback } from "react";
import type { RoleName } from "@/types/database";

const ROLE_OPTIONS: { value: RoleName; label: string; emoji: string }[] = [
  { value: "architect",   label: "Architect",   emoji: "🏛" },
  { value: "merchant",    label: "Merchant",     emoji: "💰" },
  { value: "diplomat",    label: "Diplomat",     emoji: "🕊" },
  { value: "lorekeeper",  label: "Lorekeeper",   emoji: "📜" },
  { value: "warlord",     label: "Warlord",      emoji: "⚔️" },
];

interface RosterMember {
  id: string;
  team_id: string;
  display_name: string;
  assigned_role: RoleName;
  secondary_role: RoleName | null;
  is_absent: boolean;
  is_online: boolean;
  secs_ago: number | null;
  last_seen_at: string | null;
}

interface RosterTeam {
  id: string;
  name: string;
  civilization_name: string | null;
  region_id: number;
  members: RosterMember[];
}

function presenceLabel(m: RosterMember): {
  dot: string;
  label: string;
  tip: string;
} {
  if (m.is_absent) {
    return { dot: "bg-orange-500", label: "Absent", tip: "Marked absent by DM" };
  }
  if (m.secs_ago === null) {
    return { dot: "bg-stone-600", label: "Never seen", tip: "Student hasn't loaded the dashboard yet" };
  }
  if (m.secs_ago < 120) {
    return { dot: "bg-green-500 animate-pulse", label: "Online", tip: `Active ${m.secs_ago}s ago` };
  }
  if (m.secs_ago < 300) {
    return { dot: "bg-yellow-400", label: "Away?", tip: `Last seen ${Math.round(m.secs_ago / 60)}m ago — may have closed tab` };
  }
  return { dot: "bg-red-500", label: "Offline", tip: `Last seen ${Math.round(m.secs_ago / 60)}m ago` };
}

interface DMRosterPanelProps {
  gameId: string;
}

export default function DMRosterPanel({ gameId }: DMRosterPanelProps) {
  const [teams, setTeams] = useState<RosterTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // member id being updated

  const fetchRoster = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}/roster`);
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchRoster();
    const interval = setInterval(fetchRoster, 10_000);
    return () => clearInterval(interval);
  }, [fetchRoster]);

  // ── Actions ────────────────────────────────────────────────────────────
  async function toggleAbsent(teamId: string, memberId: string, currentAbsent: boolean) {
    setBusy(memberId);
    try {
      const newAbsent = !currentAbsent;
      await fetch(`/api/games/${gameId}/teams/${teamId}/students/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_absent: newAbsent }),
      });
      if (newAbsent) {
        // Auto-distribute the absent student's role to present teammates
        await fetch(`/api/games/${gameId}/auto-covers`, { method: "POST" });
      } else {
        // Student is back — clear their cover
        await fetch(`/api/games/${gameId}/covers`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ absent_member_id: memberId }),
        });
      }
      await fetchRoster();
    } finally {
      setBusy(null);
    }
  }

  async function changeRole(teamId: string, memberId: string, role: RoleName) {
    setBusy(memberId);
    try {
      await fetch(`/api/games/${gameId}/teams/${teamId}/students/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_role: role }),
      });
      await fetchRoster();
    } finally {
      setBusy(null);
    }
  }

  // ── Summary counts ──────────────────────────────────────────────────────
  const allMembers = teams.flatMap((t) => t.members);
  const onlineCount = allMembers.filter((m) => m.is_online && !m.is_absent).length;
  const absentCount = allMembers.filter((m) => m.is_absent).length;
  const offlineCount = allMembers.filter((m) => !m.is_online && !m.is_absent).length;

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-stone-500 text-sm">
        Loading roster…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 rounded-lg bg-stone-900/60 px-4 py-2.5 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="text-green-300 font-semibold">{onlineCount} online</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          <span className="text-red-300">{offlineCount} offline</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-orange-300">{absentCount} marked absent</span>
        </span>
        <span className="ml-auto text-stone-600 italic">auto-refreshes every 10 s</span>
      </div>

      {/* Team cards */}
      {teams.map((team) => {
        const presentCount = team.members.filter((m) => !m.is_absent).length;
        const teamOnline  = team.members.filter((m) => m.is_online && !m.is_absent).length;
        return (
          <div key={team.id} className="rounded-xl border border-stone-800 bg-stone-900/40">
            {/* Team header */}
            <div className="flex items-center gap-3 border-b border-stone-800 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-stone-200 text-sm">{team.name}</span>
                {team.civilization_name && (
                  <span className="ml-2 text-xs text-amber-400">{team.civilization_name}</span>
                )}
              </div>
              <span className="text-xs text-stone-500">
                {teamOnline}/{presentCount} online
              </span>
            </div>

            {/* Members */}
            <div className="divide-y divide-stone-800/50">
              {team.members.length === 0 && (
                <p className="px-4 py-3 text-xs text-stone-600 italic">No members assigned</p>
              )}
              {team.members.map((member) => {
                const { dot, label, tip } = presenceLabel(member);
                const isBusy = busy === member.id;
                return (
                  <div key={member.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                    {/* Presence dot */}
                    <span
                      className={`shrink-0 h-2.5 w-2.5 rounded-full ${dot}`}
                      title={tip}
                    />

                    {/* Name */}
                    <span
                      className={`flex-1 min-w-0 text-sm truncate ${
                        member.is_absent ? "line-through text-stone-600" : "text-stone-200"
                      }`}
                      title={`${label} — ${tip}`}
                    >
                      {member.display_name}
                      {member.secondary_role && !member.is_absent && (
                        <span className="ml-1.5 text-xs text-purple-400">+{member.secondary_role}</span>
                      )}
                    </span>

                    {/* Status badge */}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      member.is_absent
                        ? "bg-orange-900/50 text-orange-300"
                        : member.is_online
                        ? "bg-green-900/40 text-green-300"
                        : member.secs_ago !== null && member.secs_ago < 300
                        ? "bg-yellow-900/40 text-yellow-300"
                        : "bg-stone-800 text-stone-500"
                    }`}>
                      {label}
                    </span>

                    {/* Role dropdown */}
                    <select
                      value={member.assigned_role}
                      disabled={isBusy}
                      onChange={(e) => changeRole(team.id, member.id, e.target.value as RoleName)}
                      className="rounded border border-stone-700 bg-stone-800 px-2 py-1 text-xs text-stone-300 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.emoji} {r.label}
                        </option>
                      ))}
                    </select>

                    {/* Absent toggle */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => toggleAbsent(team.id, member.id, member.is_absent)}
                      title={member.is_absent ? "Mark as present (clear cover)" : "Mark as absent (auto-assign cover)"}
                      className={`rounded px-2 py-1 text-xs font-medium transition disabled:opacity-50 ${
                        member.is_absent
                          ? "bg-orange-700 text-orange-100 hover:bg-orange-600"
                          : "bg-stone-800 text-stone-400 hover:bg-orange-900/40 hover:text-orange-300"
                      }`}
                    >
                      {isBusy ? "…" : member.is_absent ? "↩ Back" : "Absent"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
