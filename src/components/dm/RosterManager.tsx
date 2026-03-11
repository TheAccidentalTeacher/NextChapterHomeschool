"use client";

import { useState, useEffect, useRef } from "react";
import { ROLES, REGIONS } from "@/lib/constants";
import type { RoleName } from "@/types/database";

interface ClerkUser {
  id: string;
  displayName: string;
  email: string;
  username: string;
}

interface AddStudentFormProps {
  gameId: string;
  teamId: string;
  onAdded: () => void;
}

function AddStudentForm({ gameId, teamId, onAdded }: AddStudentFormProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClerkUser[]>([]);
  const [selected, setSelected] = useState<ClerkUser | null>(null);
  const [role, setRole] = useState<RoleName>("architect");
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live search as teacher types
  useEffect(() => {
    if (selected) return; // don't re-search once picked
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/dm/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.users ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query, selected]);

  function pick(user: ClerkUser) {
    setSelected(user);
    setQuery(user.displayName || user.email || user.username);
    setResults([]);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    setResults([]);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/games/${gameId}/teams/${teamId}/students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerk_user_id: selected.id,
            display_name: selected.displayName || selected.username || selected.email,
            assigned_role: role,
          }),
        }
      );

      if (res.ok) {
        clear();
        setRole("architect");
        onAdded();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* User search */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or email…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (selected) clear(); }}
              className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1 text-xs text-stone-300 placeholder:text-stone-600 focus:border-red-500 focus:outline-none"
            />
            {searching && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-500">…</span>
            )}
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleName)}
            className="rounded border border-stone-700 bg-stone-900 px-2 py-1 text-xs text-stone-300 focus:border-red-500 focus:outline-none"
          >
            {Object.entries(ROLES).map(([key, r]) => (
              <option key={key} value={key}>
                {r.emoji} {r.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving || !selected}
            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {saving ? "…" : "Add"}
          </button>
        </div>

        {/* Dropdown results */}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-stone-700 bg-stone-900 shadow-xl">
            {results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => pick(u)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition hover:bg-stone-800"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-700 text-stone-300">
                  {(u.displayName || u.username || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-stone-200">{u.displayName || u.username}</div>
                  <div className="text-stone-500">{u.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected indicator */}
        {selected && (
          <div className="mt-1 flex items-center gap-2 rounded bg-green-950/50 px-2 py-1">
            <span className="text-xs text-green-400">✓ {selected.displayName || selected.username}</span>
            <button type="button" onClick={clear} className="ml-auto text-xs text-stone-500 hover:text-stone-300">✕</button>
          </div>
        )}
      </div>
    </form>
  );
}

interface CreateTeamFormProps {
  gameId: string;
  onCreated: () => void;
}

function CreateTeamForm({ gameId, onCreated, usedRegionIds }: CreateTeamFormProps & { usedRegionIds: number[] }) {
  const [teamNumber, setTeamNumber] = useState(1);
  const [regionId, setRegionId] = useState<number>(() =>
    REGIONS.find((r) => !usedRegionIds.includes(r.id))?.id ?? 1
  );
  const [teamName, setTeamName] = useState("");
  const [saving, setSaving] = useState(false);

  const isDuplicate = usedRegionIds.includes(regionId);

  const handleSubmit = async (e: React.FormEvent) => {
    if (isDuplicate) return;
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/games/${gameId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_number: teamNumber,
          region_id: regionId,
          name: teamName.trim() || undefined,
        }),
      });

      if (res.ok) {
        setTeamName("");
        setTeamNumber((n) => n + 1);
        onCreated();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-stone-700 bg-stone-900/30 p-4"
    >
      <div>
        <label className="block text-xs text-stone-500">Team #</label>
        <input
          type="number"
          min={1}
          max={12}
          value={teamNumber}
          onChange={(e) => setTeamNumber(Number(e.target.value))}
          className="mt-1 w-16 rounded border border-stone-700 bg-stone-900 px-2 py-1 text-sm text-stone-300 focus:border-red-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs text-stone-500">Region</label>
        <select
          value={regionId}
          onChange={(e) => setRegionId(Number(e.target.value))}
          className="mt-1 rounded border border-stone-700 bg-stone-900 px-2 py-1 text-sm text-stone-300 focus:border-red-500 focus:outline-none"
        >
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id} disabled={usedRegionIds.includes(r.id)}>
              {r.id}. {r.label}{usedRegionIds.includes(r.id) ? " (taken)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-stone-500">
          Name (optional)
        </label>
        <input
          type="text"
          placeholder={`Team ${teamNumber}`}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="mt-1 w-40 rounded border border-stone-700 bg-stone-900 px-2 py-1 text-sm text-stone-300 placeholder:text-stone-600 focus:border-red-500 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        {isDuplicate && (
          <p className="text-xs text-red-400">⚠ That region is already taken by another team</p>
        )}
        <button
          type="submit"
          disabled={saving || isDuplicate}
          className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          {saving ? "Creating…" : "+ Add Team"}
        </button>
      </div>
    </form>
  );
}

// ---- Main Export ----

interface TeamData {
  id: string;
  name: string;
  civilization_name: string | null;
  region_id: number;
  population: number;
  team_members?: {
    id: string;
    display_name: string;
    assigned_role: RoleName;
    is_absent: boolean;
  }[];
}

interface RosterManagerProps {
  gameId: string;
  teams: TeamData[];
  onRefresh: () => void;
}

export default function RosterManager({
  gameId,
  teams,
  onRefresh,
}: RosterManagerProps) {
  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Delete "${teamName}" and all its members? This cannot be undone.`)) return;
    await fetch(`/api/games/${gameId}/teams/${teamId}`, { method: "DELETE" });
    onRefresh();
  };

  const handleRoleChange = async (
    teamId: string,
    memberId: string,
    role: RoleName
  ) => {
    await fetch(
      `/api/games/${gameId}/teams/${teamId}/students/${memberId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_role: role }),
      }
    );
    onRefresh();
  };

  const handleAbsenceToggle = async (
    teamId: string,
    memberId: string,
    absent: boolean
  ) => {
    await fetch(
      `/api/games/${gameId}/teams/${teamId}/students/${memberId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_absent: absent }),
      }
    );
    onRefresh();
  };

  const handleRemoveStudent = async (teamId: string, memberId: string) => {
    if (!confirm("Remove this student from the team?")) return;
    await fetch(
      `/api/games/${gameId}/teams/${teamId}/students/${memberId}`,
      { method: "DELETE" }
    );
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Create Team Form */}
      <CreateTeamForm gameId={gameId} onCreated={onRefresh} usedRegionIds={teams.map((t) => t.region_id)} />

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-700 p-8 text-center">
          <p className="text-stone-500">
            No teams yet. Create your first team above.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const region = REGIONS.find((r) => r.id === team.region_id);
            const members = team.team_members ?? [];

            return (
              <div
                key={team.id}
                className="rounded-xl border border-stone-800 bg-stone-900/50 p-5"
              >
                {/* Team Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-200">
                      {team.name}
                    </h3>
                    {team.civilization_name && (
                      <p className="text-sm text-amber-400">
                        🏛️ {team.civilization_name}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-stone-500">
                      {region?.label ?? `Region ${team.region_id}`} · Pop:{" "}
                      {team.population}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-stone-800 px-2 py-0.5 text-xs text-stone-400">
                      {members.length}/5
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="rounded px-1.5 py-0.5 text-xs text-stone-600 transition hover:bg-red-900/40 hover:text-red-400"
                      title="Delete team"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* Members */}
                <div className="mt-4 space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                        member.is_absent
                          ? "border-orange-800 bg-orange-950/30"
                          : "border-stone-800 bg-stone-900/30"
                      }`}
                    >
                      <span
                        className={`flex-1 text-sm ${
                          member.is_absent
                            ? "text-orange-400 line-through"
                            : "text-stone-300"
                        }`}
                      >
                        {member.display_name}
                      </span>
                      <select
                        value={member.assigned_role}
                        onChange={(e) =>
                          handleRoleChange(
                            team.id,
                            member.id,
                            e.target.value as RoleName
                          )
                        }
                        className="rounded border border-stone-700 bg-stone-800 px-2 py-1 text-xs text-stone-300 focus:border-red-500 focus:outline-none"
                      >
                        {Object.entries(ROLES).map(([key, r]) => (
                          <option key={key} value={key}>
                            {r.emoji} {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          handleAbsenceToggle(
                            team.id,
                            member.id,
                            !member.is_absent
                          )
                        }
                        className={`rounded px-2 py-1 text-xs transition ${
                          member.is_absent
                            ? "bg-orange-800 text-orange-200"
                            : "bg-stone-800 text-stone-500 hover:bg-stone-700"
                        }`}
                      >
                        {member.is_absent ? "Absent" : "Present"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveStudent(team.id, member.id)
                        }
                        className="rounded px-1.5 py-1 text-xs text-stone-600 transition hover:bg-red-900/30 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Student */}
                <div className="mt-3 border-t border-stone-800 pt-3">
                  <AddStudentForm
                    gameId={gameId}
                    teamId={team.id}
                    onAdded={onRefresh}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
